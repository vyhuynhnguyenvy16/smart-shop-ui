import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/Rating";
import { StockBadge } from "@/components/StockBadge";
import { fallbackImageFor, formatPrice, type Product } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
}) {
  const [wished, setWished] = useState(false);
  // API WISHLIST (nếu bật lưu): GET /wishlist, POST /wishlist/:productId,
  // DELETE /wishlist/:productId; hiện chỉ là state tạm, mất khi tải lại.
  const out = product.stock === "out";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-card-hover)]">
      <div className="relative mb-4 overflow-hidden rounded-lg bg-background">
        <Link to="/products/$slug" params={{ slug: product.slug }} aria-label={product.title}>
          <img
            src={product.image}
            data-fallback={fallbackImageFor(product.category, product.id)}
            alt={product.title}
            width={1024}
            height={1024}
            loading="lazy"
            className={cn("aspect-square w-full object-cover", out && "grayscale")}
          />
        </Link>

        {product.badge && !out && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
            {product.badge}
          </span>
        )}
        {out && <StockBadge stock="out" className="absolute left-2 top-2 bg-background" />}

        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-[var(--shadow-card)] transition-colors hover:text-destructive"
        >
          <Heart className={cn("h-5 w-5", wished && "fill-destructive text-destructive")} />
        </button>

        {onQuickView && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQuickView(product)}
            className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Eye /> Quick view
          </Button>
        )}
      </div>

      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="line-clamp-2-title text-base font-semibold leading-snug text-foreground hover:text-primary"
      >
        {product.title}
      </Link>

      <Rating value={product.rating} count={product.reviews} className="mt-2" />

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
        {product.compareAt && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(product.compareAt)}
          </span>
        )}
      </div>

      <StockBadge stock={product.stock} className="mt-2 self-start" />

      <Button
        variant="primary"
        size="md"
        disabled={out}
        onClick={() => void addToCart(product.variants.find((v) => v.stock > 0)?.id ?? product.id)}
        className="mt-4 w-full"
      >
        <ShoppingCart /> {out ? "Out of Stock" : "Add to Cart"}
      </Button>
    </article>
  );
}
