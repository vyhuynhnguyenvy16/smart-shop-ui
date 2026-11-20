import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { cartTotals, detailedCart, useCart } from "@/lib/cart";

export function BottomNav() {
  const { count } = cartTotals(detailedCart(useCart()));

  const item =
    "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors [&.active]:text-primary";

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-40 flex hairline-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Link to="/" className={item} activeOptions={{ exact: true }}>
        <Home className="h-5 w-5" aria-hidden="true" />
        Trang chủ
      </Link>
      <Link to="/products" search={{}} className={item}>
        <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        Sản phẩm
      </Link>
      <Link to="/cart" className={item}>
        <span className="relative">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="tabular absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold leading-none text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        Giỏ hàng{count > 0 && <span className="sr-only">, {count} sản phẩm</span>}
      </Link>
      <Link to="/auth" className={item}>
        <User className="h-5 w-5" aria-hidden="true" />
        Tài khoản
      </Link>
    </nav>
  );
}
