import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import {
  cancelOrder,
  getApiErrorMessage,
  getOrderById,
  getPaymentInfo,
  startMomoPayment,
  type OrderResponse,
  type PaymentInfo,
} from "@/lib/api-client";
import {
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  failureMessage,
  paymentBadgeClass,
  useCountdown,
} from "@/lib/payments";
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
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    void getOrderById(Number(id))
      .then((data) => {
        setOrder(data ?? null);
        return data?.paymentMethod === "momo"
          ? getPaymentInfo(data.id).then(setPayment)
          : undefined;
      })
      .catch((reason) => setError(getApiErrorMessage(reason, "Không tải được đơn hàng.")));
  }, [id]);

  const payAgain = async () => {
    if (!order || paying) return;
    setPaying(true);
    setError("");
    try {
      const link = await startMomoPayment(order.id);
      window.location.assign(link.payUrl);
    } catch (reason) {
      setError(
        getApiErrorMessage(reason, "Chưa tạo được link thanh toán. Bạn thử lại sau ít phút."),
      );
      setPaying(false);
      load();
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) return <div className="container-shop section-y">Đang tải...</div>;

  if (!order) {
    return (
      <div className="container-shop section-y pb-24 md:pb-12">
        <p className="hairline bg-card p-8 text-center text-muted-foreground">
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
        <h1 className="text-h1 text-foreground">#ORD-{order.id}</h1>
        <span className={cn(StatusBadgeClass(status))}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Đặt ngày {new Date(order.createdAt).toLocaleDateString("vi-VN")}
      </p>

      {error && (
        <p className="mt-4 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="hairline bg-card p-6">
          <h2 className="text-h3 text-foreground">Sản phẩm</h2>
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

        <aside className="h-fit hairline bg-card p-6">
          <h2 className="text-h3 text-foreground">Địa chỉ giao hàng</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.shippingRecipientName}
            <br />
            {order.shippingPhone}
            <br />
            {order.shippingAddressLine}, {order.shippingCity}
          </p>
          <h2 className="mt-6 text-h3 text-foreground">Thanh toán</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tạm tính</dt>
              <dd className="font-semibold">{formatPrice(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phương thức</dt>
              <dd className="text-right font-semibold">{METHOD_LABEL[order.paymentMethod]}</dd>
            </div>
            {order.paymentMethod === "momo" && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd>
                  <span className={paymentBadgeClass(order.paymentStatus)}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                  </span>
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-semibold">Tổng</dt>
              <dd className="tabular text-xl font-semibold text-foreground">
                {formatPrice(order.totalAmount)}
              </dd>
            </div>
          </dl>

          {payment?.canRetry && (
            <MomoRetry payment={payment} paying={paying} onPay={() => void payAgain()} />
          )}

          {status === "pending" && order.paymentStatus !== "paid" && (
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

function MomoRetry({
  payment,
  paying,
  onPay,
}: {
  payment: PaymentInfo;
  paying: boolean;
  onPay: () => void;
}) {
  const left = useCountdown(payment.expiresAt);
  return (
    <div className="mt-6 grid gap-3">
      {payment.lastAttemptStatus === "failed" && (
        <p className="text-body-sm text-muted-foreground">
          {failureMessage(payment.lastResultCode)}
        </p>
      )}
      {left && left.ms > 0 && (
        <p className="text-body-sm text-muted-foreground" aria-live="off">
          Đơn được giữ thêm{" "}
          <span className="tabular font-semibold text-foreground">{left.label}</span>. Sau đó đơn sẽ
          tự hủy và hàng được trả lại kho.
        </p>
      )}
      <Button variant="primary" size="md" className="w-full" onClick={onPay} disabled={paying}>
        {paying ? "Đang mở MoMo…" : "Thanh toán MoMo"}
      </Button>
    </div>
  );
}
