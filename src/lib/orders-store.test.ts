import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("createOrder", () => {
    it("stores the order and returns it with an id and createdAt", () => {
        const order = createOrder(makeOrderInput());

        expect(order.id).toBeTruthy();
        expect(typeof order.id).toBe("string");
        expect(order.createdAt).toBeTypeOf("number");
        expect(order.items).toHaveLength(1);
        expect(order.customer.name).toBe("Jane Wanjiru");
    });

    it("makes the order retrievable via getOrder", () => {
        const created = createOrder(makeOrderInput());
        const fetched = getOrder(created.id);

        expect(fetched).toBeDefined();
        expect(fetched?.id).toBe(created.id);
    });

    it("generates a different id for each order", () => {
        const first = createOrder(makeOrderInput());
        const second = createOrder(makeOrderInput());

        expect(first.id).not.toBe(second.id);
    });

    it("preserves multiple line items and their quantities", () => {
        const order = createOrder(
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
    it("returns undefined for an id that does not exist", () => {
        expect(getOrder("does-not-exist")).toBeUndefined();
    });
});

describe("computeStatus", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it("returns 'Order Received' immediately after creation", () => {
        const order = createOrder(makeOrderInput());
        expect(computeStatus(order)).toBe("Order Received");
    });

    it("advances to 'Preparing' after 15 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-1", createdAt: Date.now() };
        vi.advanceTimersByTime(15_000);
        expect(computeStatus(order)).toBe("Preparing");
    });

    it("advances to 'Out for Delivery' after 45 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-2", createdAt: Date.now() };
        vi.advanceTimersByTime(45_000);
        expect(computeStatus(order)).toBe("Out for Delivery");
    });

    it("advances to 'Delivered' after 90 seconds", () => {
        const order: Order = { ...makeOrderInput(), id: "test-3", createdAt: Date.now() };
        vi.advanceTimersByTime(90_000);
        expect(computeStatus(order)).toBe("Delivered");
    });

    it("stays at 'Delivered' well past the 90 second mark", () => {
        const order: Order = { ...makeOrderInput(), id: "test-4", createdAt: Date.now() };
        vi.advanceTimersByTime(10 * 60_000);
        expect(computeStatus(order)).toBe("Delivered");
    });

    it("does not advance a status early, at 14 seconds it is still 'Order Received'", () => {
        const order: Order = { ...makeOrderInput(), id: "test-5", createdAt: Date.now() };
        vi.advanceTimersByTime(14_000);
        expect(computeStatus(order)).toBe("Order Received");
    });
});