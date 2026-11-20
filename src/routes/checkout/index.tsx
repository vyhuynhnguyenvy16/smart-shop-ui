import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartTotals, clearCart, detailedCart, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { estimateShipping } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { colorLabel } from "@/lib/labels";
import {
  createOrder,
  getAddresses,
  getApiErrorMessage,
  type AddressResponse,
  type ApiError,
} from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth";
import { pageHead } from "@/lib/seo";
import { displayImage } from "@/lib/images";

export const Route = createFileRoute("/checkout/")({
  head: () =>
    pageHead({
      title: "Đặt hàng — Northline",
      description: "Nhập địa chỉ giao hàng và xác nhận đơn, thanh toán khi nhận hàng.",
      path: "/checkout",
      noindex: true,
    }),
  component: CheckoutPage,
});

/** Only what the order API accepts (POST /api/orders) — no unused fields to fill in. */
type Fields = { fullName: string; phone: string; address: string; city: string };
type FieldKey = keyof Fields;

const LABELS: Record<FieldKey, string> = {
  fullName: "Họ và tên người nhận",
  phone: "Số điện thoại",
  address: "Địa chỉ (số nhà, đường, phường/xã, quận/huyện)",
  city: "Tỉnh / Thành phố",
};

const AUTOCOMPLETE: Record<FieldKey, string> = {
  fullName: "name",
  phone: "tel",
  address: "street-address",
  city: "address-level1",
};

function validate(fields: Fields) {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (fields.fullName.trim().length < 2) errors.fullName = "Nhập họ và tên người nhận.";
  const phone = fields.phone.replace(/[\s.-]/g, "");
  if (!phone) errors.phone = "Nhập số điện thoại để shipper liên hệ.";
  else if (!/^(0|\+84)\d{9,10}$/.test(phone))
    errors.phone = "Số điện thoại chưa đúng — ví dụ 0901234567 hoặc +84901234567.";
  if (fields.address.trim().length < 5)
    errors.address = "Nhập địa chỉ đầy đủ để giao hàng chính xác.";
  if (!fields.city.trim()) errors.city = "Nhập tỉnh hoặc thành phố.";
  return errors;
}

function CheckoutPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const items = detailedCart(useCart());
  const { subtotal, count } = cartTotals(items);
  const shipping = estimateShipping(subtotal);

  const [step, setStep] = useState<"address" | "review">("address");
  const [fields, setFields] = useState<Fields>({ fullName: "", phone: "", address: "", city: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saved, setSaved] = useState<AddressResponse[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>("new");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const [failedAttempt, setFailedAttempt] = useState(0);

  // After a failed submit, move focus to the error summary (rendered on this pass).
  useEffect(() => {
    if (failedAttempt) summaryRef.current?.focus();
  }, [failedAttempt]);

  // Prefill from the account's saved addresses so returning shoppers don't
  // retype what we already have (WCAG 2.2 "redundant entry").
  useEffect(() => {
    let active = true;
    void getAddresses()
      .then((list) => {
        if (!active || !list.length) return;
        setSaved(list);
        const preferred = list.find((a) => a.isDefault) ?? list[0]!;
        setSelectedSaved(preferred.id);
        setFields({
          fullName: preferred.recipientName,
          phone: preferred.phone,
          address: preferred.addressLine,
          city: preferred.city,
        });
      })
      .catch(() => {
        /* No saved addresses or not reachable: the form just starts empty. */
      });
    return () => {
      active = false;
    };
  }, []);

  const set = (k: FieldKey, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickSaved = (id: string) => {
    setSelectedSaved(id);
    setErrors({});
    const a = saved.find((x) => x.id === id);
    setFields(
      a
        ? { fullName: a.recipientName, phone: a.phone, address: a.addressLine, city: a.city }
        : { fullName: "", phone: "", address: "", city: "" },
    );
  };

  const submitAddress = () => {
    const next = validate(fields);
    setErrors(next);
    const firstInvalid = (Object.keys(LABELS) as FieldKey[]).find((k) => next[k]);
    if (firstInvalid) {
      // UI UX Pro Max "focus-management": focus the error summary; each item links to its field.
      setFailedAttempt((n) => n + 1);
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    if (placing) return;
    if (items.length === 0) {
      setOrderError("Giỏ hàng đang trống — thêm sản phẩm trước khi đặt hàng.");
      return;
    }
    setOrderError("");
    setPlacing(true);
    try {
      const order = await createOrder({
        shippingRecipientName: fields.fullName.trim(),
        shippingPhone: fields.phone.replace(/[\s.-]/g, ""),
        shippingAddressLine: fields.address.trim(),
        shippingCity: fields.city.trim(),
      });
      await clearCart().catch(() => undefined);
      void navigate({ to: "/checkout/success", search: { orderId: order.id } });
    } catch (reason) {
      const status = (reason as ApiError)?.status;
      setOrderError(
        status === 409
          ? "Một số sản phẩm vừa hết hàng hoặc không đủ số lượng. Quay lại giỏ hàng để điều chỉnh nhé."
          : status === 400
            ? "Thông tin giao hàng chưa hợp lệ hoặc giỏ hàng trống. Kiểm tra lại giúp mình nhé."
            : getApiErrorMessage(reason, "Chưa đặt được hàng. Bạn thử lại sau ít phút."),
      );
    } finally {
      setPlacing(false);
    }
  };

  const errorKeys = (Object.keys(LABELS) as FieldKey[]).filter((k) => errors[k]);

  const field = (key: FieldKey, type = "text", className = "") => (
    <div className={className}>
      <label htmlFor={key} className="mb-1.5 block text-body-sm font-medium text-foreground">
        {LABELS[key]}{" "}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      </label>
      <input
        id={key}
        name={key}
        type={type}
        inputMode={key === "phone" ? "tel" : undefined}
        autoComplete={AUTOCOMPLETE[key]}
        required
        value={fields[key]}
        onChange={(e) => set(key, e.target.value)}
        onBlur={() => {
          if (fields[key]) setErrors((e) => ({ ...e, [key]: validate(fields)[key] }));
        }}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        className={cn(
          "h-12 w-full rounded-md border bg-card px-3.5 text-base outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]",
          errors[key] ? "border-destructive" : "border-input",
        )}
      />
      {errors[key] && (
        <p id={`${key}-error`} className="mt-1.5 text-body-sm text-destructive">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="container-shop pb-32 pt-6 md:pb-12">
      <ol
        className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground"
        aria-label="Các bước đặt hàng"
      >
        <li>
          <Link to="/cart" className="hover:text-foreground hover:underline">
            1. Giỏ hàng
          </Link>
        </li>
        <li aria-hidden="true">—</li>
        <li
          aria-current={step === "address" ? "step" : undefined}
          className={cn(step === "address" && "font-semibold text-foreground")}
        >
          2. Giao hàng
        </li>
        <li aria-hidden="true">—</li>
        <li
          aria-current={step === "review" ? "step" : undefined}
          className={cn(step === "review" && "font-semibold text-foreground")}
        >
          3. Xác nhận
        </li>
      </ol>
      <h1 className="mt-4 text-h1 text-foreground">
        {step === "address" ? "Thông tin giao hàng" : "Xác nhận đơn hàng"}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {step === "address" ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submitAddress();
              }}
            >
              {errorKeys.length > 0 && (
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  className="mb-6 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-body-sm text-destructive outline-none"
                >
                  <p className="font-semibold">Cần sửa {errorKeys.length} thông tin:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {errorKeys.map((k) => (
                      <li key={k}>
                        <a href={`#${k}`} className="underline underline-offset-2">
                          {errors[k]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {saved.length > 0 && (
                <fieldset className="mb-8">
                  <legend className="mb-3 text-body-sm font-semibold text-foreground">
                    Địa chỉ đã lưu
                  </legend>
                  <div className="grid gap-2">
                    {[...saved, null].map((a) => {
                      const id = a?.id ?? "new";
                      return (
                        <label
                          key={id}
                          className={cn(
                            "flex items-start gap-3 rounded-md bg-card p-4 text-body-sm transition-[box-shadow,background-color] duration-150",
                            selectedSaved === id
                              ? "bg-accent shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
                              : "shadow-[inset_0_0_0_1px_var(--color-border)] hover:shadow-[inset_0_0_0_1px_var(--color-foreground)]",
                          )}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedSaved === id}
                            onChange={() => pickSaved(id)}
                            className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
                          />
                          {a ? (
                            <span>
                              <span className="font-medium text-foreground">
                                {a.recipientName} · {a.phone}
                              </span>
                              <span className="mt-0.5 block text-muted-foreground">
                                {a.addressLine}, {a.city}
                              </span>
                            </span>
                          ) : (
                            <span className="font-medium text-foreground">
                              Giao tới địa chỉ khác
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {field("fullName", "text", "sm:col-span-2")}
                {field("phone", "tel", "sm:col-span-2")}
                {field("address", "text", "sm:col-span-2")}
                {field("city", "text", "sm:col-span-2")}
              </div>
              <p className="mt-4 text-body-sm text-muted-foreground">
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>{" "}
                Thông tin bắt buộc
              </p>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mt-6 w-full sm:w-auto sm:px-10"
              >
                Tiếp tục
              </Button>
            </form>
          ) : (
            <div className="grid gap-8">
              <section className="hairline p-5" aria-labelledby="ship-to">
                <div className="flex items-start justify-between gap-4">
                  <h2 id="ship-to" className="text-body-sm font-semibold text-foreground">
                    Giao tới
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep("address")}
                    className="min-h-11 text-body-sm text-primary underline-offset-4 hover:underline"
                  >
                    Sửa
                  </button>
                </div>
                <p className="text-base text-foreground">
                  {fields.fullName} · {fields.phone}
                </p>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {fields.address}, {fields.city}
                </p>
              </section>

              <section className="hairline p-5" aria-labelledby="pay-heading">
                <h2 id="pay-heading" className="text-body-sm font-semibold text-foreground">
                  Thanh toán
                </h2>
                <p className="mt-2 flex items-center gap-3 text-base text-foreground">
                  <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  Thanh toán khi nhận hàng (COD)
                </p>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  Bạn trả tiền mặt cho nhân viên giao hàng khi nhận được đơn.
                </p>
              </section>

              {orderError && (
                <p
                  role="alert"
                  className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-body-sm text-destructive"
                >
                  {orderError}{" "}
                  <Link to="/cart" className="underline underline-offset-2">
                    Về giỏ hàng
                  </Link>
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  size="lg"

                  onClick={() => setStep("address")}
                >
                  Quay lại
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => void placeOrder()}
                  disabled={placing || items.length === 0}
                >
                  {placing ? "Đang đặt hàng…" : `Đặt hàng · ${formatPrice(subtotal + shipping)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside
          className="h-fit hairline bg-card p-6 lg:sticky lg:top-32"
          aria-labelledby="order-summary"
        >
          <h2 id="order-summary" className="text-h3 text-foreground">
            Đơn hàng <span className="tabular text-muted-foreground">({count})</span>
          </h2>
          <ul className="mt-4 grid gap-4">
            {items.map((i) => (
              <li key={i.itemId} className="flex items-center gap-3 text-body-sm">
                <span className="relative shrink-0">
                  <img
                    src={displayImage(i.product.image, i.product.category, i.product.id)}
                    alt=""
                    width={48}
                    height={64}
                    className="aspect-[3/4] w-12 rounded-sm bg-muted object-cover"
                  />
                  <span className="tabular absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[0.6875rem] text-background">
                    {i.qty}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2-title text-foreground">{i.product.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[i.item.color && colorLabel(i.item.color), i.item.size]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="tabular text-foreground">{formatPrice(i.item.subtotal)}</span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-body-sm text-muted-foreground">
                Giỏ hàng trống.{" "}
                <Link
                  to="/products"
                  search={{}}
                  className="text-primary underline underline-offset-2"
                >
                  Chọn sản phẩm
                </Link>
              </li>
            )}
          </ul>
          <dl className="tabular mt-6 grid gap-2 hairline-t pt-4 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tạm tính</dt>
              <dd className="text-foreground">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phí vận chuyển</dt>
              <dd className="text-foreground">
                {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="mt-2 flex justify-between hairline-t pt-3 text-base">
              <dt className="font-semibold text-foreground">Tổng cộng</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatPrice(subtotal + shipping)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Tổng tiền cuối cùng được hệ thống xác nhận khi tạo đơn.
          </p>
        </aside>
      </div>
    </div>
  );
}
