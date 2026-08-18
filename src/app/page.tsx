"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, type MenuItem } from "@/lib/cart-context";
import { X } from "lucide-react";

const menuItems: MenuItem[] = [
  {
    id: "margherita",
    name: "Wood-Fired Margherita",
    category: "Pizza",
    description: "San Marzano tomato, fior di latte, torn basil, chili oil.",
    price: 16,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "smash-burger",
    name: "Smash Burger, Aged Cheddar",
    category: "Burgers",
    description: "Double patty, caramelized onion, pickles, house sauce.",
    price: 14,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "broccolini-salad",
    name: "Charred Broccolini Salad",
    category: "Salads",
    description: "Lemon, chili flake, shaved pecorino, toasted almond.",
    price: 12,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cacio-e-pepe",
    name: "Cacio e Pepe",
    category: "Pasta",
    description: "Fresh tonnarelli, pecorino romano, cracked black pepper.",
    price: 17,
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "nigiri-selection",
    name: "Chef's Nigiri Selection",
    category: "Sushi",
    description: "Six pieces, chef's choice, pickled ginger, wasabi.",
    price: 22,
    image:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "burnt-cheesecake",
    name: "Basque Burnt Cheesecake",
    category: "Dessert",
    description: "Caramelized top, custard center, sea salt.",
    price: 9,
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
  },
];

const categories = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))];

export default function Home() {
  const { lines, itemCount, subtotal, addItem, increment, decrement, removeItem } =
    useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const visibleItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const quantityOf = (id: string) =>
    lines.find((l) => l.id === id)?.quantity ?? 0;

  return (
    <div className="min-h-screen bg-[var(--parchment)] pb-24 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--parchment)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-medium tracking-tight text-[var(--ink)]">
            Ember Kitchen
          </span>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`View order, ${itemCount} items`}
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--basil)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--basil)] lg:hidden"
          >
            <span className="font-mono">{itemCount}</span>
            <span>Order</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[1fr_340px] lg:gap-10">
        {/* Menu */}
        <main>
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--basil)] ${activeCategory === category
                  ? "border-[var(--basil)] bg-[var(--basil)] text-white"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--basil)]"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {visibleItems.map((item) => {
              const qty = quantityOf(item.id);
              return (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-sm border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 shrink-0 rounded-sm object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-1 flex-col">
                    <p className="text-xs uppercase tracking-widest text-[var(--basil)]">
                      {item.category}
                    </p>
                    <h3 className="mt-1 font-display text-base text-[var(--ink)]">
                      {item.name}
                    </h3>
                    <p className="mt-1 flex-1 text-sm leading-snug text-[var(--ink-muted)]">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-mono text-sm text-[var(--ink)]">
                        ${item.price.toFixed(2)}
                      </span>
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addItem(item)}
                          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--basil)] hover:bg-[var(--basil)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--basil)]"
                        >
                          Add to order
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 rounded-full border border-[var(--line)] px-2 py-1">
                          <button
                            type="button"
                            onClick={() => decrement(item.id)}
                            aria-label={`Remove one ${item.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--parchment)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--basil)]"
                          >
                            −
                          </button>
                          <span className="font-mono text-sm text-[var(--ink)]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => increment(item.id)}
                            aria-label={`Add one more ${item.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--parchment)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--basil)]"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        {/* Cart — sidebar on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CartPanel
              lines={lines}
              subtotal={subtotal}
              increment={increment}
              decrement={decrement}
              removeItem={removeItem}
            />
          </div>
        </aside>
      </div>

      {/* Mobile sticky order bar */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] px-6 py-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-full bg-[var(--basil)] px-5 py-3 text-sm font-medium text-white"
          >
            <span>
              {itemCount} item{itemCount > 1 ? "s" : ""}
            </span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile cart drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close order panel"
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-[var(--ink)]/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--parchment)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-[var(--ink)]">
                Your order
              </h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close"
                className="text-sm text-[var(--ink-muted)]"
              >
                Close
              </button>
            </div>
            <CartPanel
              lines={lines}
              subtotal={subtotal}
              increment={increment}
              decrement={decrement}
              removeItem={removeItem}
              bare
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CartPanel({
  lines,
  subtotal,
  increment,
  decrement,
  removeItem,
  bare = false,
}: {
  lines: ReturnType<typeof useCart>["lines"];
  subtotal: number;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  removeItem: (id: string) => void;
  bare?: boolean;
}) {
  return (
    <div
      className={
        bare
          ? ""
          : "rounded-sm border border-[var(--line)] bg-[var(--surface)] p-5"
      }
    >
      {!bare && (
        <h2 className="font-display text-lg text-[var(--ink)]">
          Your order
        </h2>
      )}

      {lines.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Your order is empty. Add a plate from the menu to get started.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--ink)]">
                  {line.name}
                </p>
                <p className="font-mono text-xs text-[var(--ink-muted)]">
                  ${line.price.toFixed(2)} each
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-[var(--line)] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => decrement(line.id)}
                    aria-label={`Remove one ${line.name}`}
                    className="flex h-5 w-5 items-center justify-center text-[var(--ink)]"
                  >
                    −
                  </button>
                  <span className="font-mono text-xs text-[var(--ink)]">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => increment(line.id)}
                    aria-label={`Add one more ${line.name}`}
                    className="flex h-5 w-5 items-center justify-center text-[var(--ink)]"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  aria-label={`Remove ${line.name} from order`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--chili)]/10 hover:text-[var(--chili)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <span className="text-sm text-[var(--ink-muted)]">Subtotal</span>
        <span className="font-mono text-base text-[var(--ink)]">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <Link
        href="/checkout"
        aria-disabled={lines.length === 0}
        className={`mt-4 block w-full rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${lines.length === 0
          ? "pointer-events-none bg-[var(--line)] text-[var(--ink-muted)]"
          : "bg-[var(--basil)] text-white hover:bg-[var(--basil-dark)]"
          }`}
      >
        Proceed to checkout
      </Link>
    </div>
  );
}