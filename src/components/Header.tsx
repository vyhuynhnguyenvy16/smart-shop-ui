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
    <header className="sticky top-0 z-40 bg-background hairline-b">
      <p className="bg-foreground py-2 text-center text-sm text-background">
        Miễn phí vận chuyển từ 500.000₫ &nbsp;·&nbsp; 30-day free returns
      </p>

      <div className="container-shop flex h-20 items-center gap-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open menu"
        >
          {open ? <Menu className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link
          to="/"
          className="font-display text-2xl tracking-tight text-foreground"
          style={{ fontWeight: 500 }}
        >
          Northline
        </Link>

        <nav className="ml-8 hidden items-center gap-6 lg:flex" aria-label="Main">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/products"
              search={{ category: c }}
              className="border-b border-transparent pb-1 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              {c}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto hidden min-w-[280px] flex-1 max-w-sm sm:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/products", search: { q: query } });
            }}
          >
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              autoComplete="off"
              className="h-11 w-full border-b border-input bg-transparent pl-6 pr-2 text-base outline-none placeholder:text-muted-foreground focus:border-foreground"
            />
          </form>
          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-12 overflow-hidden border border-border bg-background">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/products/$slug"
                    params={{ slug: s.slug }}
                    onClick={() => setQuery("")}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted"
                  >
                    <img
                      src={s.image}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      className="h-10 w-10 object-cover"
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
          className="relative ml-auto flex h-11 w-11 items-center justify-center text-foreground sm:ml-0"
        >
          <ShoppingCart className="h-6 w-6" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[0.6875rem] font-semibold leading-none text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <Link
          to="/auth"
          aria-label="Account"
          className="flex h-11 w-11 items-center justify-center text-foreground hover:text-muted-foreground"
        >
          <User className="h-6 w-6" />
        </Link>
        <Link
          to="/admin/orders"
          aria-label="Admin"
          className="hidden h-11 w-11 items-center justify-center text-foreground hover:text-muted-foreground sm:flex"
        >
          <Shield className="h-5 w-5" />
        </Link>
      </div>

      {open && (
        <div className="hairline-t md:hidden">
          <div className="container-shop flex items-center justify-between py-3">
            <span className="font-display text-base" style={{ fontWeight: 500 }}>
              Categories
            </span>
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
                className="flex min-h-11 items-center px-2 text-base text-foreground hover:bg-muted"
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
