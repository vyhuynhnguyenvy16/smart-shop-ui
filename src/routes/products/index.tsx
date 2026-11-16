import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Rating } from "@/components/Rating";
import { StockBadge } from "@/components/StockBadge";
import {
  CATEGORIES,
  formatPrice,
  getProductCategories,
  getProductsPage,
  type Product,
} from "@/lib/products";
import { addToCart } from "@/lib/cart";

type Search = { q?: string | undefined; category?: string | undefined };

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All Products — Northline" },
      {
        name: "description",
        content:
          "Browse every Northline product. Filter by price, category, rating and availability, with ratings on every card.",
      },
      { property: "og:title", content: "All Products — Northline" },
      {
        property: "og:description",
        content: "Filter and sort Northline clothing, shoes, bags and accessories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductListing,
});

// Sort options follow Baymard Institute's product-list research: offer price,
// rating, best-selling and newest — the four dimensions shoppers reach for.
const SORTS = ["Best Selling", "Price: Low-High", "Price: High-Low", "Rating", "Newest"] as const;
const PAGE_SIZE = 6;

function sortPage(items: Product[], sort: (typeof SORTS)[number]) {
  // The catalog API sorts by price/date server-side; "Rating" has no
  // server-side equivalent, so order each fetched page by rating client-side.
  if (sort !== "Rating") return items;
  return [...items].sort((a, b) => b.rating - a.rating);
}

