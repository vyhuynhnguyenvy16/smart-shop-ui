import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { cartTotals, detailedCart, useCart } from "@/lib/cart";

export function BottomNav() {
  const { count } = cartTotals(detailedCart(useCart()));

  const item =
    "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-sm text-muted-foreground [&.active]:text-primary";

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 flex hairline-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Link to="/" className={item} activeOptions={{ exact: true }}>
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link to="/products" search={{}} className={item}>
        <LayoutGrid className="h-5 w-5" />
        Shop
      </Link>
      <Link to="/cart" className={item}>
        <span className="relative">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-2 -top-1 text-[0.6875rem] font-semibold leading-none text-primary">
              {count}
            </span>
          )}
        </span>
        Cart
      </Link>
      <Link to="/auth" className={item}>
        <User className="h-5 w-5" />
        Account
      </Link>
    </nav>
  );
}
