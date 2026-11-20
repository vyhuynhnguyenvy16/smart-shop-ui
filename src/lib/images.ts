import { CATALOG_SEED, seedImagePath } from "./catalog-seed";
import { imageForKey } from "./products";

/** The single placeholder the product adapter uses when the API sends no image. */
const ADAPTER_PLACEHOLDER = imageForKey(undefined);

/** A product photo from the catalogue set, stable per category + id. */
export function photoFor(category: string | undefined, seed = 0) {
  const pool = CATALOG_SEED.filter((s) => s.category === category);
  const list = pool.length ? pool : CATALOG_SEED;
  return seedImagePath(list[Math.abs(seed) % list.length]!.slug);
}

/**
 * Image to show for a product: the API's own image when it has one, otherwise a
 * category photo instead of the adapter's single shared placeholder (which made
 * every image-less product look identical).
 */
export function displayImage(src: string | undefined, category: string | undefined, seed = 0) {
  return !src || src === ADAPTER_PLACEHOLDER ? photoFor(category, seed) : src;
}
