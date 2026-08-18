"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

type OrderItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

type OrderStatus =
    | "Order Received"
    | "Preparing"
    | "Out for Delivery"
    | "Delivered";

type OrderResponse = {
    id: string;
    items: OrderItem[];
    customer: { name: string; address: string; phone: string };
    subtotal: number;
    status: OrderStatus;
    createdAt: number;
};

const STATUS_STEPS: OrderStatus[] = [
    "Order Received",
    "Preparing",
    "Out for Delivery",
    "Delivered",
];

const POLL_INTERVAL_MS = 3000;

export default function OrderStatusPage() {
    const params = useParams<{ id: string }>();
    const orderId = params.id;

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { clear } = useCart();

    useEffect(() => {
        clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let isCancelled = false;
        let intervalId: ReturnType<typeof setInterval>;

        async function fetchOrder() {
            try {
                const response = await fetch(`/api/orders/${orderId}`);

                if (!response.ok) {
                    if (!isCancelled) {
                        setError(
                            response.status === 404
                                ? "We couldn't find that order."
                                : "Something went wrong loading your order."
                        );
                    }
                    return;
                }

                const data: OrderResponse = await response.json();
                if (!isCancelled) {
                    setOrder(data);
                    setError(null);

                    // Stop polling once the order reaches a terminal status —
                    // nothing left to update.
                    if (data.status === "Delivered") {
                        clearInterval(intervalId);
                    }
                }
            } catch {
                if (!isCancelled) {
                    setError("We couldn't reach the kitchen. Check your connection.");
                }
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }

        fetchOrder();
        intervalId = setInterval(fetchOrder, POLL_INTERVAL_MS);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [orderId]);

    if (isLoading) {
        return (
            <StatusShell>
                <p className="text-sm text-[var(--ink-muted)]">Loading your order…</p>
            </StatusShell>
        );
    }

    if (error || !order) {
        return (
            <StatusShell>
                <p className="font-display text-xl text-[var(--ink)]">
                    {error ?? "Order not found."}
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-block rounded-full bg-[var(--basil)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--basil-dark)]"
                >
                    Back to menu
                </Link>
            </StatusShell>
        );
    }

    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isDelivered = order.status === "Delivered";

    return (
        <div className="min-h-screen bg-[var(--parchment)]">
            <header className="border-b border-[var(--line)] bg-[var(--parchment)]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="font-display text-xl font-medium tracking-tight text-[var(--ink)]"
                    >
                        Ember Kitchen
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                        Order again
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-6 py-12">
                <p className="text-xs font-medium uppercase tracking-widest text-[var(--basil)]">
                    Order #{order.id}
                </p>
                <h1 className="mt-2 font-display text-3xl text-[var(--ink)]">
                    {isDelivered ? "Delivered — enjoy!" : "Your order is on the way"}
                </h1>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {isDelivered
                        ? "This order has been delivered."
                        : "This page updates automatically as the kitchen moves your order along."}
                </p>

                {/* Status tracker */}
                <ol className="mt-10 space-y-6">
                    {STATUS_STEPS.map((step, index) => {
                        const isComplete = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex && !isDelivered;
                        const isUpcoming = index > currentStepIndex;

                        return (
                            <li key={step} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <span
                                        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${isComplete
                                                ? "border-[var(--basil)] bg-[var(--basil)] text-white"
                                                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
                                            }`}
                                    >
                                        {isComplete && !isCurrent ? "✓" : index + 1}
                                        {isCurrent && (
                                            <span className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--chili)] border-t-transparent" />
                                        )}
                                        {isUpcoming && (
                                            <span className="pulse-dot absolute inset-0 rounded-full border border-dashed border-[var(--line)]" />
                                        )}
                                    </span>
                                    {index < STATUS_STEPS.length - 1 && (
                                        <span
                                            className={`mt-1 h-10 w-px ${index < currentStepIndex ? "bg-[var(--basil)]" : "bg-[var(--line)]"
                                                }`}
                                        />
                                    )}
                                </div>
                                <div className="pt-0.5">
                                    <p
                                        className={`text-sm font-medium ${isComplete ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"
                                            }`}
                                    >
                                        {step}
                                    </p>
                                    {isCurrent && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--chili)]" />
                                            <span className="text-xs uppercase tracking-widest text-[var(--chili)]">
                                                Updating automatically
                                            </span>
                                        </div>
                                    )}
                                    {isUpcoming && (
                                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                                            Waiting to start
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {/* Ticket-style order summary, matching the signature element from the homepage */}
                <div className="mt-12 rounded-sm border border-[var(--line)] bg-[var(--surface)] p-6 font-mono">
                    <div className="mb-4 flex items-center justify-between border-b border-dashed border-[var(--line)] pb-4">
                        <span className="text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                            Ticket
                        </span>
                        <span className="text-xs text-[var(--ink-muted)]">
                            #{order.id}
                        </span>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--ink)]">
                        {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between">
                                <span>
                                    {item.quantity}× {item.name}
                                </span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex justify-between border-t border-dashed border-[var(--line)] pt-4 text-sm font-medium text-[var(--ink)]">
                        <span>Total</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Delivery details */}
                <div className="mt-6 rounded-sm border border-[var(--line)] bg-[var(--surface)] p-6">
                    <h2 className="font-display text-base text-[var(--ink)]">
                        Delivering to
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm">
                        <div className="flex gap-2">
                            <dt className="text-[var(--ink-muted)]">Name</dt>
                            <dd className="text-[var(--ink)]">{order.customer.name}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-[var(--ink-muted)]">Address</dt>
                            <dd className="text-[var(--ink)]">{order.customer.address}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-[var(--ink-muted)]">Phone</dt>
                            <dd className="text-[var(--ink)]">{order.customer.phone}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}

function StatusShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--parchment)] px-6 text-center">
            {children}
        </div>
    );
}