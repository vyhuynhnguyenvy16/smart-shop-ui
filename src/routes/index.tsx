import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getProducts } from "@/lib/products";
import { absoluteUrl, jsonLd, pageHead } from "@/lib/seo";
import { seedImagePath } from "@/lib/catalog-seed";

// Product photography: Material Design "Shrine" set (Apache-2.0) + project assets — see src/lib/catalog-seed.ts.
const hero = "/products/hero-so-mi-trang.webp";

export const Route = createFileRoute("/")({
  // Backend offline must not blank the home page; show the rest of the page instead.
  loader: () =>
    getProducts({ page: 0, size: 8, sortBy: "createdAt", sortDirection: "desc" }).catch(() => null),
  head: () => ({
    ...pageHead({
      title: "Northline — Thời trang tối giản, mặc được lâu",
      description:
        "Mua quần áo, áo khoác, quần jean, váy đầm, giày, túi và phụ kiện tại Northline. Miễn phí vận chuyển cho đơn từ 500.000₫, đổi trả trong 30 ngày.",
      path: "/",
      image: hero,
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Northline",
        url: absoluteUrl("/"),
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/products")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }),
    ],
  }),
  component: Home,
});

// Category tiles: the link text names the category, so the photos are decorative (alt="").
const featuredCategories: Array<{ name: (typeof CATEGORIES)[number]; image: string }> = [
  { name: "Áo Quần", image: seedImagePath("so-mi-chambray-nu") },
  { name: "Áo Khoác", image: seedImagePath("mang-to-dang-dai") },
  { name: "Giày Dép", image: seedImagePath("giay-sneaker-da-xam") },
  { name: "Túi Xách", image: seedImagePath("balo-da-vagabond") },
];
const otherCategories = CATEGORIES.filter((c) => !featuredCategories.some((f) => f.name === c));

function Home() {
  const featured = Route.useLoaderData();

  return (
    <>
      <section className="container-shop grid gap-8 pb-12 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-center md:gap-12 md:pb-16 md:pt-12">
        <div className="hero-enter order-2 md:order-1">
          <h1 className="font-display text-[2.5rem] leading-[1.05] text-foreground sm:text-5xl lg:text-[3.5rem]">
            Ít món hơn,
            <br />
            mặc lâu hơn.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
            Quần áo, áo khoác và phụ kiện phom dáng gọn, chất liệu bền — chọn để mặc qua nhiều mùa,
            không chạy theo xu hướng.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="md" asChild className="h-12 px-8">
              <Link to="/products" search={{}}>
                Mua sắm ngay
              </Link>
            </Button>
            <Button variant="secondary" size="md" asChild className="h-12 px-8">
              <a href="#new-heading">Xem hàng mới về</a>
            </Button>
          </div>
          <ul className="mt-10 grid gap-2 hairline-t pt-5 text-sm text-muted-foreground sm:grid-cols-3 sm:gap-4">
            <li>Miễn phí vận chuyển từ 500.000₫</li>
            <li>Đổi trả trong 30 ngày</li>
            <li>Thanh toán khi nhận hàng</li>
          </ul>
        </div>
        <div className="order-1 aspect-[4/3] overflow-hidden bg-muted sm:aspect-[4/5] md:order-2">
          <img
            src={hero}
            alt="Người mẫu mặc sơ mi trắng cổ đức và quần jean"
            width={664}
            height={988}
            fetchPriority="high"
            className="h-full w-full object-cover object-[50%_20%]"
          />
        </div>
      </section>

      <section className="container-shop section-y" aria-labelledby="cat-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="cat-heading" className="font-display text-2xl text-foreground md:text-3xl">
            Mua theo danh mục
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {otherCategories.map((c) => (
              <li key={c}>
                <Link
                  to="/products"
                  search={{ category: c }}
                  className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredCategories.map((c) => (
            <Link key={c.name} to="/products" search={{ category: c.name }} className="group block">
              <div className="aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={c.image}
                  alt=""
                  width={600}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-85"
                />
              </div>
              <span className="mt-3 block text-base text-foreground group-hover:text-primary">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop section-y pt-0" aria-labelledby="edit-heading">
        <div className="grid items-center gap-8 bg-card hairline md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="aspect-[3/2] overflow-hidden bg-muted">
            <img
              src="/products/editorial-ao-khoac.webp"
              alt="Người mẫu mặc áo khoác field xanh rêu bên ngoài áo thun trắng"
              width={988}
              height={658}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="px-6 pb-8 md:py-10 md:pl-0 md:pr-10">
            <h2 id="edit-heading" className="font-display text-2xl text-foreground md:text-3xl">
              Áo khoác cho mùa se lạnh
            </h2>
            <p className="mt-3 max-w-sm text-base text-muted-foreground">
              Field jacket, măng tô, blazer và cardigan — những lớp khoác ngoài phom gọn, phối được
              với gần như mọi thứ trong tủ đồ.
            </p>
            <Button variant="primary" size="md" asChild className="mt-6 h-12 px-8">
              <Link to="/products" search={{ category: "Áo Khoác" }}>
                Xem áo khoác
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-shop section-y pt-0" aria-labelledby="new-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 hairline-b pb-4">
          <h2 id="new-heading" className="font-display text-2xl text-foreground md:text-3xl">
            Hàng mới về
          </h2>
          <Link
            to="/products"
            search={{}}
            className="inline-flex min-h-11 items-center text-sm text-foreground underline underline-offset-4 hover:text-primary"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
        {featured === null ? (
          <p className="mt-6 hairline p-8 text-center text-sm text-muted-foreground">
            Chưa tải được sản phẩm mới. Bạn có thể{" "}
            <Link to="/products" search={{}} className="text-primary underline underline-offset-4">
              xem toàn bộ cửa hàng
            </Link>
            .
          </p>
        ) : featured.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Sản phẩm mới đang được cập nhật.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
