import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, StatusBadgeClass, getOrderPage, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";
import {
  getAddresses,
  getApiErrorMessage,
  getCurrentUser,
  updateProfile,
  type AddressResponse,
} from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Tài khoản & đơn hàng — Northline" },
      {
        name: "description",
        content: "Xem lịch sử đơn hàng Northline kèm trạng thái, thông tin cá nhân và địa chỉ.",
      },
      { property: "og:title", content: "Tài khoản — Northline" },
      { property: "og:description", content: "Lịch sử đơn hàng, hồ sơ và sổ địa chỉ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const TABS = ["Đơn hàng", "Hồ sơ", "Địa chỉ"] as const;

function AccountPage() {
  const { user, loading } = useRequireAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Đơn hàng");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    void Promise.all([getCurrentUser(), getOrderPage(), getAddresses()])
      .then(([me, page, list]) => {
        if (me) setProfile({ fullName: me.fullName, email: me.email, phone: me.phone });
        setOrders(page.content);
        setAddresses(list);
      })
      .catch((reason) => setError(getApiErrorMessage(reason, "Không tải được tài khoản.")));
  }, [loading, user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({ fullName: profile.fullName, phone: profile.phone });
      setMessage("Đã lưu thông tin.");
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Không lưu được thông tin."));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return <div className="container-shop section-y text-muted-foreground">Đang tải…</div>;
  }

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Xin chào, {profile.fullName || "bạn"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{profile.email}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          {message}
        </p>
      )}

      <div className="mt-8 flex gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-11 px-4 text-sm font-semibold",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Đơn hàng" && (
        <div className="mt-6 grid gap-4">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
          )}
          {orders.map((o) => (
            <article key={o.id} className="rounded-xl bg-card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-base font-semibold text-foreground">#{o.id}</span>
                <span className="text-sm text-muted-foreground">{o.date}</span>
                <span className={cn(StatusBadgeClass(o.status), "ml-auto")}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {o.items.map((i) => (
                  <li key={`${o.id}-${i.title}-${i.variant}`}>
                    {i.title} · {i.variant} × {i.qty} — {formatPrice(i.price * i.qty)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">{formatPrice(o.total)}</span>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/orders/$id" params={{ id: String(o.id) }}>
                    Xem chi tiết
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "Hồ sơ" && (
        <form onSubmit={saveProfile} className="mt-6 max-w-lg rounded-xl bg-card p-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Thông tin cá nhân</h2>
          </div>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-semibold">
                Họ tên
              </label>
              <input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold">
                Email
              </label>
              <input
                id="email"
                value={profile.email}
                readOnly
                className="h-12 w-full rounded-lg border border-input bg-muted px-4 text-base text-muted-foreground"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold">
                Số điện thoại
              </label>
              <input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
              />
            </div>
            <Button type="submit" variant="primary" size="md" disabled={saving}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      )}

      {tab === "Địa chỉ" && (
        <div className="mt-6 max-w-lg rounded-xl bg-card p-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Địa chỉ giao hàng</h2>
          </div>
          {addresses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Chưa có địa chỉ nào. Địa chỉ sẽ được lưu khi bạn đặt hàng.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {addresses.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-4 text-base">
                  <p className="font-semibold text-foreground">
                    {a.recipientName} · {a.phone}
                    {a.isDefault && (
                      <span className="ml-2 text-sm font-semibold text-primary">Mặc định</span>
                    )}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {a.addressLine}, {a.city}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
