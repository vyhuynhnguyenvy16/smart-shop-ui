import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartTotals, detailedCart, removeFromCart, setQty, useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/products";
import { estimateShipping } from "@/lib/shipping";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/labels";
import { displayImage } from "@/lib/images";

export const Route = createFileRoute("/cart")({
  head: () =>
    pageHead({
      title: "Giỏ hàng — Northline",
      description: "Xem lại sản phẩm trong giỏ, chỉnh số lượng và tiến hành đặt hàng.",
      path: "/cart",
      noindex: true,
    }),
  component: CartPage,
});

function CartPage() {
  useRequireAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  const items = detailedCart(useCart());
  const { subtotal, count } = cartTotals(items);
  const shipping = estimateShipping(subtotal);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const run = async (itemId: number, action: () => Promise<unknown>) => {
    setError("");
    setPending(itemId);
    try {
      await action();
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="container-shop pb-28 pt-6 md:pb-12">
      <ol
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Các bước đặt hàng"
      >
        <li aria-current="step" className="font-semibold text-foreground">
          1. Giỏ hàng
        </li>
        <li aria-hidden="true">—</li>
        <li>2. Giao hàng</li>
        <li aria-hidden="true">—</li>
        <li>3. Xác nhận</li>
      </ol>
      <h1 className="font-display mt-4 text-3xl text-foreground md:text-4xl">
        Giỏ hàng{count > 0 && <span className="tabular text-muted-foreground"> ({count})</span>}
      </h1>

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-8 hairline p-10 text-center">
          <h2 className="font-display text-xl text-foreground">Giỏ hàng đang trống</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thêm vài món bạn thích rồi quay lại đây nhé.
          </p>
          <Button variant="primary" size="md" asChild className="mt-6 h-12 px-8">
            <Link to="/products" search={{}}>
              Bắt đầu mua sắm
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="hairline-t">
            {items.map(({ product, qty, itemId, item }) => {
              const busy = pending === itemId;
              const maxed = item.stock > 0 && qty >= item.stock;
              return (
                <li key={itemId} className={cn("flex gap-4 hairline-b py-5", busy && "opacity-60")}>
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={displayImage(product.image, product.category, product.id)}
                      alt=""
                      width={96}
                      height={128}
                      loading="lazy"
                      className="aspect-[3/4] w-24 shrink-0 bg-muted object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to="/products/$slug"
                          params={{ slug: product.slug }}
                          className="line-clamp-2-title text-base text-foreground hover:text-primary"
                        >
                          {product.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[item.color && colorLabel(item.color), item.size && `Size ${item.size}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-base font-semibold text-foreground">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                    {qty > 1 && (
                      <p className="tabular mt-1 text-sm text-muted-foreground">
                        {formatPrice(item.unitPrice)} / sản phẩm
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          disabled={busy || qty <= 1}
                          onClick={() => void run(itemId, () => setQty(itemId, qty - 1))}
                          aria-label={`Giảm số lượng ${product.title}`}
                          className="flex h-11 w-11 items-center justify-center text-foreground disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          className="tabular w-8 text-center text-base"
                          aria-live="polite"
                          aria-label={`Số lượng ${qty}`}
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={busy || maxed}
                          onClick={() => void run(itemId, () => setQty(itemId, qty + 1))}
                          aria-label={`Tăng số lượng ${product.title}`}
                          className="flex h-11 w-11 items-center justify-center text-foreground disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(itemId, () => removeFromCart(itemId))}
                        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa
                      </button>
                    </div>
                    {maxed && (
                      <p className="mt-1 text-xs text-warning">Đã đạt số lượng còn trong kho.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <aside
            className="h-fit hairline bg-card p-6 lg:sticky lg:top-32"
            aria-labelledby="summary-heading"
          >
            <h2 id="summary-heading" className="font-display text-xl text-foreground">
              Tóm tắt đơn hàng
            </h2>
            <div className="mt-4">
              <p className="text-sm text-foreground">
                {remaining > 0
                  ? `Mua thêm ${formatPrice(remaining)} để được miễn phí vận chuyển`
                  : "Đơn hàng được miễn phí vận chuyển"}
              </p>
              <div
                className="mt-2 h-1 w-full overflow-hidden bg-border"
                role="progressbar"
                aria-label="Tiến độ miễn phí vận chuyển"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full bg-foreground transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <dl className="tabular mt-6 space-y-2 hairline-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tạm tính</dt>
                <dd className="text-foreground">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phí vận chuyển</dt>
                <dd className="text-foreground">
                  {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between hairline-t pt-3 text-base">
                <dt className="font-semibold text-foreground">Tổng cộng</dt>
                <dd className="text-xl font-semibold text-foreground">
                  {formatPrice(subtotal + shipping)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Tổng tiền cuối cùng được hệ thống xác nhận khi bạn đặt hàng.
            </p>

            <Button variant="primary" size="md" asChild className="mt-6 h-12 w-full">
              <Link to="/checkout">Tiến hành đặt hàng</Link>
            </Button>
            <Button variant="tertiary" size="sm" asChild className="mt-2 w-full">
              <Link to="/products" search={{}}>
                Tiếp tục mua sắm
              </Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
