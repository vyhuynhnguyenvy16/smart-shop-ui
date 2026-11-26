import { useEffect, useState } from "react";
import type { PaymentInfo, PaymentMethod, PaymentStatus } from "./api-client";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  momo: "Ví MoMo",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  not_required: "Trả khi nhận hàng",
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  expired: "Hết hạn thanh toán",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  not_required: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  expired: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

export function paymentBadgeClass(status: PaymentStatus) {
  return `inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold ${PAYMENT_STATUS_CLASS[status]}`;
}

/**
 * Plain-language reason for a failed MoMo attempt, from MoMo's result-code table
 * (developers.momo.vn/v3/vi/docs/payment/api/result-handling/resultcode). Each says what to do next.
 */
export function failureMessage(code: number | null) {
  switch (code) {
    case 1006:
      return "Bạn đã từ chối thanh toán trên MoMo. Bấm “Thanh toán lại” khi bạn sẵn sàng.";
    case 1001:
      return "Số dư ví MoMo không đủ. Nạp thêm tiền vào ví rồi thanh toán lại.";
    case 1004:
      return "Số tiền vượt hạn mức thanh toán của ví MoMo. Kiểm tra hạn mức trong ứng dụng MoMo.";
    case 1005:
      return "Link hoặc mã QR thanh toán đã hết hạn. Bấm “Thanh toán lại” để lấy link mới.";
    case 1003:
      return "Giao dịch đã bị hủy hoặc quá thời gian xử lý. Bạn có thể thanh toán lại.";
    default:
      return "MoMo chưa thực hiện được giao dịch. Bạn có thể thanh toán lại hoặc liên hệ shop.";
  }
}

export type MomoView = "checking" | "paid" | "failed" | "closed" | "unconfirmed";

/** Which screen to show for a MoMo payment. "unconfirmed" = still pending after we stopped polling. */
export function momoView(info: PaymentInfo | null, pollingDone: boolean): MomoView {
  if (!info) return "checking";
  if (info.status === "paid") return "paid";
  if (info.status === "expired" || info.status === "cancelled") return "closed";
  if (info.lastAttemptStatus === "failed") return "failed";
  return pollingDone ? "unconfirmed" : "checking";
}

/** Remaining time until `deadline`, refreshed every second; null when there is no deadline. */
export function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  if (!deadline) return null;
  const ms = Math.max(0, new Date(deadline).getTime() - now);
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { ms, label: `${minutes}:${String(seconds).padStart(2, "0")}` };
}
