import { supabase } from "./supabase-admin";

export type OrderItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

export type OrderStatus =
    | "Order Received"
    | "Preparing"
    | "Out for Delivery"
    | "Delivered";

export type Order = {
    id: string;
    items: OrderItem[];
    customer: {
        name: string;
        address: string;
        phone: string;
    };
    subtotal: number;
    createdAt: number;
};

const STATUS_TIMELINE: { after: number; status: OrderStatus }[] = [
    { after: 0, status: "Order Received" },
    { after: 5, status: "Preparing" },
    { after: 10, status: "Out for Delivery" },
    { after: 15, status: "Delivered" },
];

export function computeStatus(order: Order): OrderStatus {
    const elapsedSeconds = (Date.now() - order.createdAt) / 1000;
    let current: OrderStatus = STATUS_TIMELINE[0].status;
    for (const step of STATUS_TIMELINE) {
        if (elapsedSeconds >= step.after) {
            current = step.status;
        }
    }
    return current;
}

export async function createOrder(
    data: Omit<Order, "id" | "createdAt">
): Promise<Order> {
    const id = generateOrderId();
    const order: Order = { ...data, id, createdAt: Date.now() };

    const { error } = await supabase.from("orders").insert({
        id: order.id,
        items: order.items,
        customer: order.customer,
        subtotal: order.subtotal,
        created_at: order.createdAt,
    });

    if (error) throw new Error(error.message);
    return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return undefined;

    return {
        id: data.id,
        items: data.items,
        customer: data.customer,
        subtotal: data.subtotal,
        createdAt: data.created_at,
    };
}

function generateOrderId(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
}