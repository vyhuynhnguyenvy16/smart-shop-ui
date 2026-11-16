import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getProducts } from "@/lib/products";
import hero from "@/assets/fashion-apparel-1.webp";
import sneakers from "@/assets/fashion-shoes-1.webp";
import backpack from "@/assets/fashion-accessories-1.webp";
import watch from "@/assets/fashion-outerwear-1.webp";

export const Route = createFileRoute("/")({
  // Backend offline must not blank the home page; show an empty grid instead.
  loader: () => getProducts({ page: 0, size: 8 }).catch(() => []),
  head: () => ({
    meta: [
      { title: "Northline — Modern Fashion & Everyday Style" },
      {
        name: "description",
        content:
          "Shop clothing, outerwear, denim, dresses, shoes, bags and accessories at Northline.",
      },
      { property: "og:title", content: "Northline — Modern Fashion" },
      {
        property: "og:description",
        content: "Discover modern clothing, shoes and accessories at Northline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const categoryImages: Record<string, string> = {
  "Áo Quần": hero,
  "Áo Khoác": watch,
  "Giày Dép": sneakers,
  "Túi Xách": backpack,
};

function Home() {
  const featured = Route.useLoaderData();
  const shopCategories = CATEGORIES.filter((c) =>
    ["Áo Quần", "Áo Khoác", "Giày Dép", "Túi Xách"].includes(c),
  );

  return (
    <>
      <section className="container-shop grid gap-10 pb-10 pt-10 md:grid-cols-2 md:items-center md:pt-16">
        <div className="order-2 md:order-1">
          <p className="text-sm text-muted-foreground">Rated 4.8 by 12,400+ customers</p>
          <h1 className="font-display mt-3 text-[2.75rem] leading-[1.05] text-foreground sm:text-5xl md:text-[3.25rem]">
            Fewer, better
            <br />
            things to wear.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Clothing, outerwear and accessories built to outlast a season — tried on, worn in, kept.
            No drops, no noise, just the edit.
          </p>
          <div className="mt-8">
            <Button variant="primary" size="md" asChild className="w-full sm:w-auto">
              <Link to="/products" search={{}}>
                Shop the edit
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 hairline-t pt-5 text-sm text-muted-foreground">
            <span>Miễn phí vận chuyển từ 500.000₫</span>
            <span className="text-border">—</span>
            <span>30-day returns</span>
            <span className="text-border">—</span>
            <span>Secure checkout</span>
          </div>
        </div>
        <div className="order-1 aspect-[4/5] overflow-hidden bg-muted md:order-2">
          <img
            src={hero}
            alt="Northline fashion editorial in a crisp white shirt"
            width={768}
            height={960}
            className="h-full w-full object-cover object-top"
          />
        </div>
      </section>

      <section className="container-shop section-y">
        <h2 className="font-display text-2xl text-foreground">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {shopCategories.map((c) => (
            <Link key={c} to="/products" search={{ category: c }} className="group bg-background">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={categoryImages[c]}
                  alt={c}
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-85"
                />
              </div>
              <span className="block pt-3 text-sm text-foreground group-hover:text-primary">
                {c}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop section-y pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4 hairline-b pb-4">
          <h2 className="font-display text-2xl text-foreground">Featured this week</h2>
          <Button variant="tertiary" size="sm" asChild>
            <Link to="/products" search={{}}>
              View all products
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
