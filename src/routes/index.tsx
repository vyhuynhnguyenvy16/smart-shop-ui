import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getProducts } from "@/lib/products";
import hero from "@/assets/fashion-apparel-1.webp";
import sneakers from "@/assets/fashion-shoes-1.webp";
import backpack from "@/assets/fashion-accessories-1.webp";
import watch from "@/assets/fashion-outerwear-1.webp";

export const Route = createFileRoute("/")({
  loader: () => getProducts({ page: 0, size: 8 }),
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

  return (
    <>
      <section className="relative min-h-[460px] overflow-hidden bg-card md:min-h-[530px]">
        <img src={hero} alt="Northline fashion editorial in a crisp white shirt" width={768} height={768} className="absolute inset-0 h-full w-full object-cover object-top md:object-center" />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="container-shop relative flex min-h-[460px] items-center py-12 md:min-h-[530px]">
          <div className="max-w-xl text-primary-foreground">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-success/10 px-2 py-1 text-sm font-semibold text-success">
              <Star className="h-4 w-4 fill-success" /> 4.8/5 from 12,400+ customers
            </p>
            <h1 className="text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Northline
            </h1>
            <p className="mt-4 max-w-md text-base text-primary-foreground">
              Modern pieces made for every day. Discover clothing, shoes and accessories worth keeping.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="md" asChild className="w-full sm:w-auto">
                <Link to="/products" search={{}}>
                  Shop best sellers
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-success" /> Miễn phí vận chuyển từ 500.000₫
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-success" /> 30-day returns
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Secure payment
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container-shop section-y">
        <h2 className="text-2xl font-semibold text-foreground">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          {CATEGORIES.filter((c) => ["Áo Quần", "Áo Khoác", "Giày Dép", "Túi Xách"].includes(c)).map((c) => (
            <Link
              key={c}
              to="/products"
              search={{ category: c }}
              className="group overflow-hidden rounded-xl bg-card shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02]"
            >
              <img
                src={categoryImages[c]}
                alt={c}
                width={1024}
                height={1024}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <span className="block p-4 text-base font-semibold text-foreground group-hover:text-primary">
                {c}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop section-y pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Featured this week</h2>
          <Button variant="tertiary" size="sm" asChild>
            <Link to="/products" search={{}}>
              View all products
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
