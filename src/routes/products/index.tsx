import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { StockBadge } from "@/components/StockBadge";
import {
  CATEGORIES,
  findVariant,
  formatPrice,
  getProductCategories,
  getProductsPage,
  type Product,
} from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { displayImage } from "@/lib/images";
import { breadcrumbLd, pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/labels";

type Search = { q?: string | undefined; category?: string | undefined };

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: ({ match }) => {
    const { category, q } = (match.search ?? {}) as Search;
    const name = category ?? "Tất cả sản phẩm";
    const path = category ? `/products?category=${encodeURIComponent(category)}` : "/products";
    return {
      ...pageHead({
        title: q ? `Tìm “${q}” — Northline` : `${name} — Northline`,
        description: category
          ? `Mua ${category.toLowerCase()} tại Northline: lọc theo giá, size, màu và tình trạng còn hàng. Miễn phí vận chuyển cho đơn từ 500.000₫.`
          : "Toàn bộ quần áo, áo khoác, quần jean, váy đầm, giày, túi và phụ kiện của Northline. Lọc theo giá, size, màu.",
        path,
        noindex: Boolean(q),
      }),
      scripts: [
        breadcrumbLd([
          { name: "Trang chủ", path: "/" },
          { name: "Sản phẩm", path: "/products" },
          ...(category ? [{ name: category, path }] : []),
        ]),
      ],
    };
  },
  component: ProductListing,
});

/**
 * Sorting/filtering only offers what the catalog API can actually back
 * (Baymard; and the external review's "don't show filters without data").
 * The API returns no ratings, review counts or sale prices yet, so there is
 * no rating sort, rating filter or sale filter — they would always be empty.
 */
const SORTS = [
  { id: "newest", label: "Mới nhất", sortBy: "createdAt", dir: "desc" },
  { id: "price-asc", label: "Giá: thấp đến cao", sortBy: "basePrice", dir: "asc" },
  { id: "price-desc", label: "Giá: cao đến thấp", sortBy: "basePrice", dir: "desc" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const PAGE_SIZE = 12;
const PRICE_CEILING = 5_000_000;
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREESIZE"];

function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b, "vi");
  });
}

function OptionChip({
  selected,
  onClick,
  children,
  disabled,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-card px-3.5 text-body transition-[box-shadow,background-color,color] duration-150 ease-standard",
        selected
          ? "bg-accent font-semibold text-accent-foreground shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
          : "text-foreground shadow-[inset_0_0_0_1px_var(--color-border)] hover:shadow-[inset_0_0_0_1px_var(--color-foreground)]",
        disabled &&
          "cursor-not-allowed bg-muted text-muted-foreground line-through hover:shadow-[inset_0_0_0_1px_var(--color-border)]",
      )}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[3/4] w-full rounded-lg" />
      <div className="skeleton mt-3 h-4 w-4/5 rounded-sm" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded-sm" />
    </div>
  );
}

