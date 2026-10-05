import { useSyncExternalStore } from "react";
import {
  addCartItem,
  deleteCartItem,
  getCart,
  updateCartItem,
  type CartItemResponse,
  type CartResponse,
} from "./api-client";
import { imageForKey, type Product } from "./products";

export type CartLine = {
  id: string;
  qty: number;
  itemId: number;
  variantId: number;
  item: CartItemResponse;
};

let lines: CartLine[] = [];
let loaded = false;
let loading = false;
const listeners = new Set<() => void>();
const EMPTY: CartLine[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function applyCart(cart: CartResponse) {
  lines = cart.items.map((item) => ({
    id: String(item.id),
    qty: item.quantity,
    itemId: item.id,
    variantId: item.variantId,
    item,
  }));
  loaded = true;
  emit();
}

async function loadCart() {
  if (loading || loaded || typeof window === "undefined") return;
  loading = true;
  try {
    applyCart(await getCart());
  } finally {
    loading = false;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  void loadCart();
  return () => listeners.delete(callback);
}

export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => lines,
    () => EMPTY,
  );
}

export async function addToCart(variantId: string | number, qty = 1) {
  applyCart(await addCartItem(Number(variantId), qty));
}

export async function setQty(itemId: string | number, qty: number) {
  if (qty <= 0) {
    await removeFromCart(itemId);
    return;
  }
  applyCart(await updateCartItem(Number(itemId), qty));
}

export async function removeFromCart(itemId: string | number) {
  await deleteCartItem(Number(itemId));
  if (loaded) {
    lines = lines.filter((line) => line.itemId !== Number(itemId));
    emit();
  }
}

/** The backend empties the cart when an order is created; just resync. */
export async function clearCart() {
  lines = [];
  emit();
  try {
    applyCart(await getCart());
  } catch {
    /* keep empty */
  }
}

export async function reloadCart() {
  loaded = false;
  try {
    applyCart(await getCart());
  } catch {
    lines = [];
    emit();
  }
}

function productFromCart(item: CartItemResponse): Product {
  const image = item.imageUrl ?? imageForKey(undefined);
  return {
    id: item.productId,
    name: item.productName,
    slug: item.productSlug,
    description: "",
    title: item.productName,
    price: item.unitPrice,
    compareAt: null,
    rating: 0,
    reviews: 0,
    image,
    images: [image],
    category: "",
    categoryId: 0,
    stock: item.stock === 0 ? "out" : item.stock < 15 ? "low" : "in",
    badge: null,
    variants: [],
    colors: item.color ? [item.color] : [],
    sizes: item.size ? [item.size] : [],
    createdAt: "",
  };
}

export type CartItem = {
  product: Product;
  qty: number;
  itemId: number;
  variantId: number;
  item: CartItemResponse;
};

export function detailedCart(cart: CartLine[]): CartItem[] {
  return cart.map((line) => ({
    product: productFromCart(line.item),
    qty: line.qty,
    itemId: line.itemId,
    variantId: line.variantId,
    item: line.item,
  }));
}

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.item.subtotal, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, count };
}
