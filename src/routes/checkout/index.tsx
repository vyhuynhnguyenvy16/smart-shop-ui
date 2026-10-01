import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartTotals, clearCart, detailedCart, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";
import { createOrder, getApiErrorMessage, type ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout — Northline" },
      {
        name: "description",
        content: "Three-step guest checkout: shipping address, delivery method and secure payment.",
      },
      { property: "og:title", content: "Checkout — Northline" },
      {
        property: "og:description",
        content: "Fast, secure three-step guest checkout at Northline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Shipping address", "Delivery", "Payment"] as const;

type Fields = {
  email: string;
  fullName: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
};

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard (3-5 days)", price: 0 },
  { id: "express", label: "Express (1-2 days)", price: 12 },
];

function CheckoutPage() {
  useRequireAuth();


  const items = detailedCart(useCart());
  const { subtotal } = cartTotals(items);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [fields, setFields] = useState<Fields>({
    email: "",
    fullName: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [shipping, setShipping] = useState("standard");
  const [payment, setPayment] = useState("card");
  // API THANH TOÁN: card/PayPal chỉ là lựa chọn giao diện. Khi tích hợp cổng thật,
  // POST /payments/session trả redirect/client token và webhook xác nhận giao dịch;
  // không thu thập hoặc lưu số thẻ tại đây. Chưa có thanh toán online thực tế.
  const [payError, setPayError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const shippingCost = SHIPPING_OPTIONS.find((s) => s.id === shipping)?.price ?? 0;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  const set = (k: keyof Fields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  function validateStep1() {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(fields.email.trim())) next.email = "Enter a valid email";
    if (!fields.fullName.trim()) next.fullName = "Full name is required";
    if (!fields.address.trim()) next.address = "Address is required";
    if (!fields.city.trim()) next.city = "City is required";
    if (!fields.zip.trim()) next.zip = "ZIP / postal code is required";
    if (!fields.phone.trim()) next.phone = "Phone number is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  if (done) {
    return (
      <div className="container-shop section-y pb-24 md:pb-12">
        <div className="mx-auto max-w-lg rounded-xl bg-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <Check className="h-7 w-7 text-success" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Order placed</h1>
          <p className="mt-2 text-base text-muted-foreground">
            We emailed your confirmation. Order status is Pending until we confirm it.
          </p>
          <Button variant="primary" size="md" asChild className="mt-6">
            <Link to="/account">View order history</Link>
          </Button>
        </div>
      </div>
    );
  }

  const field = (key: keyof Fields, label: string, type = "text", className = "") => (
    <div className={className}>
      <label htmlFor={key} className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        id={key}
        type={type}
        value={fields[key]}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={Boolean(errors[key])}
        className={cn(
          "h-12 w-full rounded-lg border bg-background px-4 text-base outline-none focus:border-primary",
          errors[key] ? "border-destructive" : "border-input",
        )}
      />
      {errors[key] && <p className="mt-1 text-sm text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

      <ol className="mt-6 flex flex-wrap items-center gap-4">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                i <= step ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl bg-card p-6">
          {step === 0 && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateStep1()) setStep(1);
              }}
            >
              {field("email", "Email", "email", "sm:col-span-2")}
              {field("fullName", "Full name", "text", "sm:col-span-2")}
              {field("address", "Street address", "text", "sm:col-span-2")}
              {field("city", "City")}
              {field("zip", "ZIP / postal code")}
              {field("phone", "Phone", "tel", "sm:col-span-2")}
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Guest checkout — no account required.
              </p>
              <Button type="submit" variant="primary" size="md" className="sm:col-span-2">
                Continue to delivery
              </Button>
            </form>
          )}

          {step === 1 && (
            <div className="grid gap-3">
              {SHIPPING_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-2 px-4",
                    shipping === o.id ? "border-primary" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={shipping === o.id}
                    onChange={() => setShipping(o.id)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="flex-1 text-base font-semibold text-foreground">{o.label}</span>
                  <span className="text-base font-semibold text-success">
                    {o.price === 0 ? "Free" : formatPrice(o.price)}
                  </span>
                </label>
              ))}
              <div className="mt-4 flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button variant="primary" size="md" className="flex-1" onClick={() => setStep(2)}>
                  Continue to payment
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              {[
                { id: "card", label: "Credit / debit card" },
                { id: "paypal", label: "PayPal" },
                { id: "cod", label: "Cash on delivery" },
              ].map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border-2 px-4",
                    payment === o.id ? "border-primary" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === o.id}
                    onChange={() => setPayment(o.id)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="text-base font-semibold text-foreground">{o.label}</span>
                </label>
              ))}

              {payError && (
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                  {payError}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={async () => {
                    if (placingOrder) return;
                    if (items.length === 0) {
                      setPayError("Your cart is empty. Add a product before paying.");
                      return;
                    }
                    setPayError("");
                    setPlacingOrder(true);
                    try {
                      await createOrder({
                        shippingRecipientName: fields.fullName.trim(),
                        shippingPhone: fields.phone.trim(),
                        shippingAddressLine: fields.address.trim(),
                        shippingCity: fields.city.trim(),
                      });
                      await clearCart();
                      setDone(true);
                    } catch (reason) {
                      const status = (reason as ApiError)?.status;
                      setPayError(
                        status === 409
                          ? "Some items are out of stock or no longer available in that quantity."
                          : status === 400
                            ? "Your cart is empty or the shipping details are invalid."
                            : getApiErrorMessage(reason, "Unable to place your order."),
                      );
                    } finally {
                      setPlacingOrder(false);
                    }
                  }}
                  disabled={placingOrder}
                >
                  {placingOrder ? "Placing order..." : `Place order · ${formatPrice(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
          <ul className="mt-4 grid gap-3">
            {items.map((i) => (
              <li key={i.product.id} className="flex items-center gap-3 text-sm">
                <img
                  src={i.product.image}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <span className="line-clamp-2-title flex-1 text-foreground">{i.product.title}</span>
                <span className="text-muted-foreground">×{i.qty}</span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-muted-foreground">Cart is empty.</li>
            )}
          </ul>
          <dl className="mt-6 grid gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-foreground">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold text-foreground">
                {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax (8%)</dt>
              <dd className="font-semibold text-foreground">{formatPrice(tax)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-lg">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-bold text-primary">{formatPrice(total)}</dd>
            </div>
          </dl>
          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> SSL secure payment
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-success" /> Free shipping over $50
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
