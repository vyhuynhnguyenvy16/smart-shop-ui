import headphones from "@/assets/fashion-audio.webp";
import sneakers from "@/assets/fashion-footwear.webp";
import backpack from "@/assets/fashion-bags.webp";
import watch from "@/assets/fashion-watches.webp";
import {
  getCategories,
  getProductById as fetchProductById,
  getProductBySlugRaw,
  getProductsPage as fetchProductsPage,
  type CategoryResponse,
  type ProductResponse,
  type VariantResponse,
} from "./api-client";

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  title: string;
  price: number;
  compareAt: number | null;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  categoryId: number;
  stock: "in" | "low" | "out";
  badge: string | null;
  variants: VariantResponse[];
  colors: string[];
  sizes: string[];
  createdAt: string;
};

export const CATEGORIES = [
  "Audio",
  "Footwear",
  "Bags",
  "Watches",
  "Home",
  "Fitness",
  "Deals",
] as const;

// API ẢNH SẢN PHẨM: image_key hiện là khóa ảnh minh họa dùng chung theo danh mục.
// Khi nối catalog thật, GET /products và GET /products/:slug cần trả imageUrl và
// images[] (URL CDN 800px+ cho từng sản phẩm/biến thể); thay imageForKey bằng URL đó.
// Đơn hàng cần giữ ảnh snapshot để ảnh trong lịch sử không đổi khi catalog cập nhật.
export const productImages: Record<string, string> = {
  headphones,
  footwear: sneakers,
  bags: backpack,
  watches: watch,
};

export function imageForKey(key: string | undefined) {
  return productImages[key ?? "headphones"] ?? headphones;
}

export function adaptProduct(product: ProductResponse): Product {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    title: product.name,
    price: product.basePrice,
    compareAt: product.compareAtPrice,
    rating: product.rating,
    reviews: product.reviewsCount,
    image: imageForKey(product.imageKey),
    category: product.categoryName,
    categoryId: product.categoryId,
    stock: totalStock === 0 ? "out" : totalStock < 15 ? "low" : "in",
    badge: product.badge,
    variants: product.variants,
    colors: [...new Set(product.variants.map((v) => v.color))],
    sizes: [...new Set(product.variants.map((v) => v.size))],
    createdAt: product.createdAt,
  };
}

export async function getProductsPage(params?: Parameters<typeof fetchProductsPage>[0]) {
  const page = await fetchProductsPage(params);
  return { ...page, content: page.content.map(adaptProduct) };
}

export async function getProducts(params?: Parameters<typeof fetchProductsPage>[0]) {
  return (await getProductsPage(params)).content;
}

export async function getProductById(id: number) {
  const product = await fetchProductById(id);
  return product ? adaptProduct(product) : undefined;
}

export async function getProductBySlug(slug: string) {
  const product = await getProductBySlugRaw(slug);
  return product ? adaptProduct(product) : undefined;
}

export function findVariant(product: Product, color: string, size: string) {
  return product.variants.find((v) => v.color === color && v.size === size);
}

export async function getProductCategories(): Promise<CategoryResponse[]> {
  return getCategories();
}

export const formatPrice = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FEE = 6;
