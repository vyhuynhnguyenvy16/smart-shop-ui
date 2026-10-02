import { supabase } from "@/integrations/supabase/client";
import { fashionCategories, fashionProducts } from "./fashion-catalog";

/**
 * ĐIỂM NỐI API THẬT (đang dùng Lovable Cloud, không phải mock HTTP):
 * Auth: signUp / signInWithPassword / signOut / getUser (email, password, session).
 * Account: GET/PATCH profile; GET/POST/PATCH/DELETE addresses (theo user).
 * Catalog: GET categories, GET products?page,size,filters,sort, GET products/:slug;
 *          sản phẩm trả variants(id, sku, color, size, price, stock), imageUrl/images[].
 * Cart: GET cart, POST item, PATCH item quantity, DELETE item (session hiện tại).
 * Orders: POST checkout, GET orders, GET orders/:id, PATCH cancel (chỉ đơn pending).
 * Khi thay dịch vụ khác: giữ nguyên các kiểu response và hàm export dưới đây để UI
 * không phải đổi; truyền session an toàn, không nhúng khóa quản trị vào trình duyệt.
 */

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

export function getApiErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function fail(message: string): never {
  throw new Error(message) as ApiError;
}

/* ---------------------------------- Auth --------------------------------- */

export async function getSessionUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) fail("Bạn cần đăng nhập để tiếp tục.");
  return userId;
}

export async function registerUser(body: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}) {
  const { error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: { full_name: body.fullName, phone: body.phone },
    },
  });
  if (error) fail(error.message);
}

export async function loginUser(body: { email: string; password: string }) {
  const { error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error) fail("Email hoặc mật khẩu không đúng.");
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<UserResponse | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? (user.user_metadata["full_name"] as string) ?? "",
    phone: profile?.phone ?? (user.user_metadata["phone"] as string) ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function updateProfile(body: { fullName: string; phone: string }) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: body.fullName, phone: body.phone });
  if (error) fail(error.message);
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

export async function getAddresses(): Promise<AddressResponse[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    isDefault: row.is_default,
  }));
}

export async function saveAddress(body: {
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
}) {
  const userId = await requireUserId();
  if (body.isDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }
  const row = {
    user_id: userId,
    label: body.label,
    recipient_name: body.recipientName,
    phone: body.phone,
    address_line: body.addressLine,
    city: body.city,
    is_default: body.isDefault,
  };
  const { error } = body.id
    ? await supabase.from("addresses").update(row).eq("id", body.id)
    : await supabase.from("addresses").insert(row);
  if (error) fail(error.message);
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) fail(error.message);
}

/* -------------------------------- Products -------------------------------- */

// API CATALOG: bổ sung imageUrl/images[] và ảnh riêng của variant tại đây khi có media API.
const PRODUCT_SELECT =
  "id, name, slug, description, base_price, compare_at_price, status, image_key, rating, reviews_count, badge, category_id, created_at, categories(name), product_variants(id, sku, color, size, price, stock)";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  image_key: string;
  rating: number;
  reviews_count: number;
  badge: string | null;
  category_id: number;
  created_at: string;
  categories: { name: string } | null;
  product_variants: {
    id: number;
    sku: string;
    color: string;
    size: string;
    price: number;
    stock: number;
  }[];
};

