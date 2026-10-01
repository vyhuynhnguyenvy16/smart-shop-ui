import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search["orderId"] === "number" ? (search["orderId"] as number) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đặt hàng thành công — Northline" },
      { name: "description", content: "Đơn hàng Northline của bạn đã được tạo thành công." },
      { property: "og:title", content: "Đặt hàng thành công — Northline" },
      { property: "og:description", content: "Cảm ơn bạn đã mua sắm tại Northline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderId } = Route.useSearch();
  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <div className="mx-auto max-w-lg rounded-xl bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <Check className="h-7 w-7 text-success" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Đặt hàng thành công</h1>
        <p className="mt-2 text-base text-muted-foreground">
          {orderId ? `Mã đơn hàng của bạn: #ORD-${orderId}. ` : ""}
          Đơn ở trạng thái Chờ xác nhận cho tới khi shop xác nhận.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="primary" size="md" asChild>
            <Link to="/orders">Xem đơn hàng</Link>
          </Button>
          <Button variant="secondary" size="md" asChild>
            <Link to="/products" search={{}}>
              Tiếp tục mua sắm
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
