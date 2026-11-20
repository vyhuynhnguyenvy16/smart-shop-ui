import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "./products";

/**
 * Shipping estimate shown in cart/checkout, from the shop's stated policy
 * (free from FREE_SHIPPING_THRESHOLD, otherwise SHIPPING_FEE). The backend
 * computes the authoritative order total when the order is created.
 */
export function estimateShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
}
