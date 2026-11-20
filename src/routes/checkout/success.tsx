import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search["orderId"] === "number" ? (search["orderId"] as number) : undefined,
  }),
  head: () =>
    pageHead({
      title: "Đặt hàng thành công — Northline",
      description: "Đơn hàng Northline của bạn đã được tạo thành công.",
      path: "/checkout/success",
      noindex: true,
    }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderId } = Route.useSearch();
  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <div className="mx-auto max-w-lg hairline bg-card p-8 text-center" role="status">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <Check className="h-7 w-7 text-success" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-h1 text-foreground">Đặt hàng thành công</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {orderId ? (
            <>
              Mã đơn hàng:{" "}
              <span className="tabular font-semibold text-foreground">#ORD-{orderId}</span>.{" "}
            </>
          ) : null}
          Đơn đang chờ shop xác nhận. Bạn sẽ thanh toán khi nhận hàng.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="primary" size="lg" asChild>
            {orderId ? (
              <Link to="/orders/$id" params={{ id: String(orderId) }}>
                Xem đơn hàng
              </Link>
            ) : (
              <Link to="/orders">Xem đơn hàng</Link>
            )}
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/products" search={{}}>
              Tiếp tục mua sắm
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
