import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Rating } from "@/components/Rating";
import { formatPrice, type Product } from "@/lib/products";
import { displayImage, photoFor } from "@/lib/images";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * Card hierarchy for fashion listings (Baymard / NN/g): image → name → price →
 * available colours. Everything else lives on the product page.
 */
export function ProductCard({
  product,
  onQuickView,
  priority = false,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
  /** First row of a grid: load eagerly so it isn't the LCP bottleneck. */
  priority?: boolean;
}) {
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);
  // API WISHLIST (nếu bật lưu): GET /wishlist, POST /wishlist/:productId,
  // DELETE /wishlist/:productId; hiện chỉ là state tạm, mất khi tải lại.
  const out = product.stock === "out";
  const onSale = product.compareAt !== null && product.compareAt > product.price;
  const inStockVariants = product.variants.filter((v) => v.stock > 0);
  // Only one buyable option → safe to add straight from the grid. Otherwise the
  // shopper has to pick a size/colour first, so never add a variant silently.
  const quickAddVariant = inStockVariants.length === 1 ? inStockVariants[0] : undefined;

  const quickAdd = async () => {
    if (!quickAddVariant) return;
    setAdding(true);
    try {
      await addToCart(quickAddVariant.id);
      toast.success(`Đã thêm “${product.title}” vào giỏ hàng`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa thêm được vào giỏ, bạn thử lại nhé.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden bg-muted">
        <Link to="/products/$slug" params={{ slug: product.slug }} tabIndex={-1} aria-hidden="true">
          <img
            src={displayImage(product.image, product.category, product.id)}
            data-fallback={photoFor(product.category, product.id)}
            alt=""
            width={600}
            height={800}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
              out && "opacity-60",
            )}
          />
        </Link>

        {out ? (
          <span className="absolute left-0 top-0 bg-background px-2 py-1 text-xs text-foreground">
            Hết hàng
          </span>
        ) : onSale ? (
          <span className="absolute left-0 top-0 bg-primary px-2 py-1 text-xs text-primary-foreground">
            Giảm giá
          </span>
        ) : product.badge ? (
          <span className="absolute left-0 top-0 bg-foreground px-2 py-1 text-xs text-background">
            {product.badge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={
            wished
              ? `Bỏ “${product.title}” khỏi yêu thích`
              : `Thêm “${product.title}” vào yêu thích`
          }
          aria-pressed={wished}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-foreground/70 transition-colors hover:text-primary"
        >
          <Heart
            className={cn("h-5 w-5", wished && "fill-primary text-primary")}
            aria-hidden="true"
          />
        </button>

        {!out && (onQuickView || quickAddVariant) && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full transition-transform duration-200 group-focus-within:translate-y-0 group-hover:translate-y-0 md:block">
            {quickAddVariant ? (
              <button
                type="button"
                disabled={adding}
                onClick={() => void quickAdd()}
                className="flex h-11 w-full items-center justify-center bg-background/95 text-sm text-foreground hover:bg-foreground hover:text-background"
              >
                {adding ? "Đang thêm…" : "Thêm vào giỏ"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickView?.(product)}
                className="flex h-11 w-full items-center justify-center bg-background/95 text-sm text-foreground hover:bg-foreground hover:text-background"
              >
                Chọn nhanh size
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-[0.9375rem] leading-snug text-foreground">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2-title hover:text-primary"
          >
            {product.title}
          </Link>
        </h3>

        <p className="flex items-baseline gap-2">
          <span
            className={cn(
              "tabular text-[0.9375rem] font-semibold",
              onSale ? "text-primary" : "text-foreground",
            )}
          >
            {formatPrice(product.price)}
          </span>
          {onSale && product.compareAt !== null && (
            <span className="tabular text-sm text-muted-foreground line-through">
              <span className="sr-only">Giá gốc </span>
              {formatPrice(product.compareAt)}
            </span>
          )}
        </p>

        {product.colors.length > 1 && (
          <p className="text-sm text-muted-foreground">{product.colors.length} màu</p>
        )}
        {product.stock === "low" && <p className="text-sm text-warning">Sắp hết hàng</p>}

        <Rating value={product.rating} count={product.reviews} />
      </div>
    </article>
  );
}
