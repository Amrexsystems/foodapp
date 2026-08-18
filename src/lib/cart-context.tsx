"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type MenuItem = {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    image: string;
};

export type CartLine = MenuItem & { quantity: number };

type CartContextValue = {
    lines: CartLine[];
    itemCount: number;
    subtotal: number;
    addItem: (item: MenuItem) => void;
    increment: (id: string) => void;
    decrement: (id: string) => void;
    removeItem: (id: string) => void;
    clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);

    const addItem = (item: MenuItem) => {
        setLines((prev) => {
            const existing = prev.find((l) => l.id === item.id);
            if (existing) {
                return prev.map((l) =>
                    l.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const increment = (id: string) => {
        setLines((prev) =>
            prev.map((l) => (l.id === id ? { ...l, quantity: l.quantity + 1 } : l))
        );
    };

    const decrement = (id: string) => {
        setLines((prev) =>
            prev
                .map((l) => (l.id === id ? { ...l, quantity: l.quantity - 1 } : l))
                .filter((l) => l.quantity > 0)
        );
    };

    const removeItem = (id: string) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
    };

    const clear = () => setLines([]);

    const itemCount = useMemo(
        () => lines.reduce((sum, l) => sum + l.quantity, 0),
        [lines]
    );

    const subtotal = useMemo(
        () => lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
        [lines]
    );

    return (
        <CartContext.Provider
            value={{
                lines,
                itemCount,
                subtotal,
                addItem,
                increment,
                decrement,
                removeItem,
                clear,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}