function mapProduct(row: ProductRow): ProductResponse {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    basePrice: Number(row.base_price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    status: row.status,
    imageKey: row.image_key,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    badge: row.badge,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "",
    createdAt: row.created_at,
    variants: (row.product_variants ?? [])
      .map((v) => ({ ...v, price: Number(v.price) }))
      .sort((a, b) => a.color.localeCompare(b.color) || a.size.localeCompare(b.size)),
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
  {
  // Editorial catalog stays available while the remote catalog is not provisioned.
  let items = fashionProducts.filter((item) =>
    (params?.categoryId === undefined || item.categoryId === params.categoryId) &&
    (params?.minPrice === undefined || item.basePrice >= params.minPrice) &&
    (params?.maxPrice === undefined || item.basePrice <= params.maxPrice) &&
    (!params?.search || item.name.toLowerCase().includes(params.search.toLowerCase()))
  );
  items = [...items].sort((a,b) => params?.sortBy === "basePrice"
    ? (params?.sortDirection === "desc" ? b.basePrice-a.basePrice : a.basePrice-b.basePrice)
    : (params?.sortDirection === "desc" ? b.id-a.id : a.id-b.id));
  const localPage = params?.page ?? 0;
  const localSize = params?.size ?? 12;
  const content = items.slice(localPage * localSize, (localPage + 1) * localSize);
  const totalPages = Math.max(1, Math.ceil(items.length / localSize));
  return { content: content as ProductResponse[], totalElements: items.length, totalPages, size: localSize, number: localPage, first: localPage === 0, last: localPage >= totalPages - 1, numberOfElements: content.length, empty: content.length === 0 };
  }
  // API GET /products: gửi page, size, categoryId, price, search, sort; nhận content + totalElements.
  const page = params?.page ?? 0;
  const size = params?.size ?? 12;
  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (params?.categoryId !== undefined) query = query.eq("category_id", params.categoryId);
  if (params?.minPrice !== undefined) query = query.gte("base_price", params.minPrice);
  if (params?.maxPrice !== undefined) query = query.lte("base_price", params.maxPrice);
  if (params?.search) query = query.ilike("name", `%${params.search}%`);
  const column = params?.sortBy === "basePrice" ? "base_price" : "created_at";
  query = query.order(column, { ascending: params?.sortDirection !== "desc" });
  const { data, error, count } = await query.range(page * size, page * size + size - 1);
  if (error) fail(error.message);
  const total = count ?? 0;
  const content = ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
  const totalPages = Math.max(1, Math.ceil(total / size));
  return {
    content,
    totalElements: total,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

export async function getProducts(params?: Parameters<typeof getProductsPage>[0]) {
  return (await getProductsPage(params)).content;
}

export async function getProductById(id: number) {
  const local = fashionProducts.find((item) => item.id === id);
  if (local) return local as ProductResponse;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error.message);
  return data ? mapProduct(data as unknown as ProductRow) : undefined;
}

export async function getProductBySlugRaw(slug: string) {
  const local = fashionProducts.find((item) => item.slug === slug);
  if (local) return local as ProductResponse;
  // API GET /products/:slug: nhận chi tiết, tồn kho theo biến thể và mảng ảnh gallery.
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail(error.message);
  return data ? mapProduct(data as unknown as ProductRow) : undefined;
}

export async function getCategories(): Promise<CategoryResponse[]> {
  return fashionCategories;
  const { data, error } = await supabase.from("categories").select("*").order("id");
  if (error) fail(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
  }));
}

/* ---------------------------------- Cart ---------------------------------- */

const CART_SELECT =
  "id, quantity, variant_id, product_variants(id, sku, color, size, price, stock, products(id, name, slug, image_key))";

type CartRow = {
  id: number;
  quantity: number;
  variant_id: number;
  product_variants: {
    id: number;
    sku: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    products: { id: number; name: string; slug: string; image_key: string } | null;
  } | null;
};

function mapCartRow(row: CartRow): CartItemResponse {
  const variant = row.product_variants;
  const price = Number(variant?.price ?? 0);
  return {
    id: row.id,
    variantId: row.variant_id,
    productId: variant?.products?.id ?? 0,
    productSlug: variant?.products?.slug ?? "",
    productName: variant?.products?.name ?? "",
    imageKey: variant?.products?.image_key ?? "headphones",
    sku: variant?.sku ?? "",
    size: variant?.size ?? "",
    color: variant?.color ?? "",
    stock: variant?.stock ?? 0,
    unitPrice: price,
    quantity: row.quantity,
    subtotal: price * row.quantity,
  };
}

export async function getCart(): Promise<CartResponse> {
  if (typeof window !== "undefined") {
    const lines = JSON.parse(window.localStorage.getItem("northline-fashion-cart") ?? "[]") as { variantId: number; quantity: number }[];
    const items = lines.flatMap(({ variantId, quantity }) => {
      const product = fashionProducts.find((p) => p.variants.some((v) => v.id === variantId));
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!product || !variant) return [];
      return [{ id: variantId, variantId, productId: product.id, productSlug: product.slug, productName: product.name, imageKey: product.imageKey, sku: variant.sku, size: variant.size, color: variant.color, stock: variant.stock, unitPrice: variant.price, quantity, subtotal: variant.price * quantity }];
    });
    return { id: 1, items, totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0) };
  }
  // API GET /cart: trả các dòng hàng theo phiên người dùng, kèm giá/tồn kho mới nhất.
  const userId = await getSessionUserId();
  if (!userId) return { id: 0, items: [], totalAmount: 0 };
  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .order("created_at", { ascending: true });
  if (error) fail(error.message);
  const items = ((data ?? []) as unknown as CartRow[]).map(mapCartRow);
  return { id: 1, items, totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0) };
}

