"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

type FormState = {
    name: string;
    address: string;
    phone: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Checkout() {
    const { lines, subtotal, clear } = useCart();
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        name: "",
        address: "",
        phone: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const updateField = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = "Enter the name for this order.";
        }

        if (!form.address.trim()) {
            nextErrors.address = "Enter a delivery address.";
        }

        const phoneDigits = form.phone.replace(/\D/g, "");
        if (!form.phone.trim()) {
            nextErrors.phone = "Enter a phone number.";
        } else if (phoneDigits.length < 7) {
            nextErrors.phone = "Enter a valid phone number.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (lines.length === 0) return;
        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: lines.map((line) => ({
                        id: line.id,
                        name: line.name,
                        price: line.price,
                        quantity: line.quantity,
                    })),
                    customer: form,
                    subtotal,
                }),
            });

            if (!response.ok) {
                throw new Error("Order could not be placed.");
            }

            const data = await response.json();
            clear();
            router.push(`/order/${data.id}`);
        } catch {
            setSubmitError(
                "We couldn't place your order. Check your connection and try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (lines.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--parchment)] px-6 text-center">
                <p className="font-display text-xl text-[var(--ink)]">
                    Your order is empty.
                </p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Add a plate from the menu before checking out.
                </p>
                <Link
                    href="/"
                    className="mt-6 rounded-full bg-[var(--basil)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--basil-dark)]"
                >
                    Back to menu
                </Link>
            </div>
        );
    }

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
                        Edit order
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-10 lg:grid lg:grid-cols-[1fr_340px] lg:gap-10">
                {/* Delivery details form */}
                <main>
                    <h1 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">
                        Delivery details
                    </h1>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        We'll use this to get your order to you.
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
                        <Field
                            label="Full name"
                            name="name"
                            value={form.name}
                            onChange={(v) => updateField("name", v)}
                            error={errors.name}
                            placeholder="Jane Wanjiru"
                            autoComplete="name"
                        />

                        <Field
                            label="Delivery address"
                            name="address"
                            value={form.address}
                            onChange={(v) => updateField("address", v)}
                            error={errors.address}
                            placeholder="Apartment, street, area"
                            autoComplete="street-address"
                            as="textarea"
                        />

                        <Field
                            label="Phone number"
                            name="phone"
                            value={form.phone}
                            onChange={(v) => updateField("phone", v)}
                            error={errors.phone}
                            placeholder="07XX XXX XXX"
                            autoComplete="tel"
                            type="tel"
                        />

                        {submitError && (
                            <p className="text-sm text-[var(--chili)]">{submitError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-full bg-[var(--basil)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--basil-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {isSubmitting ? "Placing order…" : "Place order"}
                        </button>
                    </form>
                </main>

                {/* Order summary */}
                <aside className="mt-10 lg:mt-0">
                    <div className="sticky top-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] p-5">
                        <h2 className="font-display text-lg text-[var(--ink)]">
                            Order summary
                        </h2>
                        <ul className="mt-4 space-y-3">
                            {lines.map((line) => (
                                <li key={line.id} className="flex justify-between gap-3 text-sm">
                                    <span className="text-[var(--ink)]">
                                        {line.quantity}× {line.name}
                                    </span>
                                    <span className="shrink-0 font-mono text-[var(--ink-muted)]">
                                        ${(line.price * line.quantity).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                            <span className="text-sm text-[var(--ink-muted)]">Total</span>
                            <span className="font-mono text-base text-[var(--ink)]">
                                ${subtotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    error,
    placeholder,
    autoComplete,
    type = "text",
    as = "input",
}: {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    autoComplete?: string;
    type?: string;
    as?: "input" | "textarea";
}) {
    const baseClasses = `w-full rounded-sm border bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--basil)] ${error ? "border-[var(--chili)]" : "border-[var(--line)]"
        }`;

    return (
        <div>
            <label
                htmlFor={name}
                className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
            >
                {label}
            </label>
            {as === "textarea" ? (
                <textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    rows={2}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${name}-error` : undefined}
                    className={baseClasses}
                />
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${name}-error` : undefined}
                    className={baseClasses}
                />
            )}
            {error && (
                <p id={`${name}-error`} className="mt-1.5 text-xs text-[var(--chili)]">
                    {error}
                </p>
            )}
        </div>
    );
}