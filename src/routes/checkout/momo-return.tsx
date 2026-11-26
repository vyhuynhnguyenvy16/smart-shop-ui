import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/products";
import { useRequireAuth } from "@/lib/auth";
import { pageHead } from "@/lib/seo";
import {
  getApiErrorMessage,
  getPaymentInfo,
  startMomoPayment,
  type PaymentInfo,
} from "@/lib/api-client";
import { failureMessage, momoView, useCountdown } from "@/lib/payments";

/** Polling: every 2 s for up to 60 s, then the shopper can check again by hand. */
const POLL_EVERY_MS = 2000;
const POLL_FOR_MS = 60000;

export const Route = createFileRoute("/checkout/momo-return")({
  // MoMo appends its own query parameters (orderId, resultCode, signature…) to this URL. They are ignored on purpose:
  // only VESTRA's own order id ("order") is read, and the real status always comes from the server.
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Number(search["order"]);
    return { order: Number.isInteger(raw) && raw > 0 ? raw : undefined };
  },
  head: () =>
    pageHead({
      title: "Kết quả thanh toán MoMo — Northline",
      description: "Trạng thái thanh toán đơn hàng qua ví MoMo.",
      path: "/checkout/momo-return",
      noindex: true,
    }),
  component: MomoReturnPage,
});