function ProductListing() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });

  const [cats, setCats] = useState<string[]>(category ? [category] : []);
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortId>("newest");

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const categoryIds = useRef<Map<string, number> | null>(null);

  // Keep the checkbox state in step with the URL (header links change ?category=).
  useEffect(() => {
    setCats(category ? [category] : []);
  }, [category]);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      if (!categoryIds.current) {
        const list = await getProductCategories();
        categoryIds.current = new Map(
          list.flatMap((c) => [
            [c.name, c.id],
            [c.slug, c.id],
          ]),
        );
      }
      const categoryId = cats.length === 1 ? categoryIds.current.get(cats[0]!) : undefined;
      const s = SORTS.find((x) => x.id === sort) ?? SORTS[0];
      return getProductsPage({
        page: pageIndex,
        size: PAGE_SIZE,
        ...(maxPrice < PRICE_CEILING ? { maxPrice } : {}),
        sortBy: s.sortBy,
        sortDirection: s.dir,
        ...(q ? { search: q } : {}),
        ...(categoryId === undefined ? {} : { categoryId }),
      });
    },
    [cats, maxPrice, q, sort],
  );

  // Server-side inputs changed → start over from page 0.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void fetchPage(0)
      .then((res) => {
        if (!active) return;
        setItems(res.content);
        setTotal(res.totalElements);
        setPageCount(Math.max(1, res.totalPages));
        setPage(0);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "Không tải được danh sách sản phẩm.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchPage, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetchPage(page + 1);
      setItems((prev) => [...prev, ...res.content]);
      setPage(page + 1);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Không tải thêm được sản phẩm.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Facets the loaded catalog actually has (sizes/colours come from variants).
  const availableSizes = useMemo(
    () => sortSizes([...new Set(items.flatMap((p) => p.sizes))]),
    [items],
  );
  const availableColors = useMemo(
    () => [...new Set(items.flatMap((p) => p.colors))].sort((a, b) => a.localeCompare(b, "vi")),
    [items],
  );

  const clientFiltered = cats.length > 1 || sizes.length > 0 || colors.length > 0 || inStockOnly;
  const visible = useMemo(
    () =>
      items.filter((p) => {
        if (cats.length > 1 && !cats.includes(p.category)) return false;
        if (inStockOnly && p.stock === "out") return false;
        if (sizes.length || colors.length) {
          return p.variants.some(
            (v) =>
              (!sizes.length || sizes.includes(v.size)) &&
              (!colors.length || colors.includes(v.color)) &&
              (!inStockOnly || v.stock > 0),
          );
        }
        return true;
      }),
    [items, cats, sizes, colors, inStockOnly],
  );

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const setCategories = (next: string[]) => {
    setCats(next);
    // A single category is shareable in the URL; several stay local.
    if (next.length <= 1) void navigate({ search: (prev) => ({ ...prev, category: next[0] }) });
  };

  const chips: Array<{ key: string; label: string; remove: () => void }> = [
    ...(q
      ? [
          {
            key: "q",
            label: `“${q}”`,
            remove: () => void navigate({ search: (p) => ({ ...p, q: undefined }) }),
          },
        ]
      : []),
    ...cats.map((c) => ({
      key: `c-${c}`,
      label: c,
      remove: () => setCategories(cats.filter((x) => x !== c)),
    })),
    ...(maxPrice < PRICE_CEILING
      ? [
          {
            key: "price",
            label: `Dưới ${formatPrice(maxPrice)}`,
            remove: () => setMaxPrice(PRICE_CEILING),
          },
        ]
      : []),
    ...sizes.map((s) => ({
      key: `s-${s}`,
      label: `Size ${s}`,
      remove: () => toggle(sizes, setSizes, s),
    })),
    ...colors.map((c) => ({
      key: `co-${c}`,
      label: colorLabel(c),
      remove: () => toggle(colors, setColors, c),
    })),
    ...(inStockOnly
      ? [{ key: "stock", label: "Còn hàng", remove: () => setInStockOnly(false) }]
      : []),
  ];

  const clearAll = () => {
    setMaxPrice(PRICE_CEILING);
    setSizes([]);
    setColors([]);
    setInStockOnly(false);
    setCats([]);
    void navigate({ search: {} });
  };

  const heading = q ? `Kết quả cho “${q}”` : cats.length === 1 ? cats[0] : "Tất cả sản phẩm";

  const filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-2 text-body-sm font-semibold text-foreground">Danh mục</legend>
        <div className="grid">
          {CATEGORIES.map((c) => (
            <label
              key={c}
              className="flex min-h-11 items-center gap-3 text-body-sm text-foreground hover:text-primary"
            >
              <input
                type="checkbox"
                checked={cats.includes(c)}
                onChange={() =>
                  setCategories(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])
                }
                className="h-5 w-5 accent-[var(--primary)]"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-body-sm font-semibold text-foreground">Giá tối đa</legend>
        <p className="tabular mb-1 text-body-sm text-muted-foreground" aria-live="polite">
          {maxPrice < PRICE_CEILING ? `Dưới ${formatPrice(maxPrice)}` : "Mọi mức giá"}
        </p>
        <input
          type="range"
          min={100_000}
          max={PRICE_CEILING}
          step={100_000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="h-11 w-full accent-[var(--primary)]"
          aria-label="Giá tối đa"
          aria-valuetext={formatPrice(maxPrice)}
        />
      </fieldset>

      {availableSizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-body-sm font-semibold text-foreground">Size</legend>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => (
              <OptionChip
                key={s}
                selected={sizes.includes(s)}
                onClick={() => toggle(sizes, setSizes, s)}
              >
                {s}
              </OptionChip>
            ))}
          </div>
        </fieldset>
      )}

      {availableColors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-body-sm font-semibold text-foreground">Màu sắc</legend>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => (
              <OptionChip
                key={c}
                selected={colors.includes(c)}
                onClick={() => toggle(colors, setColors, c)}
              >
                {colorLabel(c)}
              </OptionChip>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex min-h-11 items-center gap-3 text-body-sm text-foreground hover:text-primary">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="h-5 w-5 accent-[var(--primary)]"
        />
        Chỉ hiện sản phẩm còn hàng
      </label>
    </div>
  );

  return (
    <div className="container-shop pb-12 pt-6">
      <nav aria-label="Breadcrumb" className="text-body-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-foreground hover:underline">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            {cats.length === 1 || q ? (
              <Link to="/products" search={{}} className="hover:text-foreground hover:underline">
                Sản phẩm
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                Sản phẩm
              </span>
            )}
          </li>
          {cats.length === 1 && !q && (
            <>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {cats[0]}
              </li>
            </>
          )}
        </ol>
      </nav>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 hairline-b pb-6">
        <div>
          <h1 className="text-h1 text-foreground">{heading}</h1>
          <p className="tabular mt-2 min-h-5 text-body-sm text-muted-foreground" aria-live="polite">
            {loading
              ? "Đang tải sản phẩm…"
              : error
                ? ""
                : clientFiltered
                  ? `${visible.length} sản phẩm phù hợp trong ${items.length} đã tải`
                  : `${total} sản phẩm`}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 lg:hidden"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal aria-hidden="true" /> Bộ lọc
            {chips.length > 0 && <span className="tabular">({chips.length})</span>}
          </Button>
          <label className="ml-auto flex items-center gap-2 text-body-sm text-muted-foreground">
            Sắp xếp
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="h-11 rounded-md bg-card pl-3 pr-8 text-body text-foreground shadow-[inset_0_0_0_1px_var(--color-input)] focus:shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Bộ lọc đang áp dụng">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.remove}
              aria-label={`Bỏ lọc ${chip.label}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-secondary pl-3.5 pr-3 text-body-sm text-foreground transition-colors duration-150 hover:bg-border"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="min-h-9 px-2 text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Bộ lọc">
          {filters}
        </aside>

        <section className="min-w-0 flex-1" aria-label="Danh sách sản phẩm" aria-busy={loading}>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="hairline p-8 text-center" role="alert">
              <h2 className="text-h3 text-foreground">Không tải được sản phẩm</h2>
              <p className="mt-2 text-body-sm text-muted-foreground">
                Máy chủ chưa phản hồi ({error}). Bạn thử lại sau ít giây nhé.
              </p>
              <Button
                variant="primary"
                size="md"
                className="mt-6"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Thử lại
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="hairline p-8 text-center">
              <h2 className="text-h3 text-foreground">Không có sản phẩm phù hợp</h2>
              <p className="mt-2 text-body-sm text-muted-foreground">
                {chips.length > 0
                  ? "Thử bỏ bớt bộ lọc hoặc chọn danh mục khác."
                  : "Danh mục này chưa có sản phẩm. Xem các danh mục khác nhé."}
              </p>
              {chips.length > 0 ? (
                <Button variant="primary" size="md" className="mt-6" onClick={clearAll}>
                  Xóa bộ lọc
                </Button>
              ) : (
                <Button variant="primary" size="md" asChild className="mt-6">
                  <Link to="/products" search={{}}>
                    Xem tất cả sản phẩm
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
                {visible.map((p, i) => (
                  <ProductCard key={p.id} product={p} onQuickView={setQuick} priority={i < 3} />
                ))}
              </div>
              <div className="mt-12 flex flex-col items-center gap-3 text-center">
                <p className="tabular text-body-sm text-muted-foreground">
                  Đã hiển thị {items.length} / {total} sản phẩm
                </p>
                {page + 1 < pageCount && (
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? "Đang tải…" : "Xem thêm sản phẩm"}
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {filtersOpen && (
        <FilterDrawer onClose={() => setFiltersOpen(false)} count={visible.length}>
          {filters}
        </FilterDrawer>
      )}
      {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
    </div>
  );
}

function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Runs once per open: move focus in, close on Escape, lock page scroll,
  // and hand focus back to the trigger on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, [href], input, select")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return ref;
}

function FilterDrawer({
  onClose,
  count,
  children,
}: {
  onClose: () => void;
  count: number;
  children: React.ReactNode;
}) {
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="flex-1 bg-foreground/40 animate-in fade-in-0 duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Bộ lọc sản phẩm"
        className="flex w-[22.5rem] max-w-[90vw] flex-col rounded-l-xl bg-background shadow-3 animate-in slide-in-from-right duration-300 ease-enter"
      >
        <div className="flex items-center justify-between hairline-b px-6 py-3">
          <span className="text-h3">Bộ lọc</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ lọc"
            className="-mr-3 flex h-11 w-11 items-center justify-center"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        <div className="hairline-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="primary" size="md" className="w-full" onClick={onClose}>
            Xem {count} sản phẩm
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useDialog(onClose);
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState("");
  const [adding, setAdding] = useState(false);
  const variant = size ? findVariant(product, color, size) : undefined;
  const sizeInStock = (s: string) =>
    product.variants.some((v) => v.color === color && v.size === s && v.stock > 0);

  const add = async () => {
    if (!variant) return;
    setAdding(true);
    try {
      await addToCart(variant.id);
      toast.success(`Đã thêm “${product.title}” (${colorLabel(color)}, ${size}) vào giỏ hàng`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa thêm được vào giỏ, bạn thử lại nhé.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 animate-in fade-in-0 duration-300 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-title"
        className="relative grid max-h-[90dvh] w-full max-w-3xl gap-6 overflow-y-auto rounded-t-xl bg-background p-6 shadow-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 ease-enter sm:rounded-xl sm:zoom-in-[0.97] sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 shadow-1 transition-colors duration-150 hover:bg-secondary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <img
          src={displayImage(product.image, product.category, product.id)}
          alt={product.title}
          width={600}
          height={800}
          className="aspect-[3/4] w-full rounded-lg bg-muted object-cover"
        />
        <div className="flex flex-col">
          <p className="text-body-sm text-muted-foreground">{product.category}</p>
          <h2 id="quick-title" className="mt-1 text-h2 text-foreground">
            {product.title}
          </h2>
          <p className="tabular mt-3 text-xl font-semibold text-foreground">
            {formatPrice(variant?.price ?? product.price)}
          </p>
          <StockBadge stock={product.stock} className="mt-2" />

          {product.colors.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-body-sm text-foreground">
                Màu: <span className="font-semibold">{colorLabel(color)}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <OptionChip
                    key={c}
                    selected={c === color}
                    onClick={() => {
                      setColor(c);
                      setSize("");
                    }}
                  >
                    {colorLabel(c)}
                  </OptionChip>
                ))}
              </div>
            </fieldset>
          )}

          {product.sizes.length > 0 && (
            <fieldset className="mt-4">
              <legend className="mb-2 text-body-sm text-foreground">
                Size: <span className="font-semibold">{size || "chưa chọn"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {sortSizes(product.sizes).map((s) => (
                  <OptionChip
                    key={s}
                    selected={s === size}
                    disabled={!sizeInStock(s)}
                    label={sizeInStock(s) ? `Size ${s}` : `Size ${s}, hết hàng`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </OptionChip>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-auto pt-6">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={!variant || adding}
              onClick={() => void add()}
            >
              {adding ? "Đang thêm…" : variant ? "Thêm vào giỏ hàng" : "Chọn size để thêm vào giỏ"}
            </Button>
            <Button variant="tertiary" size="sm" asChild className="mt-2 w-full">
              <Link to="/products/$slug" params={{ slug: product.slug }}>
                Xem chi tiết sản phẩm
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
