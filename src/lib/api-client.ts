/**
 * Client for the Northline Spring Boot backend (VITE_API_URL).
 * Contract source: {VITE_API_URL}/v3/api-docs (Swagger).
 * Auth: POST /api/auth/login|register|refresh|logout → JWT bearer stored in localStorage.
 * Not provided by the backend yet (UI hides these): product slug lookup, compare-at price,
 * ratings/reviews, profile update, product image on cart lines, admin variant CRUD.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export type VariantResponse = {
  id: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock: number;
};

export type ProductResponse = {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  status: string;
  imageKey: string;
  imageUrl: string | null;
  images: string[];
  rating: number;
  reviewsCount: number;
  badge: string | null;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  variants: VariantResponse[];
};

export type CategoryResponse = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

export type UserResponse = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type CartItemResponse = {
  id: number;
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  imageKey: string;
  imageUrl: string | null;
  sku: string;
  size: string;
  color: string;
  stock: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type CartResponse = {
  id: number;
  items: CartItemResponse[];
  totalAmount: number;
};

export type OrderItemResponse = {
  id: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  imageKeySnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
};

export type OrderResponse = {
  id: number;
  status: string;
  totalAmount: number;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingAddressLine: string;
  shippingCity: string;
  paymentMethod: string;
  items: OrderItemResponse[];
  createdAt: string;
};

export type ApiError = Error & { status?: number };

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* ------------------------------ Token storage ----------------------------- */

const TOKEN_KEY = "northline-auth";
const DEVICE_KEY = "northline-device-id";
type Tokens = { accessToken: string; refreshToken: string };
const authListeners = new Set<() => void>();

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(TOKEN_KEY) ?? "null") as Tokens | null;
  } catch {
    return null;
  }
}

function setTokens(tokens: Tokens | null) {
  if (typeof window === "undefined") return;
  if (tokens) window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else window.localStorage.removeItem(TOKEN_KEY);
  authListeners.forEach((l) => l());
}

export function onAuthChange(listener: () => void) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function deviceId() {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/* --------------------------------- Request -------------------------------- */

async function errorFrom(res: Response): Promise<ApiError> {
  let message = "";
  try {
    const text = await res.text();
    try {
      const body = JSON.parse(text) as { message?: string; error?: string; detail?: string };
      message = body.message || body.detail || body.error || "";
    } catch {
      message = text;
    }
  } catch {
    /* ignore */
  }
  if (!message) {
    message =
      res.status === 401
        ? "Please sign in to continue."
        : res.status === 403
          ? "You do not have permission to do that."
          : res.status === 404
            ? "Not found."
            : `Request failed (${res.status}).`;
  }
  const err = new Error(message) as ApiError;
  err.status = res.status;
  return err;
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) {
        setTokens(null);
        return false;
      }
      const data = (await res.json()) as Tokens;
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? tokens.refreshToken });
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean; headers?: Record<string, string> } = {},
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...init.headers };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const token = getTokens()?.accessToken;
  if (init.auth && token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? null : JSON.stringify(init.body),
    });
  } catch {
    const err = new Error("Cannot reach the store server. Check your connection and try again.") as ApiError;
    err.status = 0;
    throw err;
  }
  if (res.status === 401 && init.auth && !retried && (await tryRefresh())) {
    return request<T>(path, init, true);
  }
  if (!res.ok) throw await errorFrom(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

/* ---------------------------------- Auth --------------------------------- */

export function isSignedIn() {
  return Boolean(getTokens()?.accessToken);
}

export async function registerUser(body: { email: string; password: string; fullName: string; phone: string }) {
  await request("/api/auth/register", { method: "POST", body });
}

export async function loginUser(body: { email: string; password: string }) {
  const data = await request<Tokens>("/api/auth/login", {
    method: "POST",
    body,
    headers: { "X-Device-Id": deviceId() },
  });
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
}

export async function logoutUser() {
  const tokens = getTokens();
  try {
    if (tokens?.refreshToken)
      await request("/api/auth/logout", { method: "POST", auth: true, body: { refreshToken: tokens.refreshToken } });
  } finally {
    setTokens(null);
  }
}

type RawUser = { id: number; email: string; fullName: string; phone: string | null; role: string };

export async function getCurrentUser(): Promise<UserResponse | null> {
  if (!isSignedIn()) return null;
  try {
    const u = await request<RawUser>("/api/users/me", { auth: true });
    return { id: String(u.id), email: u.email, fullName: u.fullName ?? "", phone: u.phone ?? "", role: u.role ?? "", avatarUrl: null };
  } catch (e) {
    if ((e as ApiError).status === 401) return null;
    throw e;
  }
}

export async function updateProfile(_body: { fullName: string; phone: string }): Promise<void> {
  // Backend has no profile update endpoint yet.
  throw new Error("Profile editing is not available yet.");
}

/* -------------------------------- Addresses ------------------------------- */

export type AddressResponse = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
};

