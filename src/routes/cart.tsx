import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartTotals, detailedCart, removeFromCart, setQty, useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/products";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Northline" },
      {
        name: "description",
        content:
          "Review your Northline cart, adjust quantities and check out as a guest in three steps.",
      },
      { property: "og:title", content: "Your Cart — Northline" },
      {
        property: "og:description",
        content: "Review items and check out as a guest in three steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  useRequireAuth();
  const [error, setError] = useState("");


  const items = detailedCart(useCart());
  const { subtotal } = cartTotals(items);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <div className="mb-8 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3</span> · Cart
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Your cart</h1>
      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl bg-card p-8 text-center">
          <p className="text-base text-muted-foreground">Your cart is empty.</p>
          <Button variant="primary" size="md" asChild className="mt-6">
            <Link to="/products" search={{}}>
              Start shopping
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map(({ product, qty, itemId }) => (
              <div key={itemId} className="flex gap-4 rounded-xl bg-card p-4">
                <img
                  src={product.image}
                  alt={product.title}
                  width={112}
                  height={112}
                  loading="lazy"
                  className="h-28 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    className="line-clamp-2-title text-base font-semibold text-foreground hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-input">
                      <button
                        type="button"
                        onClick={() =>
                          void setQty(itemId, qty - 1).catch((reason) =>
                            setError(getApiErrorMessage(reason)),
                          )
                        }
                        aria-label="Decrease quantity"
                        className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-base font-semibold">{qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          void setQty(itemId, qty + 1).catch((reason) =>
                            setError(getApiErrorMessage(reason)),
                          )
                        }
                        aria-label="Increase quantity"
                        className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void removeFromCart(itemId).catch((reason) =>
                          setError(getApiErrorMessage(reason)),
                        )
                      }
                      className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-xl bg-card p-4 lg:sticky lg:top-32">
            <div className="mb-4">
              <p className="text-sm text-foreground">
                {remaining > 0
                  ? `Spend ${formatPrice(remaining)} more for free shipping`
                  : "You've unlocked free shipping"}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <dl className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold text-foreground">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-semibold text-success">
                  {remaining > 0 ? formatPrice(5) : "Free"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estimated tax</dt>
                <dd className="font-semibold text-foreground">
                  {formatPrice(Math.round(subtotal * 0.08))}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="text-xl font-bold text-primary">
                  {formatPrice(subtotal + (remaining > 0 ? 5 : 0) + Math.round(subtotal * 0.08))}
                </dd>
              </div>
            </dl>

            <Button variant="primary" size="md" asChild className="mt-6 w-full">
              <Link to="/checkout">Checkout as guest</Link>
            </Button>
            <Button variant="tertiary" size="sm" asChild className="mt-2 w-full">
              <Link to="/products" search={{}}>
                Continue shopping
              </Link>
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" /> SSL secure · no account required
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
