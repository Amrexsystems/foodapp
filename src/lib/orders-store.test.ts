import { describe, it, expect, beforeEach, vi } from "vitest";

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

import { createOrder, getOrder, computeStatus, type Order } from "./orders-store";

function makeOrderInput(overrides: Partial<Omit<Order, "id" | "createdAt">> = {}) {
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

describe("createOrder", () => {
    it("stores the order and returns it with an id and createdAt", async () => {
        const order = await createOrder(makeOrderInput());

        expect(order.id).toBeTruthy();
        expect(typeof order.id).toBe("string");
        expect(order.createdAt).toBeTypeOf("number");
        expect(order.items).toHaveLength(1);
        expect(order.customer.name).toBe("Jane Wanjiru");
    });

    it("makes the order retrievable via getOrder", async () => {
        const created = await createOrder(makeOrderInput());
        const fetched = await getOrder(created.id);

        expect(fetched).toBeDefined();
        expect(fetched?.id).toBe(created.id);
    });

    it("generates a different id for each order", async () => {
        const first = await createOrder(makeOrderInput());
        const second = await createOrder(makeOrderInput());

        expect(first.id).not.toBe(second.id);
    });

    it("preserves multiple line items and their quantities", async () => {
        const order = await createOrder(
            makeOrderInput({
                items: [
                    { id: "margherita", name: "Wood-Fired Margherita", price: 16, quantity: 2 },
                    { id: "smash-burger", name: "Smash Burger, Aged Cheddar", price: 14, quantity: 1 },
                ],
                subtotal: 46,
            })
        );

        expect(order.items).toHaveLength(2);
        expect(order.items[0].quantity).toBe(2);
        expect(order.subtotal).toBe(46);
    });
});

describe("getOrder", () => {
    it("returns undefined for an id that does not exist", async () => {
        expect(await getOrder("does-not-exist")).toBeUndefined();
    });
});

describe("computeStatus", () => {
    it("returns 'Order Received' immediately after creation", async () => {
        const order = await createOrder(makeOrderInput());
        expect(computeStatus(order)).toBe("Order Received");
    });

    it("advances to 'Preparing' after 5 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-1", createdAt: Date.now() - 5_000 };
        expect(computeStatus(order)).toBe("Preparing");
    });

    it("advances to 'Out for Delivery' after 10 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-2", createdAt: Date.now() - 10_000 };
        expect(computeStatus(order)).toBe("Out for Delivery");
    });

    it("advances to 'Delivered' after 15 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-3", createdAt: Date.now() - 15_000 };
        expect(computeStatus(order)).toBe("Delivered");
    });

    it("does not advance a status early, at 4 seconds it is still 'Order Received'", () => {
        const order: Order = { ...makeOrderInput(), id: "test-5", createdAt: Date.now() - 4_000 };
        expect(computeStatus(order)).toBe("Order Received");
    });

    it("stays at 'Delivered' well past the 90 second mark", () => {
        const order: Order = {
            ...makeOrderInput(),
            id: "test-4",
            createdAt: Date.now() - 10 * 60_000,
        };
        expect(computeStatus(order)).toBe("Delivered");
    });

    it("does not advance a status early, at 14 seconds it is still 'Order Received'", () => {
        const order: Order = { ...makeOrderInput(), id: "test-5", createdAt: Date.now() - 14_000 };
        expect(computeStatus(order)).toBe("Order Received");
    });
});