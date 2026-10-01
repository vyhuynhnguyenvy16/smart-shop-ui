import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getProducts } from "@/lib/products";
import hero from "@/assets/fashion-audio.webp";
import sneakers from "@/assets/fashion-footwear.webp";
import backpack from "@/assets/fashion-bags.webp";
import watch from "@/assets/fashion-watches.webp";

export const Route = createFileRoute("/")({
  loader: () => getProducts({ page: 0, size: 4 }),
  head: () => ({
    meta: [
      { title: "Northline — Everyday Gear, Free Shipping Over $50" },
      {
        name: "description",
        content:
          "Shop audio, footwear, bags and watches at Northline. Free shipping over $50, 30-day free returns and secure guest checkout.",
      },
      { property: "og:title", content: "Northline — Everyday Gear" },
      {
        property: "og:description",
        content: "Curated audio, footwear, bags and watches with free shipping over $50.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const categoryImages: Record<string, string> = {
  Audio: hero,
  Footwear: sneakers,
  Bags: backpack,
  Watches: watch,
};

function Home() {
  const featured = Route.useLoaderData();

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="container-shop grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-success/10 px-2 py-1 text-sm font-semibold text-success">
              <Star className="h-4 w-4 fill-success" /> 4.8/5 from 12,400+ customers
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
              Gear that earns its place in your day
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Tested essentials, honest prices, free shipping over $50 and 30-day free returns.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="md" asChild className="w-full sm:w-auto">
                <Link to="/products" search={{}}>
                  Shop best sellers
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-success" /> Free shipping over $50
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-success" /> 30-day returns
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Secure payment
              </li>
            </ul>
          </div>
          <img
            src={hero}
            alt="Northline editorial look with wireless headphones and tailored separates"
            width={1024}
            height={1024}
            className="mx-auto w-full max-w-md rounded-xl object-cover shadow-[var(--shadow-card)]"
          />
        </div>
      </section>

      <section className="container-shop section-y">
        <h2 className="text-2xl font-semibold text-foreground">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          {CATEGORIES.slice(0, 4).map((c) => (
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
