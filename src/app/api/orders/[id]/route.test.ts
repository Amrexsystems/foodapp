import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as createOrderRoute } from "../route";
import { GET } from "./route";

function makeCreateRequest(overrides: Record<string, unknown> = {}) {
    const payload = {
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

    return new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

function makeGetRequest(id: string) {
    return new NextRequest(`http://localhost:3000/api/orders/${id}`);
}

async function createTestOrder(overrides: Record<string, unknown> = {}) {
    const response = await createOrderRoute(makeCreateRequest(overrides));
    return response.json() as Promise<{ id: string; status: string }>;
}

describe("GET /api/orders/[id]", () => {
    it("returns the order with a 200 when the id exists", async () => {
        const created = await createTestOrder();

        const response = await GET(makeGetRequest(created.id), {
            params: Promise.resolve({ id: created.id }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe(created.id);
        expect(data.status).toBe("Order Received");
    });

    it("returns the full order shape: items, customer, subtotal", async () => {
        const created = await createTestOrder({
            customer: {
                name: "Brian Otieno",
                address: "45 Ngong Road, Nairobi",
                phone: "0798765432",
            },
            subtotal: 16,
        });

        const response = await GET(makeGetRequest(created.id), {
            params: Promise.resolve({ id: created.id }),
        });
        const data = await response.json();

        expect(data.items).toHaveLength(1);
        expect(data.items[0].name).toBe("Wood-Fired Margherita");
        expect(data.customer.name).toBe("Brian Otieno");
        expect(data.subtotal).toBe(16);
        expect(data.createdAt).toBeTypeOf("number");
    });

    it("returns 404 when the order id does not exist", async () => {
        const response = await GET(makeGetRequest("nonexistent-id"), {
            params: Promise.resolve({ id: "nonexistent-id" }),
        });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toMatch(/not found/i);
    });

    it("reflects a status that reads directly off the fresh order's timeline", async () => {
        const created = await createTestOrder();

        const response = await GET(makeGetRequest(created.id), {
            params: Promise.resolve({ id: created.id }),
        });
        const data = await response.json();

        // Freshly created, so still within the "Order Received" window.
        expect(data.status).toBe("Order Received");
    });

    it("returns different orders independently, not mixing up state", async () => {
        const first = await createTestOrder({
            customer: { name: "Jane Wanjiru", address: "12 Riverside Drive", phone: "0712345678" },
        });
        const second = await createTestOrder({
            customer: { name: "Brian Otieno", address: "45 Ngong Road", phone: "0798765432" },
        });

        const firstResponse = await GET(makeGetRequest(first.id), { params: Promise.resolve({ id: first.id }) });
        const secondResponse = await GET(makeGetRequest(second.id), { params: Promise.resolve({ id: second.id }) });

        const firstData = await firstResponse.json();
        const secondData = await secondResponse.json();

        expect(firstData.customer.name).toBe("Jane Wanjiru");
        expect(secondData.customer.name).toBe("Brian Otieno");
        expect(firstData.id).not.toBe(secondData.id);
    });
});