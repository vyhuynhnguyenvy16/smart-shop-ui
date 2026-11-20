import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, Shield, User, X } from "lucide-react";
import { CATEGORIES, getProducts, type Product } from "@/lib/products";
import { cartTotals, detailedCart, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { displayImage } from "@/lib/images";

function SearchBox({ onNavigate, autoFocus }: { onNavigate?: () => void; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debounced (250ms) so typing doesn't fire one catalog request per keystroke.
    // API TÌM KIẾM: dùng GET /api/products?name=q&size=5 (hàm getProducts sẵn có).
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void getProducts({ page: 0, size: 5, search: q })
        .then((items) => {
          if (active) setSuggestions(items.slice(0, 5));
        })
        .catch(() => {
          if (active) setSuggestions([]);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showList = open && suggestions.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          onNavigate?.();
          navigate({ to: "/products", search: query.trim() ? { q: query.trim() } : {} });
        }}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Tìm sản phẩm"
          aria-label="Tìm sản phẩm"
          aria-expanded={showList}
          aria-controls="search-suggestions"
          autoComplete="off"
          autoFocus={autoFocus}
          className="h-11 w-full border-b border-input bg-transparent pl-6 pr-2 text-base outline-none placeholder:text-muted-foreground focus:border-foreground focus-visible:outline-none"
        />
      </form>
      {showList && (
        <ul
          id="search-suggestions"
          className="absolute inset-x-0 top-12 z-50 overflow-hidden border border-border bg-background shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)]"
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link
                to="/products/$slug"
                params={{ slug: s.slug }}
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"
              >
                <img
                  src={displayImage(s.image, s.category, s.id)}
                  alt=""
                  width={40}
                  height={53}
                  loading="lazy"
                  className="h-[53px] w-10 bg-muted object-cover"
                />
                <span className="line-clamp-2-title flex-1">{s.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Header() {
  const cart = useCart();
  const { count } = cartTotals(detailedCart(cart));
  const [open, setOpen] = useState(false);
  const location = useRouterState({ select: (s) => s.location });
  const activeCategory =
    location.pathname === "/products"
      ? ((location.search as { category?: string }).category ?? null)
      : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-background hairline-b">
      <p className="bg-foreground px-4 py-2 text-center text-[0.8125rem] text-background">
        <span className="sm:hidden">Freeship từ 500.000₫ · Đổi trả 30 ngày</span>
        <span className="hidden sm:inline">
          Miễn phí vận chuyển cho đơn từ 500.000₫ · Đổi trả miễn phí trong 30 ngày
        </span>
      </p>

      <div className="container-shop flex h-16 items-center gap-2 md:h-20 md:gap-4">
        <button
          type="button"
          className="-ml-2.5 flex h-11 w-11 items-center justify-center text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link
          to="/"
          className="font-display text-2xl tracking-tight text-foreground"
          style={{ fontWeight: 500 }}
          aria-label="Northline — trang chủ"
        >
          Northline
        </Link>

        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Danh mục">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c;
            return (
              <Link
                key={c}
                to="/products"
                search={{ category: c }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap border-b pb-1 text-sm transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {c}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center md:ml-0">
          <Link
            to="/auth"
            aria-label="Tài khoản"
            className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary"
          >
            <User className="h-[22px] w-[22px]" />
          </Link>
          <Link
            to="/admin/orders"
            aria-label="Trang quản trị"
            className="hidden h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-primary md:flex"
          >
            <Shield className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng trống"}
            className="relative -mr-2.5 flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary"
          >
            <ShoppingBag className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="tabular absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] font-semibold leading-none text-primary-foreground"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="hairline-t bg-background lg:hidden">
          <div className="container-shop py-4 md:hidden">
            <SearchBox onNavigate={() => setOpen(false)} />
          </div>
          <nav className="container-shop grid pb-6" aria-label="Danh mục">
            <Link
              to="/products"
              search={{}}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center hairline-b text-base text-foreground"
            >
              Tất cả sản phẩm
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to="/products"
                search={{ category: c }}
                onClick={() => setOpen(false)}
                aria-current={activeCategory === c ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center hairline-b text-base",
                  activeCategory === c ? "text-primary" : "text-foreground",
                )}
              >
                {c}
              </Link>
            ))}
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center text-base text-muted-foreground"
            >
              Đơn hàng của tôi
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
