import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Truck, RotateCcw, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/Rating";
import { StockBadge } from "@/components/StockBadge";
import { ProductCard } from "@/components/ProductCard";
import { fallbackImageFor, findVariant, formatPrice, getProductBySlug, getProducts } from "@/lib/products";
import { toast } from "sonner";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    const related = (await getProducts({ size: 4, categoryId: product.categoryId })).filter(
      (item) => item.id !== product.id,
    );
    return { product, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.title} — Northline` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: loaderData.product.title },
          { property: "og:description", content: loaderData.product.description },
           { property: "og:type", content: "product" },
           { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const product = Route.useLoaderData();
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { related } = product;
  const currentProduct = product.product;
  const [color, setColor] = useState(currentProduct.colors[0] ?? "");
  const [size, setSize] = useState(currentProduct.sizes[0] ?? "");
  const variant = findVariant(currentProduct, color, size);
  const fallback = fallbackImageFor(currentProduct.category, currentProduct.id);
  const add = async (goCheckout = false) => {
    if (!variant) {
      toast.error("Vui lòng chọn màu và size còn hàng.");
      return;
    }
    try {
      await addToCart(variant.id);
      toast.success("Đã thêm vào giỏ hàng");
      if (goCheckout) navigate({ to: "/checkout" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được vào giỏ.");
    }
  };
  // API GALLERY: GET /products/:slug cần trả images[] của đúng sản phẩm,
  // có ảnh từng màu/size nếu khác nhau. Hiện chỉ lặp ảnh danh mục minh họa.
  const gallery = currentProduct.images.length ? currentProduct.images : [currentProduct.image];
  const out = currentProduct.stock === "out" || (variant ? variant.stock <= 0 : false);

  return (
    <div className="pb-24 md:pb-0">
      <div className="container-shop pt-6 text-sm text-muted-foreground">
        <Link to="/products" search={{}} className="hover:text-foreground hover:underline">
          Products
        </Link>{" "}
        / <span className="text-foreground">{currentProduct.category}</span>
      </div>

      <div className="container-shop grid gap-8 py-8 md:grid-cols-2">
        <div>
          <img
            key={gallery[active]}
            src={gallery[active]}
            data-fallback={fallback}
            alt={currentProduct.title}
            width={1024}
            height={1024}
            className="aspect-square w-full rounded-xl object-cover shadow-[var(--shadow-card)] transition-transform duration-300 hover:scale-105"
          />
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {gallery.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                  i === active ? "border-primary" : "border-border",
                )}
              >
                <img
                  src={g}
                  data-fallback={fallback}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold leading-snug text-foreground md:text-3xl">
            {currentProduct.title}
          </h1>
          <Rating value={currentProduct.rating} count={currentProduct.reviews} className="mt-3" />

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(currentProduct.price)}
            </span>
            {currentProduct.compareAt && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(currentProduct.compareAt)}
              </span>
            )}
          </div>
          <StockBadge stock={currentProduct.stock} className="mt-3" />
          {variant && (
            <p className="mt-2 text-sm text-muted-foreground">
              Mẫu đã chọn: {formatPrice(variant.price)} · còn {variant.stock} sản phẩm
            </p>
          )}

          <p className="mt-6 text-base text-muted-foreground">{currentProduct.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              Color
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-3 text-base font-normal outline-none focus:border-primary"
              >
                {currentProduct.colors.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-foreground">
              Size
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-input bg-background px-3 text-base font-normal outline-none focus:border-primary"
              >
                {currentProduct.sizes.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 hidden gap-3 md:flex">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={out}
              onClick={() => void add()}
            >
              <ShoppingCart /> {out ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              disabled={out}
              onClick={() => void add(true)}
            >
              Mua ngay
            </Button>
          </div>

          <ul className="mt-6 grid gap-3 rounded-xl bg-card p-4 text-sm text-foreground">
            <li className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-success" /> Miễn phí vận chuyển từ 500.000₫
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-success" /> 30-Day Free Returns
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-success" /> Secure SSL payment
            </li>
          </ul>

          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            {["Verified Buyer reviews", "Ships in 24 hours", "2-year warranty"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="container-shop section-y pt-0">
        <h2 className="text-2xl font-semibold text-foreground">Customer reviews</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* API ĐÁNH GIÁ: GET /products/:slug/reviews?page=... trả sao, nội dung,
              người mua đã xác minh và tổng số đánh giá; dữ liệu dưới đây là minh họa. */}
          {[
            { n: "Mai T.", t: "Exactly as pictured, arrived in two days." },
            { n: "David L.", t: "Great build quality for the price. Would buy again." },
            { n: "Sara K.", t: "Returns were painless when I sized wrong the first time." },
          ].map((r) => (
            <blockquote key={r.n} className="rounded-xl bg-card p-4">
              <Rating value={5} count={1} className="mb-2" />
              <p className="text-base text-foreground">{r.t}</p>
              <footer className="mt-2 text-sm text-success">{r.n} · Verified Buyer</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="container-shop section-y pt-0">
        <h2 className="text-2xl font-semibold text-foreground">You may also like</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background p-4 md:hidden">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            disabled={out}
            onClick={() => void add()}
          >
            <ShoppingCart /> Add
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            disabled={out}
            onClick={() => void add(true)}
          >
            Mua ngay · {formatPrice(currentProduct.price)}
          </Button>
        </div>
      </div>
    </div>
  );
}