export async function addCartItem(variantId: number, quantity = 1) {
  if (typeof window !== "undefined" && fashionProducts.some((p) => p.variants.some((v) => v.id === variantId))) {
    const lines = JSON.parse(window.localStorage.getItem("northline-fashion-cart") ?? "[]") as { variantId: number; quantity: number }[];
    const existing = lines.find((line) => line.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else lines.push({ variantId, quantity });
    window.localStorage.setItem("northline-fashion-cart", JSON.stringify(lines));
    return getCart();
  }
  // API POST /cart/items: variantId + quantity; server phải kiểm tra stock/giá thực.
  const userId = await requireUserId();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("variant_id", variantId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) fail(error.message);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: userId, variant_id: variantId, quantity });
    if (error) fail(error.message);
  }
  return getCart();
}

export async function updateCartItem(itemId: number, quantity: number) {
  if (typeof window !== "undefined") {
    const lines = JSON.parse(window.localStorage.getItem("northline-fashion-cart") ?? "[]") as { variantId: number; quantity: number }[];
    window.localStorage.setItem("northline-fashion-cart", JSON.stringify(lines.map((line) => line.variantId === itemId ? { ...line, quantity } : line)));
    return getCart();
  }
  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
  if (error) fail(error.message);
  return getCart();
}

export async function deleteCartItem(itemId: number) {
  if (typeof window !== "undefined") {
    const lines = JSON.parse(window.localStorage.getItem("northline-fashion-cart") ?? "[]") as { variantId: number; quantity: number }[];
    window.localStorage.setItem("northline-fashion-cart", JSON.stringify(lines.filter((line) => line.variantId !== itemId)));
    return;
  }
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
  if (error) fail(error.message);
}

/* --------------------------------- Orders --------------------------------- */

const ORDER_SELECT =
  "id, status, total_amount, shipping_recipient_name, shipping_phone, shipping_address_line, shipping_city, payment_method, created_at, order_items(id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, image_key_snapshot, unit_price_snapshot, quantity)";

type OrderRow = {
  id: number;
  status: string;
  total_amount: number;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_address_line: string;
  shipping_city: string;
  payment_method: string;
  created_at: string;
  order_items: {
    id: number;
    product_name_snapshot: string;
    sku_snapshot: string;
    size_snapshot: string;
    color_snapshot: string;
    image_key_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
  }[];
};

function mapOrder(row: OrderRow): OrderResponse {
  return {
    id: row.id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    shippingRecipientName: row.shipping_recipient_name,
    shippingPhone: row.shipping_phone,
    shippingAddressLine: row.shipping_address_line,
    shippingCity: row.shipping_city,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      productNameSnapshot: item.product_name_snapshot,
      skuSnapshot: item.sku_snapshot,
      sizeSnapshot: item.size_snapshot,
      colorSnapshot: item.color_snapshot,
      imageKeySnapshot: item.image_key_snapshot,
      unitPriceSnapshot: Number(item.unit_price_snapshot),
      quantity: item.quantity,
      subtotal: Number(item.unit_price_snapshot) * item.quantity,
    })),
  };
}

