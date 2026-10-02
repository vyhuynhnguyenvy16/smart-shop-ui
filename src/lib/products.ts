import apparel1 from "@/assets/fashion-apparel-1.webp";
import apparel2 from "@/assets/fashion-apparel-2.webp";
import apparel3 from "@/assets/fashion-apparel-3.webp";
import apparel4 from "@/assets/fashion-apparel-4.webp";
import outerwear1 from "@/assets/fashion-outerwear-1.webp";
import outerwear2 from "@/assets/fashion-outerwear-2.webp";
import outerwear3 from "@/assets/fashion-outerwear-3.webp";
import outerwear4 from "@/assets/fashion-outerwear-4.webp";
import accessories1 from "@/assets/fashion-accessories-1.webp";
import accessories2 from "@/assets/fashion-accessories-2.webp";
import accessories3 from "@/assets/fashion-accessories-3.webp";
import accessories4 from "@/assets/fashion-accessories-4.webp";
import shoes1 from "@/assets/fashion-shoes-1.webp";
import shoes2 from "@/assets/fashion-shoes-2.webp";
import shoes3 from "@/assets/fashion-shoes-3.webp";
import shoes4 from "@/assets/fashion-shoes-4.webp";
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

export const CATEGORIES = ["Clothing", "Outerwear", "Denim", "Dresses", "Shoes", "Bags", "Accessories"] as const;

// API ẢNH SẢN PHẨM: image_key hiện là khóa ảnh minh họa dùng chung theo danh mục.
// Khi nối catalog thật, GET /products và GET /products/:slug cần trả imageUrl và
// images[] (URL CDN 800px+ cho từng sản phẩm/biến thể); thay imageForKey bằng URL đó.
// Đơn hàng cần giữ ảnh snapshot để ảnh trong lịch sử không đổi khi catalog cập nhật.
export const productImages: Record<string, string> = {
  "apparel-1": apparel1, "apparel-2": apparel2, "apparel-3": apparel3, "apparel-4": apparel4,
  "outerwear-1": outerwear1, "outerwear-2": outerwear2, "outerwear-3": outerwear3, "outerwear-4": outerwear4,
  "accessories-1": accessories1, "accessories-2": accessories2, "accessories-3": accessories3, "accessories-4": accessories4,
  "shoes-1": shoes1, "shoes-2": shoes2, "shoes-3": shoes3, "shoes-4": shoes4,
};

export function imageForKey(key: string | undefined) {
  return productImages[key ?? "apparel-1"] ?? apparel1;
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