type RawAddress = { id: number; recipientName: string; phone: string; addressLine: string; city: string; default: boolean };

export async function getAddresses(): Promise<AddressResponse[]> {
  const list = await request<RawAddress[]>("/api/users/me/addresses", { auth: true });
  return (list ?? []).map((a) => ({
    id: String(a.id),
    label: "",
    recipientName: a.recipientName,
    phone: a.phone,
    addressLine: a.addressLine,
    city: a.city,
    isDefault: Boolean(a.default),
  }));
}

export async function saveAddress(body: {
  id?: string;
  label?: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
}) {
  const payload = {
    recipientName: body.recipientName,
    phone: body.phone,
    addressLine: body.addressLine,
    city: body.city,
    default: body.isDefault,
  };
  if (body.id) await request(`/api/users/me/addresses/${body.id}`, { method: "PUT", auth: true, body: payload });
  else await request("/api/users/me/addresses", { method: "POST", auth: true, body: payload });
}

export async function deleteAddress(id: string) {
  await request(`/api/users/me/addresses/${id}`, { method: "DELETE", auth: true });
}

/* -------------------------------- Products -------------------------------- */

type RawProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  status: string;
  categoryId: number;
  categoryName: string;
  imageUrl: string | null;
  images: string[] | null;
  createdAt: string;
};
type RawVariant = { id: number; sku: string; size: string; color: string; price: number; stockQuantity: number };

/** variantId → product info, so cart lines (which lack product data) can show image/link. */
const variantProduct = new Map<number, { productId: number; imageUrl: string | null }>();

export function productForVariant(variantId: number) {
  return variantProduct.get(variantId);
}

async function fetchVariants(product: RawProduct): Promise<VariantResponse[]> {
  try {
    const list = await request<RawVariant[]>(`/api/products/${product.id}/variants`);
    return (list ?? []).map((v) => {
      variantProduct.set(v.id, { productId: product.id, imageUrl: product.imageUrl });
      return { id: v.id, sku: v.sku, size: v.size, color: v.color, price: Number(v.price), stock: v.stockQuantity ?? 0 };
    });
  } catch {
    return [];
  }
}

async function mapProduct(p: RawProduct): Promise<ProductResponse> {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    basePrice: Number(p.basePrice),
    compareAtPrice: null,
    status: p.status,
    imageKey: "",
    imageUrl: p.imageUrl ?? p.images?.[0] ?? null,
    images: p.images ?? (p.imageUrl ? [p.imageUrl] : []),
    rating: 0,
    reviewsCount: 0,
    badge: null,
    categoryId: p.categoryId,
    categoryName: p.categoryName ?? "",
    createdAt: p.createdAt,
    variants: await fetchVariants(p),
  };
}

export async function getProductsPage(params?: {
  page?: number;
  size?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
}): Promise<PageResponse<ProductResponse>> {
  const page = await request<PageResponse<RawProduct>>(
    `/api/products${qs({
      page: params?.page,
      size: params?.size,
      categoryId: params?.categoryId,
      minPrice: params?.minPrice,
      maxPrice: params?.maxPrice,
      name: params?.search,
      sortBy: params?.sortBy,
      sortDirection: params?.sortDirection,
    })}`,
  );
  return { ...page, content: await Promise.all(page.content.map(mapProduct)) };
}

export async function getProducts(params?: Parameters<typeof getProductsPage>[0]) {
  return (await getProductsPage(params)).content;
}

export async function getProductById(id: number) {
  try {
    return await mapProduct(await request<RawProduct>(`/api/products/${id}`));
  } catch (e) {
    if ((e as ApiError).status === 404) return undefined;
    throw e;
  }
}

/** Backend has no slug lookup; product URLs use the numeric id. */
export async function getProductBySlugRaw(slug: string) {
  const id = Number(slug);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return getProductById(id);
}

export async function getCategories(): Promise<CategoryResponse[]> {
  const list = await request<CategoryResponse[]>("/api/categories");
  return (list ?? []).map((c) => ({ ...c, parentId: c.parentId ?? null }));
}

/* ---------------------------------- Cart ---------------------------------- */

type RawCartItem = {
  id: number;
  variantId: number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};