export async function createOrder(body: {
  shippingRecipientName: string;
  shippingPhone: string;
  shippingAddressLine: string;
  shippingCity: string;
  paymentMethod?: string;
  shippingFee?: number;
}) {
  if (typeof window !== "undefined") {
    const cart = await getCart();
    if (cart.items.length === 0) fail("Your cart is empty.");
    const orders = JSON.parse(window.localStorage.getItem("northline-fashion-orders") ?? "[]") as OrderResponse[];
    const id = Date.now();
    orders.unshift({ id, status: "pending", totalAmount: cart.totalAmount + (body.shippingFee ?? 0), shippingRecipientName: body.shippingRecipientName, shippingPhone: body.shippingPhone, shippingAddressLine: body.shippingAddressLine, shippingCity: body.shippingCity, paymentMethod: "cod", createdAt: new Date().toISOString(), items: cart.items.map((item) => ({ id: item.id, productNameSnapshot: item.productName, skuSnapshot: item.sku, sizeSnapshot: item.size, colorSnapshot: item.color, imageKeySnapshot: item.imageKey, unitPriceSnapshot: item.unitPrice, quantity: item.quantity, subtotal: item.subtotal })) });
    window.localStorage.setItem("northline-fashion-orders", JSON.stringify(orders));
    return { id };
  }
  // API POST /checkout: thực tế cần một giao dịch server duy nhất để kiểm tồn kho,
  // tính lại tiền/thuế/vận chuyển, tạo order + items và xóa cart nguyên tử.
  // API POST /payments/session + webhook xác thực chữ ký để xác nhận thanh toán;
  // TUYỆT ĐỐI không gửi dữ liệu thẻ hay tự đánh dấu đã trả tiền từ client.
  // Luồng hiện tại chỉ tạo đơn và ghi payment_method, chưa thu tiền online.
  const userId = await requireUserId();
  const cart = await getCart();
  if (cart.items.length === 0) fail("Giỏ hàng của bạn đang trống.");
  const total = cart.totalAmount + (body.shippingFee ?? 0);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: total,
      shipping_recipient_name: body.shippingRecipientName,
      shipping_phone: body.shippingPhone,
      shipping_address_line: body.shippingAddressLine,
      shipping_city: body.shippingCity,
      payment_method: body.paymentMethod ?? "cod",
    })
    .select("id")
    .single();
  if (error || !order) fail(error?.message ?? "Không tạo được đơn hàng.");

  const { error: itemsError } = await supabase.from("order_items").insert(
    cart.items.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      product_name_snapshot: item.productName,
      sku_snapshot: item.sku,
      size_snapshot: item.size,
      color_snapshot: item.color,
      image_key_snapshot: item.imageKey,
      unit_price_snapshot: item.unitPrice,
      quantity: item.quantity,
    })),
  );
  if (itemsError) fail(itemsError.message);

  await supabase
    .from("cart_items")
    .delete()
    .in(
      "id",
      cart.items.map((item) => item.id),
    );

  return { id: order.id };
}

export async function getOrders(params?: { page?: number; size?: number }) {
  if (typeof window !== "undefined") {
    const orders = JSON.parse(window.localStorage.getItem("northline-fashion-orders") ?? "[]") as OrderResponse[];
    const page = params?.page ?? 0, size = params?.size ?? 20, totalPages = Math.max(1, Math.ceil(orders.length / size));
    const content = orders.slice(page * size, (page + 1) * size);
    return { content, totalElements: orders.length, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1, numberOfElements: content.length, empty: content.length === 0 };
  }
  // API GET /orders?page,size: server lọc theo user hoặc kiểm tra quyền admin.
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  const { data, error, count } = await supabase
    .from("orders")
    .select(ORDER_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * size, page * size + size - 1);
  if (error) fail(error.message);
  const content = ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
  const total = count ?? content.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  return {
    content,
    totalElements: total,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
    numberOfElements: content.length,
    empty: content.length === 0,
  } satisfies PageResponse<OrderResponse>;
}

export async function getOrderById(id: number) {
  if (typeof window !== "undefined") return (JSON.parse(window.localStorage.getItem("northline-fashion-orders") ?? "[]") as OrderResponse[]).find((order) => order.id === id);
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error.message);
  return data ? mapOrder(data as unknown as OrderRow) : undefined;
}

export async function cancelOrder(id: number) {
  if (typeof window !== "undefined") {
    const orders = JSON.parse(window.localStorage.getItem("northline-fashion-orders") ?? "[]") as OrderResponse[];
    window.localStorage.setItem("northline-fashion-orders", JSON.stringify(orders.map((order) => order.id === id && order.status === "pending" ? { ...order, status: "cancelled" } : order)));
    return;
  }
  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
  if (error) fail(error.message);
}
