import { Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="container-shop grid gap-6 py-12 sm:grid-cols-3">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <Truck className="h-5 w-5 text-success" /> Miễn phí vận chuyển từ 500.000₫
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <RotateCcw className="h-5 w-5 text-success" /> 30-Day Free Returns
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-5 w-5 text-success" /> SSL Secure Checkout
        </div>
      </div>
      <div className="container-shop flex flex-wrap items-center justify-between gap-4 border-t border-border py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Northline</span>
        <div className="flex gap-4">
          <Link to="/products" search={{}} className="hover:text-foreground hover:underline">
            Shop
          </Link>
          <Link to="/cart" className="hover:text-foreground hover:underline">
            Cart
          </Link>
          <Link to="/checkout" className="hover:text-foreground hover:underline">
            Checkout
          </Link>
        </div>
      </div>
    </footer>
  );
}