type RawCart = { id: number; items: RawCartItem[]; totalAmount: number };

function mapCart(cart: RawCart | undefined): CartResponse {
  const items = (cart?.items ?? []).map((i) => {
    const meta = variantProduct.get(i.variantId);
    return {
      id: i.id,
      variantId: i.variantId,
      productId: meta?.productId ?? 0,
      productSlug: meta ? String(meta.productId) : "",
      productName: i.productName,
      imageKey: "",
      imageUrl: meta?.imageUrl ?? null,
      sku: i.sku,
      size: i.size,
      color: i.color,
      stock: 99,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
    };
  });
  return { id: cart?.id ?? 0, items, totalAmount: Number(cart?.totalAmount ?? 0) };
}

export async function getCart(): Promise<CartResponse> {
  if (!isSignedIn()) return { id: 0, items: [], totalAmount: 0 };
  return mapCart(await request<RawCart>("/api/cart", { auth: true }));
}

export async function addCartItem(variantId: number, quantity = 1) {
  if (!isSignedIn()) {
    const err = new Error("Please sign in to add items to your cart.") as ApiError;
    err.status = 401;
    throw err;
  }
  const cart = await request<RawCart | undefined>("/api/cart", { method: "POST", auth: true, body: { variantId, quantity } });
  return cart?.items ? mapCart(cart) : getCart();
}

export async function updateCartItem(itemId: number, quantity: number) {
  const cart = await request<RawCart | undefined>(`/api/cart/${itemId}`, { method: "PUT", auth: true, body: { quantity } });
  return cart?.items ? mapCart(cart) : getCart();
}

export async function deleteCartItem(itemId: number) {
  await request(`/api/cart/${itemId}`, { method: "DELETE", auth: true });
}

/* --------------------------------- Orders --------------------------------- */

type RawOrder = Omit<OrderResponse, "paymentMethod" | "items"> & {
  items: Omit<OrderItemResponse, "imageKeySnapshot">[];
};

function mapOrder(o: RawOrder): OrderResponse {
  return {
    ...o,
    totalAmount: Number(o.totalAmount),
    paymentMethod: "cod",
    items: (o.items ?? []).map((i) => ({ ...i, imageKeySnapshot: "", unitPriceSnapshot: Number(i.unitPriceSnapshot), subtotal: Number(i.subtotal) })),
  };
}

/** Payment is not collected online; the backend creates the order and clears the cart. */
export async function createOrder(body: {
  shippingRecipientName: string;
  shippingPhone: string;
  shippingAddressLine: string;
  shippingCity: string;
}) {
  const order = await request<RawOrder>("/api/orders", {
    method: "POST",
    auth: true,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body,
  });
  return { id: order.id };
}

export async function getOrders(params?: { page?: number; size?: number }) {
  const page = await request<PageResponse<RawOrder>>(`/api/orders${qs({ page: params?.page, size: params?.size })}`, { auth: true });
  return { ...page, content: page.content.map(mapOrder) };
}

export async function getOrderById(id: number) {
  try {
    return mapOrder(await request<RawOrder>(`/api/orders/${id}`, { auth: true }));
  } catch (e) {
    if ((e as ApiError).status === 404) return undefined;
    throw e;
  }
}

export async function cancelOrder(id: number) {
  await request(`/api/orders/${id}/cancel`, { method: "PATCH", auth: true });
}

/* ---------------------------------- Admin --------------------------------- */

export async function getAdminOrders(params?: { page?: number; size?: number }) {
  const page = await request<PageResponse<RawOrder>>(`/api/admin/orders${qs({ page: params?.page, size: params?.size })}`, { auth: true });
  return { ...page, content: page.content.map(mapOrder) };
}

/** Allowed: PENDING→CONFIRMED|CANCELLED, CONFIRMED→SHIPPING|CANCELLED, SHIPPING→DELIVERED. */
export async function updateAdminOrderStatus(id: number, status: string) {
  await request(`/api/admin/orders/${id}/status`, { method: "PUT", auth: true, body: { status: status.toUpperCase() } });
}

export type AdminProductInput = {
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrls: string[];
};

export async function createAdminProduct(body: AdminProductInput) {
  return request<RawProduct>("/api/admin/products", { method: "POST", auth: true, body });
}

export async function updateAdminProduct(id: number, body: AdminProductInput) {
  return request<RawProduct>(`/api/admin/products/${id}`, { method: "PUT", auth: true, body });
}

export async function deleteAdminProduct(id: number) {
  await request(`/api/admin/products/${id}`, { method: "DELETE", auth: true });
}
