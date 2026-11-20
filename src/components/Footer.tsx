import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/products";

const linkCls =
  "inline-flex min-h-8 items-center text-sm text-muted-foreground hover:text-foreground";

export function Footer() {
  return (
    <footer className="mt-20 hairline-t bg-background pb-20 md:pb-0">
      <div className="container-shop grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-foreground" style={{ fontWeight: 500 }}>
            Northline
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Quần áo và phụ kiện tối giản, chọn để mặc được lâu.
          </p>
        </div>

        <nav aria-label="Danh mục ở chân trang">
          <h2 className="text-sm font-semibold text-foreground">Danh mục</h2>
          <ul className="mt-3 grid gap-1">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link to="/products" search={{ category: c }} className={linkCls}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tài khoản">
          <h2 className="text-sm font-semibold text-foreground">Mua sắm</h2>
          <ul className="mt-3 grid gap-1">
            <li>
              <Link to="/products" search={{}} className={linkCls}>
                Tất cả sản phẩm
              </Link>
            </li>
            <li>
              <Link to="/cart" className={linkCls}>
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link to="/orders" className={linkCls}>
                Đơn hàng của tôi
              </Link>
            </li>
            <li>
              <Link to="/account" className={linkCls}>
                Tài khoản
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Chính sách</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>Miễn phí vận chuyển cho đơn từ 500.000₫</li>
            <li>Đổi trả miễn phí trong 30 ngày</li>
            <li>Thanh toán khi nhận hàng (COD)</li>
          </ul>
        </div>
      </div>
      <div className="container-shop flex flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted-foreground hairline-t">
        <span>© {new Date().getFullYear()} Northline</span>
      </div>
    </footer>
  );
}
