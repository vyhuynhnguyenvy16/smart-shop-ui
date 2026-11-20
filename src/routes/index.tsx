import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
          <h1 className="text-display text-foreground">
            Ít món hơn,
            <br />
            mặc lâu hơn.
          </h1>
          <p className="mt-5 max-w-md text-body-lg text-muted-foreground md:text-[1.0625rem] md:leading-7">
            Quần áo, áo khoác và phụ kiện phom dáng gọn, chất liệu bền — chọn để mặc qua nhiều mùa,
            không chạy theo xu hướng.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="lg" asChild className="px-8">
              <Link to="/products" search={{}}>
                Mua sắm ngay
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="px-8">
              <a href="#new-heading">Xem hàng mới về</a>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2 text-body-sm text-foreground">
            {[
              "Miễn phí vận chuyển từ 500.000₫",
              "Đổi trả trong 30 ngày",
              "Thanh toán khi nhận hàng",
            ].map((t) => (
              <li
                key={t}
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-accent px-3.5 text-accent-foreground"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-[4/5] md:order-2">
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
          <h2 id="cat-heading" className="text-h2 text-foreground">
            Mua theo danh mục
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
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
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {featuredCategories.map((c) => (
            <Link key={c.name} to="/products" search={{ category: c.name }} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                <img
                  src={c.image}
                  alt=""
                  width={600}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-200 ease-standard group-hover:scale-[1.04]"
                />
              </div>
              <span className="mt-3 block text-title text-foreground transition-colors duration-150 group-hover:text-primary">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop section-y pt-0" aria-labelledby="edit-heading">
        <div className="grid items-center gap-8 overflow-hidden rounded-xl bg-secondary md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
            <h2 id="edit-heading" className="text-h2 text-foreground">
              Áo khoác cho mùa se lạnh
            </h2>
            <p className="mt-3 max-w-sm text-body-lg text-muted-foreground">
              Field jacket, măng tô, blazer và cardigan — những lớp khoác ngoài phom gọn, phối được
              với gần như mọi thứ trong tủ đồ.
            </p>
            <Button variant="primary" size="lg" asChild className="mt-6 px-8">
              <Link to="/products" search={{ category: "Áo Khoác" }}>
                Xem áo khoác
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-shop section-y pt-0" aria-labelledby="new-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="new-heading" className="text-h2 text-foreground">
            Hàng mới về
          </h2>
          <Link
            to="/products"
            search={{}}
            className="inline-flex min-h-11 items-center text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
        {featured === null ? (
          <p className="mt-6 hairline p-8 text-center text-body-sm text-muted-foreground">
            Chưa tải được sản phẩm mới. Bạn có thể{" "}
            <Link to="/products" search={{}} className="text-primary underline underline-offset-4">
              xem toàn bộ cửa hàng
            </Link>
            .
          </p>
        ) : featured.length === 0 ? (
          <p className="mt-6 text-body-sm text-muted-foreground">
            Sản phẩm mới đang được cập nhật.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
