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
    <article className="group relative flex flex-col">
      <div className="relative mb-3 overflow-hidden bg-muted">
        <Link to="/products/$slug" params={{ slug: product.slug }} aria-label={product.title}>
          <img
            src={product.image}
            data-fallback={fallbackImageFor(product.category, product.id)}
            alt={product.title}
            width={1024}
            height={1024}
            loading="lazy"
            className={cn(
              "aspect-square w-full object-cover transition-opacity duration-300 group-hover:opacity-90",
              out && "grayscale",
            )}
          />
        </Link>

        {product.badge && !out && (
          <span className="absolute left-0 top-0 bg-foreground px-2 py-1 text-sm text-background">
            {product.badge}
          </span>
        )}
        {out && (
          <span className="absolute left-0 top-0 bg-background px-2 py-1 text-sm text-muted-foreground">
            Out of stock
          </span>
        )}

        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-foreground/70 transition-colors hover:text-primary"
        >
          <Heart className={cn("h-5 w-5", wished && "fill-primary text-primary")} />
        </button>

        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/95 py-2.5 text-sm text-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Eye className="h-4 w-4" /> Quick view
          </button>
        )}
      </div>

      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="line-clamp-2-title font-display text-base leading-snug text-foreground hover:text-primary"
        style={{ fontWeight: 500 }}
      >
        {product.title}
      </Link>

      <Rating value={product.rating} count={product.reviews} className="mt-1.5" />

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">
          {formatPrice(product.price)}
        </span>
        {product.compareAt && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(product.compareAt)}
          </span>
        )}
      </div>

      <StockBadge stock={product.stock} className="mt-1.5 self-start" />

      <Button
        variant="secondary"
        size="sm"
        disabled={out}
        onClick={() => void addToCart(product.variants.find((v) => v.stock > 0)?.id ?? product.id)}
        className="mt-3 w-full"
      >
        <ShoppingCart className="h-4 w-4" /> {out ? "Out of stock" : "Add to cart"}
      </Button>
    </article>
  );
}
