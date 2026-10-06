import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, Shield, User, X } from "lucide-react";
import { CATEGORIES, getProducts, type Product } from "@/lib/products";
import { cartTotals, detailedCart, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export function Header() {
  const cart = useCart();
  const { count } = cartTotals(detailedCart(cart));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    // API TÌM KIẾM: GET /products?search=q&size=5 (hoặc /search/suggest?q=...);
    // debounce và trả kết quả từ server; hiện tải 20 sản phẩm rồi lọc trong trình duyệt.
    const q = query.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let active = true;
    void getProducts({ page: 0, size: 20 })
      .then((items) => {
        if (active)
          setSuggestions(items.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 5));
      })
      .catch(() => {
        if (active) setSuggestions([]);
      });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <p className="bg-success py-2 text-center text-sm font-semibold text-success-foreground">
        Miễn phí vận chuyển từ 500.000₫ · 30-Day Free Returns
      </p>

      <div className="container-shop flex h-16 items-center gap-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open menu"
        >
          {open ? <Menu className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
          Northline
        </Link>

        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Main">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/products"
              search={{ category: c }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {c}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto hidden min-w-[300px] flex-1 max-w-md sm:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/products", search: { q: query } });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              autoComplete="off"
              className="h-12 w-full rounded-lg border border-input bg-card pl-11 pr-4 text-base outline-none focus:border-primary"
            />
          </form>
          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-14 overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-card-hover)]">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/products/$slug"
                    params={{ slug: s.slug }}
                    onClick={() => setQuery("")}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-card"
                  >
                    <img
                      src={s.image}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      className="h-10 w-10 rounded-md object-cover"
                    />
                    <span className="line-clamp-2-title">{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/cart"
          aria-label={`Cart, ${count} items`}
          className="relative ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-foreground sm:ml-0"
        >
          <ShoppingCart className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-sm font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <Link
          to="/auth"
          aria-label="Account"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-card"
        >
          <User className="h-6 w-6" />
        </Link>
        <Link
          to="/admin/orders"
          aria-label="Admin"
          className="hidden h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-card sm:flex"
        >
          <Shield className="h-5 w-5" />
        </Link>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="container-shop flex items-center justify-between py-3">
            <span className="text-sm font-semibold">Categories</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="container-shop grid gap-1 pb-4" aria-label="Mobile">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to="/products"
                search={{ category: c }}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-base font-medium text-foreground hover:bg-card"
              >
                {c}
              </Link>
            ))}
            <Button
              variant="secondary"
              size="md"
              className="mt-2"
              onClick={() => {
                setOpen(false);
                navigate({ to: "/products", search: {} });
              }}
            >
              Shop all products
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