function MomoReturnPage() {
  const { order } = Route.useSearch();
  const { user, loading } = useRequireAuth();
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState("");
  const [pollingDone, setPollingDone] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const startedAt = useRef(Date.now());

  const load = useCallback(async () => {
    if (!order) return null;
    try {
      const next = await getPaymentInfo(order);
      setInfo(next);
      setError("");
      return next;
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Không tải được trạng thái thanh toán."));
      return null;
    }
  }, [order]);

  useEffect(() => {
    if (loading || !user || !order) return;
    let cancelled = false;
    let timer: number | undefined;
    const tick = async () => {
      const next = await load();
      if (cancelled) return;
      const settled = next && momoView(next, false) !== "checking";
      if (settled || Date.now() - startedAt.current >= POLL_FOR_MS) {
        setPollingDone(true);
        return;
      }
      timer = window.setTimeout(() => void tick(), POLL_EVERY_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loading, user, order, load]);

  const checkAgain = async () => {
    setPollingDone(false);
    await load();
    setPollingDone(true);
  };

  const payAgain = async () => {
    if (!order || retrying) return;
    setRetrying(true);
    setError("");
    try {
      const link = await startMomoPayment(order);
      window.location.assign(link.payUrl);
    } catch (reason) {
      setError(
        getApiErrorMessage(reason, "Chưa tạo được link thanh toán. Bạn thử lại sau ít phút."),
      );
      setRetrying(false);
      void load();
    }
  };

  if (loading || !user) {
    return <div className="container-shop section-y text-muted-foreground">Đang tải…</div>;
  }

  if (!order) {
    return (
      <Shell>
        <h1 className="text-h1 text-foreground">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Đường dẫn thiếu mã đơn. Bạn xem lại đơn trong mục Đơn hàng nhé.
        </p>
        <div className="mt-6">
          <Button variant="primary" size="lg" asChild>
            <Link to="/orders">Xem đơn hàng</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const view = momoView(info, pollingDone);

  return (
    <Shell>
      <div aria-live="polite" role="status">
        {view === "checking" && (
          <>
            <StatusIcon tone="primary">
              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            </StatusIcon>
            <h1 className="mt-4 text-h1 text-foreground">Đang xác nhận thanh toán</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Shop đang chờ MoMo xác nhận đơn <OrderRef id={order} />. Thường chỉ mất vài giây.
            </p>
          </>
        )}

        {view === "paid" && info && (
          <>
            <StatusIcon tone="success">
              <Check className="h-7 w-7 text-success" aria-hidden="true" />
            </StatusIcon>
            <h1 className="mt-4 text-h1 text-foreground">Thanh toán thành công</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Shop đã nhận {formatPrice(info.amount)} qua MoMo cho đơn <OrderRef id={order} />. Đơn
              đã được xác nhận và sẽ sớm được giao.
            </p>
          </>
        )}

        {view === "failed" && info && (
          <>
            <StatusIcon tone="destructive">
              <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
            </StatusIcon>
            <h1 className="mt-4 text-h1 text-foreground">Chưa thanh toán được</h1>
            <p className="mt-2 text-base text-muted-foreground">
              {failureMessage(info.lastResultCode)}
            </p>
            <Countdown deadline={info.expiresAt} />
          </>
        )}

        {view === "unconfirmed" && info && (
          <>
            <StatusIcon tone="warning">
              <Clock className="h-7 w-7 text-warning" aria-hidden="true" />
            </StatusIcon>
            <h1 className="mt-4 text-h1 text-foreground">Chưa nhận được xác nhận từ MoMo</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Nếu bạn đã thanh toán, đơn sẽ tự cập nhật trong vài phút; bạn không cần trả lại lần
              nữa. Nếu chưa, bạn có thể thanh toán ngay.
            </p>
            <Countdown deadline={info.expiresAt} />
          </>
        )}

        {view === "closed" && info && (
          <>
            <StatusIcon tone="destructive">
              <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
            </StatusIcon>
            <h1 className="mt-4 text-h1 text-foreground">
              {info.status === "expired" ? "Đơn đã hết hạn thanh toán" : "Đơn đã được hủy"}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Đơn <OrderRef id={order} /> không còn chờ thanh toán và hàng đã được trả lại kho. Bạn
              có thể đặt lại từ giỏ hàng.
            </p>
          </>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-left text-body-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(view === "failed" || view === "unconfirmed") && info?.canRetry ? (
          <Button variant="primary" size="lg" onClick={() => void payAgain()} disabled={retrying}>
            {retrying ? "Đang mở MoMo…" : "Thanh toán lại"}
          </Button>
        ) : view === "closed" ? (
          <Button variant="primary" size="lg" asChild>
            <Link to="/products" search={{}}>
              Tiếp tục mua sắm
            </Link>
          </Button>
        ) : (
          <Button variant="primary" size="lg" asChild>
            <Link to="/orders/$id" params={{ id: String(order) }}>
              Xem đơn hàng
            </Link>
          </Button>
        )}
        {view === "unconfirmed" ? (
          <Button variant="secondary" size="lg" onClick={() => void checkAgain()}>
            Kiểm tra lại
          </Button>
        ) : view === "paid" ? (
          <Button variant="secondary" size="lg" asChild>
            <Link to="/products" search={{}}>
              Tiếp tục mua sắm
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="lg" asChild>
            <Link to="/orders/$id" params={{ id: String(order) }}>
              Chi tiết đơn
            </Link>
          </Button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <div className="mx-auto max-w-lg hairline bg-card p-8 text-center">{children}</div>
    </div>
  );
}

const TONE_BG = {
  primary: "bg-accent",
  success: "bg-success/10",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
} as const;

function StatusIcon({ tone, children }: { tone: keyof typeof TONE_BG; children: React.ReactNode }) {
  return (
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${TONE_BG[tone]}`}
    >
      {children}
    </div>
  );
}

function OrderRef({ id }: { id: number }) {
  return <span className="tabular font-semibold text-foreground">#ORD-{id}</span>;
}

function Countdown({ deadline }: { deadline: string | null }) {
  const left = useCountdown(deadline);
  if (!left) return null;
  return (
    <p className="mt-3 text-body-sm text-muted-foreground">
      {left.ms > 0 ? (
        <>
          Đơn được giữ thêm{" "}
          <span className="tabular font-semibold text-foreground">{left.label}</span>.
        </>
      ) : (
        "Đơn đã hết thời gian giữ hàng."
      )}
    </p>
  );
}
