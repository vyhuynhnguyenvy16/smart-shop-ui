import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 hairline-t bg-background">
      <div className="container-shop grid gap-x-8 gap-y-6 py-12 sm:grid-cols-3">
        <p className="text-sm text-muted-foreground">
          Miễn phí vận chuyển từ 500.000₫, giao trong 3–5 ngày.
        </p>
        <p className="text-sm text-muted-foreground">30 ngày đổi trả miễn phí, không cần lý do.</p>
        <p className="text-sm text-muted-foreground">Thanh toán được bảo mật SSL toàn trình.</p>
      </div>
      <div className="container-shop flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-muted-foreground hairline-t">
        <span className="font-display" style={{ fontWeight: 500 }}>
          Northline
        </span>
        <div className="flex gap-6">
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
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
