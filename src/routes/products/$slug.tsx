import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RotateCcw, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/Rating";
import { ProductCard } from "@/components/ProductCard";
import { displayImage, photoFor } from "@/lib/images";
import {
  findVariant,
  formatPrice,
  getProductBySlug,
  getProducts,
  FREE_SHIPPING_THRESHOLD,
  type Product,
} from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { absoluteUrl, breadcrumbLd, clip, jsonLd, pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/labels";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREESIZE"];
const sortSizes = (sizes: string[]) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return Number(a) - Number(b) || a.localeCompare(b, "vi");
  });

function priceRange(product: Product) {
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  if (!prices.length) return { low: product.price, high: product.price };
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

function productLd(product: Product, path: string) {
  const { low, high } = priceRange(product);
  const inStock = product.stock !== "out";
  const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: clip(product.description || product.title, 500),
    image: product.images.map((src) => absoluteUrl(src)),
    sku: product.variants[0]?.sku,
    category: product.category,
    brand: { "@type": "Brand", name: "Northline" },
    offers:
      low === high
        ? {
            "@type": "Offer",
            url: absoluteUrl(path),
            priceCurrency: "VND",
            price: low,
            availability,
            itemCondition: "https://schema.org/NewCondition",
          }
        : {
            "@type": "AggregateOffer",
            url: absoluteUrl(path),
            priceCurrency: "VND",
            lowPrice: low,
            highPrice: high,
            offerCount: product.variants.length,
            availability,
          },
  });
}

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    // Related items are a nice-to-have: a failure here must not break the page.
    const related = (await getProducts({ size: 5, categoryId: product.categoryId }).catch(() => []))
      .filter((item) => item.id !== product.id)
      .slice(0, 4);
    return { product, related };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { product } = loaderData;
    const path = `/products/${params.slug}`;
    return {
      ...pageHead({
        title: `${clip(product.title, 44)} | Northline`,
        description:
          product.description ||
          `Mua ${product.title} tại Northline, giá ${formatPrice(product.price)}. Miễn phí vận chuyển cho đơn từ 500.000₫, đổi trả trong 30 ngày.`,
        path,
        image: product.image,
        type: "product",
      }),
      scripts: [
        productLd(product, path),
        breadcrumbLd([
          { name: "Trang chủ", path: "/" },
          {
            name: product.category,
            path: `/products?category=${encodeURIComponent(product.category)}`,
          },
          { name: product.title, path },
        ]),
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product, related } = Route.useLoaderData();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const firstColorInStock =
    product.colors.find((c) => product.variants.some((v) => v.color === c && v.stock > 0)) ??
    product.colors[0] ??
    "";
  const [color, setColor] = useState(firstColorInStock);
  // Baymard: don't preselect a size unless there is only one — shoppers miss
  // a preselected size and order the wrong one.
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0]! : "");
  const [sizeError, setSizeError] = useState(false);
  const [adding, setAdding] = useState(false);

  const sizes = useMemo(() => sortSizes(product.sizes), [product.sizes]);
  const variant = size ? findVariant(product, color, size) : undefined;
  const { low, high } = priceRange(product);
  const fallback = photoFor(product.category, product.id);
  const gallery = (product.images.length ? product.images : [product.image]).map((src, i) =>
    displayImage(src, product.category, product.id + i),
  );
  const productOut = product.stock === "out";
  const variantOut = variant ? variant.stock <= 0 : false;
  const sizeInStock = (s: string) =>
    product.variants.some((v) => v.color === color && v.size === s && v.stock > 0);

  const add = async (goCheckout = false) => {
    if (sizes.length > 0 && !size) {
      setSizeError(true);
      document
        .getElementById("size-picker")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!variant || variantOut) {
      toast.error("Phân loại này đã hết hàng, bạn chọn màu hoặc size khác nhé.");
      return;
    }
    setAdding(true);
    try {
      await addToCart(variant.id);
      if (goCheckout) {
        navigate({ to: "/checkout" });
      } else {
        toast.success(`Đã thêm vào giỏ: ${product.title} (${colorLabel(color)}, ${size})`, {
          action: { label: "Xem giỏ hàng", onClick: () => navigate({ to: "/cart" }) },
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa thêm được vào giỏ, bạn thử lại nhé.");
    } finally {
      setAdding(false);
    }
  };

  const shownPrice = variant
    ? formatPrice(variant.price)
    : low === high
      ? formatPrice(low)
      : `Từ ${formatPrice(low)}`;
  const ctaLabel = productOut
    ? "Hết hàng"
    : adding
      ? "Đang thêm…"
      : variantOut
        ? "Phân loại này hết hàng"
        : "Thêm vào giỏ hàng";

  return (
    <div className="pb-28 md:pb-0">
      <nav aria-label="Breadcrumb" className="container-shop pt-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-foreground hover:underline">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              to="/products"
              search={{ category: product.category }}
              className="hover:text-foreground hover:underline"
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="line-clamp-1 text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="container-shop grid gap-8 py-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 md:py-8">
        <div className="md:sticky md:top-28 md:self-start">
          <img
            key={gallery[active]}
            src={gallery[active]}
            data-fallback={fallback}
            alt={`${product.title}${gallery.length > 1 ? ` — ảnh ${active + 1}/${gallery.length}` : ""}`}
            width={900}
            height={1200}
            fetchPriority="high"
            className="aspect-[3/4] w-full bg-muted object-cover"
          />
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Ảnh sản phẩm">
              {gallery.map((g, i) => (
                <button
                  key={g + i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-current={i === active}
                  className={cn(
                    "w-[4.5rem] shrink-0 overflow-hidden border-2",
                    i === active ? "border-foreground" : "border-transparent hover:border-border",
                  )}
                >
                  <img
                    src={g}
                    data-fallback={fallback}
                    alt=""
                    width={72}
                    height={96}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h1 className="font-display mt-1 text-3xl leading-tight text-foreground md:text-[2.25rem]">
            {product.title}
          </h1>
          <Rating value={product.rating} count={product.reviews} className="mt-3" />

          <p className="tabular mt-4 text-2xl font-semibold text-foreground" aria-live="polite">
            {shownPrice}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {productOut
              ? "Sản phẩm tạm hết hàng."
              : variant
                ? variant.stock <= 0
                  ? "Phân loại này đã hết hàng."
                  : variant.stock <= 5
                    ? `Chỉ còn ${variant.stock} sản phẩm.`
                    : "Còn hàng, sẵn sàng giao."
                : product.stock === "low"
                  ? "Sắp hết hàng."
                  : "Còn hàng."}
          </p>

          {product.colors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="mb-3 text-sm text-foreground">
                Màu sắc: <span className="font-semibold">{colorLabel(color)}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const anyStock = product.variants.some((v) => v.color === c && v.stock > 0);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={c === color}
                      onClick={() => {
                        setColor(c);
                        if (
                          size &&
                          !product.variants.some(
                            (v) => v.color === c && v.size === size && v.stock > 0,
                          )
                        )
                          setSize("");
                      }}
                      className={cn(
                        "inline-flex min-h-11 items-center border px-4 text-sm transition-colors",
                        c === color
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground",
                        !anyStock && "text-muted-foreground line-through",
                      )}
                    >
                      {colorLabel(c)}
                      {!anyStock && <span className="sr-only"> (hết hàng)</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset
              id="size-picker"
              className="mt-6"
              aria-describedby={sizeError ? "size-error" : undefined}
            >
              <legend className="mb-3 text-sm text-foreground">
                Size: <span className="font-semibold">{size || "chưa chọn"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const ok = sizeInStock(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={s === size}
                      disabled={!ok}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      className={cn(
                        "inline-flex min-h-11 min-w-12 items-center justify-center border px-3 text-sm transition-colors",
                        s === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground",
                        !ok &&
                          "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                        sizeError && !size && "border-destructive",
                      )}
                    >
                      {s}
                      {!ok && <span className="sr-only"> (hết hàng)</span>}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <p id="size-error" role="alert" className="mt-2 text-sm text-destructive">
                  Bạn chọn size trước khi thêm vào giỏ nhé.
                </p>
              )}
            </fieldset>
          )}

          <div className="mt-8 hidden gap-3 md:flex">
            <Button
              variant="primary"
              size="md"
              className="h-12 flex-1"
              disabled={productOut || variantOut || adding}
              onClick={() => void add()}
            >
              {ctaLabel}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="h-12"
              disabled={productOut || variantOut || adding}
              onClick={() => void add(true)}
            >
              Mua ngay
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 hairline-t pt-6 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              Miễn phí vận chuyển cho đơn từ {formatPrice(FREE_SHIPPING_THRESHOLD)}
            </li>
            <li className="flex items-start gap-3">
              <RotateCcw
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              Đổi trả miễn phí trong 30 ngày
            </li>
            <li className="flex items-start gap-3">
              <Wallet
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              Thanh toán khi nhận hàng (COD)
            </li>
          </ul>

          <section className="mt-10" aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="font-display text-xl text-foreground">
              Mô tả sản phẩm
            </h2>
            <p className="measure mt-3 whitespace-pre-line text-base text-muted-foreground">
              {product.description || "Thông tin mô tả đang được cập nhật."}
            </p>
          </section>

          <section className="mt-8" aria-labelledby="spec-heading">
            <h2 id="spec-heading" className="font-display text-xl text-foreground">
              Thông tin chi tiết
            </h2>
            <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Danh mục</dt>
              <dd className="text-foreground">{product.category}</dd>
              {product.colors.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Màu có sẵn</dt>
                  <dd className="text-foreground">{product.colors.map(colorLabel).join(", ")}</dd>
                </>
              )}
              {sizes.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Size có sẵn</dt>
                  <dd className="text-foreground">{sizes.join(", ")}</dd>
                </>
              )}
              {variant && (
                <>
                  <dt className="text-muted-foreground">Mã sản phẩm</dt>
                  <dd className="tabular text-foreground">{variant.sku}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-shop section-y" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-2xl text-foreground">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-30 hairline-t bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="tabular text-base font-semibold text-foreground">{shownPrice}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[color && colorLabel(color), size || "chưa chọn size"].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="ml-auto h-12 px-6"
            disabled={productOut || variantOut || adding}
            onClick={() => void add()}
          >
            {productOut ? "Hết hàng" : adding ? "Đang thêm…" : "Thêm vào giỏ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
