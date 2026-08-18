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

// In-memory store. Resets whenever the server restarts — acceptable for this
// assessment's scope, called out explicitly as a valid option in the brief.
const orders = new Map<string, Order>();

// Status timeline, in seconds since the order was placed.
const STATUS_TIMELINE: { after: number; status: OrderStatus }[] = [
  { after: 0, status: "Order Received" },
  { after: 15, status: "Preparing" },
  { after: 45, status: "Out for Delivery" },
  { after: 90, status: "Delivered" },
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

export function createOrder(
  data: Omit<Order, "id" | "createdAt">
): Order {
  const id = generateOrderId();
  const order: Order = { ...data, id, createdAt: Date.now() };
  orders.set(id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

function generateOrderId(): string {
  // Short, human-readable, ticket-style id (e.g. "0148").
  return String(Math.floor(1000 + Math.random() * 9000));
}