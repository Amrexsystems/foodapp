import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart, type MenuItem } from "./cart-context";
import type { ReactNode } from "react";

const margherita: MenuItem = {
    id: "margherita",
    name: "Wood-Fired Margherita",
    category: "Pizza",
    description: "San Marzano tomato, fior di latte, torn basil, chili oil.",
    price: 16,
    image: "https://example.com/margherita.jpg",
};

const smashBurger: MenuItem = {
    id: "smash-burger",
    name: "Smash Burger, Aged Cheddar",
    category: "Burgers",
    description: "Double patty, caramelized onion, pickles, house sauce.",
    price: 14,
    image: "https://example.com/burger.jpg",
};

function wrapper({ children }: { children: ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
}

describe("useCart", () => {
    it("starts empty", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.lines).toHaveLength(0);
        expect(result.current.itemCount).toBe(0);
        expect(result.current.subtotal).toBe(0);
    });

    it("adds a new item with quantity 1", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));

        expect(result.current.lines).toHaveLength(1);
        expect(result.current.lines[0].quantity).toBe(1);
        expect(result.current.itemCount).toBe(1);
    });

    it("increments quantity instead of duplicating when adding the same item again", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.addItem(margherita));

        expect(result.current.lines).toHaveLength(1);
        expect(result.current.lines[0].quantity).toBe(2);
        expect(result.current.itemCount).toBe(2);
    });

    it("increments a specific line's quantity", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.increment(margherita.id));

        expect(result.current.lines[0].quantity).toBe(2);
    });

    it("decrements a line's quantity", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.increment(margherita.id));
        act(() => result.current.decrement(margherita.id));

        expect(result.current.lines[0].quantity).toBe(1);
    });

    it("removes the line entirely when decrementing to zero", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.decrement(margherita.id));

        expect(result.current.lines).toHaveLength(0);
        expect(result.current.itemCount).toBe(0);
    });

    it("does nothing when decrementing an item that isn't in the cart", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.decrement("not-in-cart"));

        expect(result.current.lines).toHaveLength(0);
    });

    it("calculates itemCount as the sum of quantities across distinct lines", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.addItem(margherita));
        act(() => result.current.addItem(smashBurger));

        expect(result.current.lines).toHaveLength(2);
        expect(result.current.itemCount).toBe(3);
    });

    it("calculates subtotal as price times quantity summed across lines", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita)); // 16
        act(() => result.current.addItem(margherita)); // 16 -> qty 2 = 32
        act(() => result.current.addItem(smashBurger)); // 14

        expect(result.current.subtotal).toBe(46);
    });

    it("clears all lines", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => result.current.addItem(margherita));
        act(() => result.current.addItem(smashBurger));
        act(() => result.current.clear());

        expect(result.current.lines).toHaveLength(0);
        expect(result.current.itemCount).toBe(0);
        expect(result.current.subtotal).toBe(0);
    });

    it("throws when useCart is called outside of a CartProvider", () => {
        // Suppress the expected React error log for this negative case.
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => renderHook(() => useCart())).toThrow(
            "useCart must be used within CartProvider"
        );

        consoleError.mockRestore();
    });
});