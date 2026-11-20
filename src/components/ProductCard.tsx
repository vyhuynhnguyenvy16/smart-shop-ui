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
      <div className="relative overflow-hidden rounded-lg bg-muted">
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
              "aspect-[3/4] w-full object-cover transition-transform duration-200 ease-standard group-hover:scale-[1.04]",
              out && "opacity-60",
            )}
          />
        </Link>

        {out ? (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-card px-2 py-1 text-label-sm text-foreground">
            Hết hàng
          </span>
        ) : onSale ? (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-sale px-2 py-1 text-label-sm text-white">
            Giảm giá
          </span>
        ) : product.badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-card px-2 py-1 text-label-sm text-foreground">
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
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-1 transition-[color,transform] duration-150 ease-standard hover:text-sale active:scale-90">
            <Heart
              className={cn("h-[18px] w-[18px]", wished && "fill-sale text-sale")}
              aria-hidden="true"
            />
          </span>
        </button>

        {!out && (onQuickView || quickAddVariant) && (
          <div className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-[calc(100%+12px)] transition-transform duration-200 ease-enter group-focus-within:translate-y-0 group-hover:translate-y-0 md:block">
            {quickAddVariant ? (
              <button
                type="button"
                disabled={adding}
                onClick={() => void quickAdd()}
                className="flex h-11 w-full items-center justify-center rounded-md bg-card/95 text-label text-foreground shadow-1 backdrop-blur transition-colors duration-150 hover:bg-primary hover:text-primary-foreground"
              >
                {adding ? "Đang thêm…" : "Thêm vào giỏ"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickView?.(product)}
                className="flex h-11 w-full items-center justify-center rounded-md bg-card/95 text-label text-foreground shadow-1 backdrop-blur transition-colors duration-150 hover:bg-primary hover:text-primary-foreground"
              >
                Chọn nhanh size
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-[0.9375rem] font-medium leading-[1.375rem] text-foreground">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2-title transition-colors duration-150 hover:text-primary"
          >
            {product.title}
          </Link>
        </h3>

        <p className="flex items-baseline gap-2">
          <span className={cn("text-price", onSale ? "text-sale" : "text-foreground")}>
            {formatPrice(product.price)}
          </span>
          {onSale && product.compareAt !== null && (
            <span className="tabular text-body-sm text-muted-foreground line-through">
              <span className="sr-only">Giá gốc </span>
              {formatPrice(product.compareAt)}
            </span>
          )}
        </p>

        {product.colors.length > 1 && (
          <p className="text-body-sm text-muted-foreground">{product.colors.length} màu</p>
        )}
        {product.stock === "low" && <p className="text-body-sm text-warning">Sắp hết hàng</p>}

        <Rating value={product.rating} count={product.reviews} />
      </div>
    </article>
  );
}
