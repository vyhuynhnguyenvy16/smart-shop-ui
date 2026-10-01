import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { cancelOrder, getApiErrorMessage } from "@/lib/api-client";
import { getOrderPage, STATUS_LABEL, StatusBadgeClass, type Order, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Đơn hàng của tôi — Northline" },
      { name: "description", content: "Theo dõi trạng thái tất cả đơn hàng Northline của bạn." },
      { property: "og:title", content: "Đơn hàng của tôi — Northline" },
      { property: "og:description", content: "Danh sách và trạng thái đơn hàng." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderListPage,
});

const TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "shipping", label: "Đang giao" },
  { id: "delivered", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
];

function OrderListPage() {
  const { user, loading } = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void getOrderPage()
      .then((page) => setOrders(page.content))
      .catch((reason) => setError(getApiErrorMessage(reason, "Không tải được đơn hàng.")));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) return <div className="container-shop section-y">Đang tải...</div>;

  const shown = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Đơn hàng của tôi</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 px-4 text-sm font-semibold",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-xl bg-card p-8 text-center text-muted-foreground">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {shown.map((o) => (
            <article key={o.id} className="rounded-xl bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base font-semibold text-foreground">#ORD-{o.id}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(o.date).toLocaleDateString("vi-VN")}
                </span>
                <span className={cn(StatusBadgeClass(o.status), "ml-auto")}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {o.items.map((i, index) => (
                  <li key={index}>
                    {i.title} · {i.variant} × {i.qty} — {formatPrice(i.price * i.qty)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-lg font-bold text-primary">{formatPrice(o.total)}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/orders/$id" params={{ id: o.id }}>
                      Xem chi tiết
                    </Link>
                  </Button>
                  {o.status === "pending" && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await cancelOrder(Number(o.id));
                          load();
                        } catch (reason) {
                          setError(getApiErrorMessage(reason, "Không hủy được đơn."));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Hủy đơn
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
