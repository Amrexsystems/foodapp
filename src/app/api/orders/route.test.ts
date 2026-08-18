import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const { supabaseMockState } = vi.hoisted(() => {
    return { supabaseMockState: { rows: new Map<string, Record<string, unknown>>() } };
});

vi.mock("@/lib/supabase-admin", () => ({
    supabase: {
        from: (_table: string) => ({
            insert: async (row: Record<string, unknown>) => {
                supabaseMockState.rows.set(row.id as string, row);
                return { error: null };
            },
            select: () => ({
                eq: (_column: string, value: string) => ({
                    maybeSingle: async () => {
                        const row = supabaseMockState.rows.get(value);
                        return { data: row ?? null, error: null };
                    },
                }),
            }),
        }),
    },
}));

import { POST } from "./route";

function makeRequest(body: unknown, raw?: string) {
    return new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw ?? JSON.stringify(body),
    });
}

function validPayload(overrides: Record<string, unknown> = {}) {
    return {
        items: [
            { id: "margherita", name: "Wood-Fired Margherita", price: 16, quantity: 1 },
        ],
        customer: {
            name: "Jane Wanjiru",
            address: "12 Riverside Drive, Nairobi",
            phone: "0712345678",
        },
        subtotal: 16,
        ...overrides,
    };
}

beforeEach(() => {
    supabaseMockState.rows.clear();
});

describe("POST /api/orders", () => {
    it("creates an order and returns 201 with an id and status", async () => {
        const response = await POST(makeRequest(validPayload()));
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.id).toBeTruthy();
        expect(data.status).toBe("Order Received");
    });

    it("rejects malformed JSON with 400", async () => {
        const response = await POST(makeRequest(undefined, "{not valid json"));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/valid JSON/i);
    });

    it("rejects an order with no items", async () => {
        const response = await POST(makeRequest(validPayload({ items: [] })));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/at least one item/i);
    });

    it("rejects an item with a negative price", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    items: [
                        { id: "margherita", name: "Wood-Fired Margherita", price: -16, quantity: 1 },
                    ],
                })
            )
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/items are invalid/i);
    });

    it("rejects an item with a zero or negative quantity", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    items: [
                        { id: "margherita", name: "Wood-Fired Margherita", price: 16, quantity: 0 },
                    ],
                })
            )
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/items are invalid/i);
    });

    it("rejects an order missing the customer name", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    customer: { name: "", address: "12 Riverside Drive", phone: "0712345678" },
                })
            )
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/name is required/i);
    });

    it("rejects an order missing the delivery address", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    customer: { name: "Jane Wanjiru", address: "  ", phone: "0712345678" },
                })
            )
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/address is required/i);
    });

    it("rejects an order with a phone number that is too short", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    customer: { name: "Jane Wanjiru", address: "12 Riverside Drive", phone: "123" },
                })
            )
        );
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/valid phone number/i);
    });

    it("accepts a phone number containing spaces and dashes, counting digits only", async () => {
        const response = await POST(
            makeRequest(
                validPayload({
                    customer: {
                        name: "Jane Wanjiru",
                        address: "12 Riverside Drive",
                        phone: "071-234-5678",
                    },
                })
            )
        );

        expect(response.status).toBe(201);
    });

    it("rejects an order with a zero or negative subtotal", async () => {
        const response = await POST(makeRequest(validPayload({ subtotal: 0 })));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/subtotal is invalid/i);
    });

    it("rejects an order with no customer object at all", async () => {
        const response = await POST(makeRequest(validPayload({ customer: undefined })));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/delivery details are missing/i);
    });
});