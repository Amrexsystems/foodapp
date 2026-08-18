import { NextRequest, NextResponse } from "next/server";
import { getOrder, computeStatus } from "@/lib/orders-store";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const order = getOrder(id);

    if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
        id: order.id,
        items: order.items,
        customer: order.customer,
        subtotal: order.subtotal,
        status: computeStatus(order),
        createdAt: order.createdAt,
    });
}