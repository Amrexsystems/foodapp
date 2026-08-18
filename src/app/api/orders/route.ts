import { NextRequest, NextResponse } from "next/server";
import { createOrder, computeStatus, type OrderItem } from "@/lib/orders-store";

type OrderPayload = {
    items: OrderItem[];
    customer: {
        name: string;
        address: string;
        phone: string;
    };
    subtotal: number;
};

export async function POST(request: NextRequest) {
    let body: OrderPayload;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 }
        );
    }

    const validationError = validatePayload(body);
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const order = await createOrder({
        items: body.items,
        customer: {
            name: body.customer.name.trim(),
            address: body.customer.address.trim(),
            phone: body.customer.phone.trim(),
        },
        subtotal: body.subtotal,
    });

    return NextResponse.json(
        { id: order.id, status: computeStatus(order) },
        { status: 201 }
    );
}

function validatePayload(body: OrderPayload): string | null {
    if (!body || typeof body !== "object") {
        return "Request body is missing.";
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        return "Order must contain at least one item.";
    }

    for (const item of body.items) {
        if (
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            typeof item.price !== "number" ||
            item.price <= 0 ||
            typeof item.quantity !== "number" ||
            item.quantity <= 0
        ) {
            return "One or more order items are invalid.";
        }
    }

    const { customer } = body;
    if (!customer || typeof customer !== "object") {
        return "Delivery details are missing.";
    }
    if (!customer.name?.trim()) {
        return "Delivery name is required.";
    }
    if (!customer.address?.trim()) {
        return "Delivery address is required.";
    }
    const phoneDigits = customer.phone?.replace(/\D/g, "") ?? "";
    if (phoneDigits.length < 7) {
        return "A valid phone number is required.";
    }

    if (typeof body.subtotal !== "number" || body.subtotal <= 0) {
        return "Order subtotal is invalid.";
    }

    return null;
}