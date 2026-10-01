import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import {
  getOrderPage,
  ORDER_STATUSES,
  STATUS_LABEL,
  StatusBadgeClass,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Order management — Northline Admin" },
      {
        name: "description",
        content:
          "Admin table of every Northline order with customer, date, total and an editable status.",
      },
      { property: "og:title", content: "Order management — Northline Admin" },
      {
        property: "og:description",
        content: "Review orders and move them through the fulfilment states.",
      },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    // API QUẢN TRỊ GET /admin/orders?page,size,status: server xác thực admin;
    // getOrderPage hiện chỉ đọc đơn của tài khoản đang đăng nhập.
    void getOrderPage().then((page) => setOrders(page.content));
  }, []);

  const rows = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // API QUẢN TRỊ PATCH /admin/orders/:id/status: kiểm tra quyền và chuyển trạng thái
  // hợp lệ ở server; hiện dropdown chỉ thay state cục bộ, không lưu vào database.
  const update = (id: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <AdminNav />
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Status
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
            className="h-12 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Change status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-foreground">{o.id}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-foreground">{o.customer}</span>
                  <span className="text-muted-foreground">{o.email}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={StatusBadgeClass(o.status)}>{STATUS_LABEL[o.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    aria-label={`Change status for ${o.id}`}
                    onChange={(e) => update(o.id, e.target.value as OrderStatus)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No orders with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