function ProductListing() {
  const { q, category } = Route.useSearch();
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [cats, setCats] = useState<string[]>(category ? [category] : []);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Best Selling");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  // Baymard: avoid numbered pagination / endless scroll — use an explicit
  // "Load more" button and keep accumulating pages instead of replacing them.
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPage(1);
    void (async () => {
      try {
        const categories = await getProductCategories();
        const categoryId =
          cats.length === 1
            ? categories.find((item) => item.name === cats[0] || item.slug === cats[0])?.id
            : undefined;
        const productParams = {
          page: 0,
          size: PAGE_SIZE,
          maxPrice,
          sortBy:
            sort === "Price: Low-High" || sort === "Price: High-Low" ? "basePrice" : "createdAt",
          sortDirection: sort === "Price: Low-High" ? "asc" : "desc",
          ...(q ? { search: q } : {}),
          ...(categoryId === undefined ? {} : { categoryId }),
        };
        const response = await getProductsPage(productParams);
        if (!active) return;
        const filtered = response.content.filter(
          (item) =>
            (cats.length <= 1 || cats.includes(item.category)) &&
            item.rating >= minRating &&
            (!onSaleOnly || (item.compareAt && item.compareAt > item.price)),
        );
        setList(
          sortPage(inStockOnly ? filtered.filter((item) => item.stock !== "out") : filtered, sort),
        );
        setTotal(response.totalElements);
        setPageCount(Math.max(1, response.totalPages));
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load products.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cats, inStockOnly, maxPrice, minRating, onSaleOnly, q, sort]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const categories = await getProductCategories();
      const categoryId =
        cats.length === 1
          ? categories.find((item) => item.name === cats[0] || item.slug === cats[0])?.id
          : undefined;
      const nextPage = page + 1;
      const response = await getProductsPage({
        page: nextPage - 1,
        size: PAGE_SIZE,
        maxPrice,
        sortBy:
          sort === "Price: Low-High" || sort === "Price: High-Low" ? "basePrice" : "createdAt",
        sortDirection: sort === "Price: Low-High" ? "asc" : "desc",
        ...(q ? { search: q } : {}),
        ...(categoryId === undefined ? {} : { categoryId }),
      });
      const filtered = response.content.filter(
        (item) =>
          (cats.length <= 1 || cats.includes(item.category)) &&
          item.rating >= minRating &&
          (!onSaleOnly || (item.compareAt && item.compareAt > item.price)),
      );
      setList((prev) => [
        ...prev,
        ...sortPage(inStockOnly ? filtered.filter((item) => item.stock !== "out") : filtered, sort),
      ]);
      setPage(nextPage);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-base font-semibold text-foreground">Category</legend>
        <div className="space-y-2">
          {CATEGORIES.map((c) => (
            <label
              key={c}
              className="flex min-h-11 items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <input
                type="checkbox"
                checked={cats.includes(c)}
                onChange={() => toggleCat(c)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      {/* A dedicated Sale filter, not buried under Price — Baymard Institute's
          product-list research finds shoppers look for this as its own control. */}
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-foreground transition-colors hover:text-primary">
        <input
          type="checkbox"
          checked={onSaleOnly}
          onChange={(e) => setOnSaleOnly(e.target.checked)}
          className="h-5 w-5 accent-[var(--primary)]"
        />
        On sale
      </label>

      <fieldset>
        <legend className="mb-3 text-base font-semibold text-foreground">
          Max price: {formatPrice(maxPrice)}
        </legend>
        <input
          type="range"
          min={100000}
          max={5000000}
          step={100000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="h-11 w-full accent-[var(--primary)]"
          aria-label="Maximum price"
        />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-base font-semibold text-foreground">Rating</legend>
        <div className="space-y-2">
          {[0, 4, 4.5].map((r) => (
            <label
              key={r}
              className="flex min-h-11 items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => setMinRating(r)}
                className="h-5 w-5 accent-[var(--primary)]"
              />
              {r === 0 ? "All ratings" : `${r}★ & up`}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="h-5 w-5 accent-[var(--primary)]"
        />
        In stock only
      </label>
    </div>
  );

  return (
    <div className="container-shop section-y">
      <h1 className="font-display text-3xl text-foreground">
        {q ? `Results for “${q}”` : cats.length === 1 ? cats[0] : "All products"}
      </h1>
      {/* Don't show a stale "0 products" next to "Loading products..." below —
          only report the count once a real response has come back. */}
      {!loading && !error && <p className="mt-2 text-sm text-muted-foreground">{total} products</p>}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">{filters}</aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal /> Filters
            </Button>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
                className="h-11 border-b border-input bg-transparent px-2 text-sm text-foreground focus:border-foreground"
              >
                {SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} />
            ))}
          </div>
          {loading && (
            <p className="hairline p-8 text-center text-base text-muted-foreground">
              Loading products...
            </p>
          )}
          {error && <p className="hairline p-8 text-center text-base text-destructive">{error}</p>}
          {!loading && !error && list.length === 0 && (
            <p className="hairline p-8 text-center text-base text-muted-foreground">
              No products match these filters.
            </p>
          )}
          {!loading && !error && list.length > 0 && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {list.length} of {total} products
              </p>
              {page < pageCount && (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-foreground/40" onClick={() => setFiltersOpen(false)} />
          <div className="w-80 max-w-[85%] overflow-y-auto bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-semibold">Filters</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-11 w-11 items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filters}
            <Button
              variant="primary"
              size="md"
              className="mt-8 w-full"
              onClick={() => setFiltersOpen(false)}
            >
              Show {list.length} products
            </Button>
          </div>
        </div>
      )}

      {quick && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-label="Quick view"
          onClick={() => setQuick(null)}
        >
          <div
            className="grid w-full max-w-2xl gap-6 bg-background p-6 sm:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={quick.image}
              alt={quick.title}
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
            <div>
              <h2 className="font-display text-2xl leading-snug text-foreground">{quick.title}</h2>
              <Rating value={quick.rating} count={quick.reviews} className="mt-3" />
              <p className="mt-3 text-xl font-semibold text-foreground">
                {formatPrice(quick.price)}
              </p>
              <StockBadge stock={quick.stock} className="mt-3" />
              <p className="mt-4 text-base text-muted-foreground">{quick.description}</p>
              <Button
                variant="primary"
                size="md"
                className="mt-6 w-full"
                disabled={quick.stock === "out"}
                onClick={() => {
                  addToCart(quick.id);
                  setQuick(null);
                }}
              >
                Add to Cart
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setQuick(null)}
              >
                Continue shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
