/**
 * SEO helpers shared by route `head()` functions.
 * Checklist source: claude-seo (AgriciDaniel) ecommerce + technical skills —
 * unique <title> under ~60 chars with the brand, meta description under ~155
 * chars, canonical URL, Open Graph locale, Product + BreadcrumbList JSON-LD.
 */
export const SITE_URL = "https://smart-shop-ui.vy-huynhnguyenvy-42b.workers.dev";
export const SITE_NAME = "Northline";

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function clip(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "product";
  noindex?: boolean;
};

/** Standard meta + link set for a page. Spread into a route's `head()` result. */
export function pageHead({ title, description, path, image, type = "website", noindex }: PageMeta) {
  const desc = clip(description);
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:type", content: type },
    { property: "og:url", content: absoluteUrl(path) },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (image) {
    meta.push({ property: "og:image", content: absoluteUrl(image) });
    meta.push({ name: "twitter:image", content: absoluteUrl(image) });
  }
  if (noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return {
    meta,
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
  };
}

export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}
