import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { cancelOrder, getApiErrorMessage, getOrderById, type OrderResponse } from "@/lib/api-client";
import { STATUS_LABEL, StatusBadgeClass, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết đơn hàng — Northline" },
      { name: "description", content: "Xem chi tiết đơn hàng, địa chỉ giao và trạng thái." },
      { property: "og:title", content: "Chi tiết đơn hàng — Northline" },
      { property: "og:description", content: "Chi tiết sản phẩm, thanh toán và trạng thái đơn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { user, loading } = useRequireAuth();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    void getOrderById(Number(id))
      .then((data) => setOrder(data ?? null))
      .catch((reason) => setError(getApiErrorMessage(reason, "Không tải được đơn hàng.")));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) return <div className="container-shop section-y">Đang tải...</div>;

  if (!order) {
    return (
      <div className="container-shop section-y pb-24 md:pb-12">
        <p className="rounded-xl bg-card p-8 text-center text-muted-foreground">
          {error || "Không tìm thấy đơn hàng."}
        </p>
      </div>
    );
  }

  const status = order.status.toLowerCase() as OrderStatus;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← Tất cả đơn hàng
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">#ORD-{order.id}</h1>
        <span className={cn(StatusBadgeClass(status))}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Đặt ngày {new Date(order.createdAt).toLocaleDateString("vi-VN")}
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Sản phẩm</h2>
          <ul className="mt-4 grid gap-3">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 text-sm">
                <span className="text-foreground">
                  {i.productNameSnapshot}
                  <span className="text-muted-foreground">
                    {" "}
                    · {[i.colorSnapshot, i.sizeSnapshot].filter(Boolean).join(" / ")} × {i.quantity}
                  </span>
                </span>
                <span className="font-semibold">{formatPrice(i.subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Địa chỉ giao hàng</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.shippingRecipientName}
            <br />
            {order.shippingPhone}
            <br />
            {order.shippingAddressLine}, {order.shippingCity}
          </p>
          <h2 className="mt-6 text-lg font-semibold text-foreground">Thanh toán</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tạm tính</dt>
              <dd className="font-semibold">{formatPrice(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phương thức</dt>
              <dd className="font-semibold uppercase">{order.paymentMethod}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold">Tổng</dt>
              <dd className="text-xl font-bold text-primary">{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>

          {status === "pending" && (
            <Button
              variant="secondary"
              size="md"
              className="mt-6 w-full"
              onClick={async () => {
                try {
                  await cancelOrder(order.id);
                  load();
                } catch (reason) {
                  setError(getApiErrorMessage(reason, "Không hủy được đơn."));
                }
              }}
            >
              Hủy đơn
            </Button>
          )}
          <Button variant="tertiary" size="sm" asChild className="mt-2 w-full">
            <Link to="/products" search={{}}>
              Liên hệ shop
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
