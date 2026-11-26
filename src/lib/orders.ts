import {
  getOrders,
  type OrderResponse,
  type PaymentMethod,
  type PaymentStatus,
} from "./api-client";

export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipping",
  "delivered",
  "cancelled",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  shipping: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export type Order = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: { title: string; variant: string; qty: number; price: number }[];
};

export function adaptOrder(order: OrderResponse): Order {
  const status = order.status.toLowerCase() as OrderStatus;
  return {
    id: String(order.id),
    customer: order.shippingRecipientName,
    email: "",
    date: order.createdAt,
    total: order.totalAmount,
    status: ORDER_STATUSES.includes(status) ? status : "pending",
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    items: order.items.map((item) => ({
      title: item.productNameSnapshot,
      variant: [item.colorSnapshot, item.sizeSnapshot].filter(Boolean).join(" / "),
      qty: item.quantity,
      price: item.unitPriceSnapshot,
    })),
  };
}

export async function getOrderPage(page = 0, size = 20) {
  const response = await getOrders({ page, size });
  return { ...response, content: response.content.map(adaptOrder) };
}

export function StatusBadgeClass(status: OrderStatus) {
  return `inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold ${STATUS_CLASS[status]}`;
}
