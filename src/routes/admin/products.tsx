import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { fallbackImageFor, formatPrice, getProductCategories, getProducts, type Product } from "@/lib/products";
import {
  createAdminProduct,
  deleteAdminProduct,
  getApiErrorMessage,
  updateAdminProduct,
  type CategoryResponse,
} from "@/lib/api-client";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Quản lý sản phẩm — Northline Admin" },
      { name: "description", content: "Thêm, sửa, xóa sản phẩm Northline và xem tồn kho từng biến thể." },
      { property: "og:title", content: "Quản lý sản phẩm — Northline Admin" },
      { property: "og:description", content: "Quản lý sản phẩm và tồn kho Northline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminProducts,
});

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const inputCls =
  "h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary";

function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [items, cats] = await Promise.all([getProducts({ page: 0, size: 100 }), getProductCategories()]);
      setRows(items);
      setCategories(cats);
    } catch (e) {
      setLoadError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openForm(p: Product | null) {
    setEditing(p);
    setName(p?.title ?? "");
    setCategoryId(p?.categoryId ?? categories[0]?.id ?? 0);
    setPrice(p ? String(p.price) : "");
    setDescription(p?.description ?? "");
    setImageUrls(p ? p.images.join("\n") : "");
    setError("");
    setOpen(true);
  }

  async function save() {
    const priceNum = Number(price);
    if (!name.trim()) return setError("Vui lòng nhập tên sản phẩm.");
    if (!categoryId) return setError("Vui lòng chọn danh mục.");
    if (!price.trim() || Number.isNaN(priceNum) || priceNum <= 0) return setError("Giá không hợp lệ.");
    const urls = imageUrls.split(/\s+/).filter((u) => /^https?:\/\//.test(u));
    const body = {
      categoryId,
      name: name.trim(),
      slug: editing?.name === name.trim() && editing ? slugify(editing.name) : slugify(name),
      description: description.trim(),
      basePrice: priceNum,
      imageUrls: urls,
    };
    setSaving(true);
    try {
      if (editing) await updateAdminProduct(editing.id, body);
      else await createAdminProduct(body);
      toast.success(editing ? "Đã lưu thay đổi" : "Đã tạo sản phẩm");
      setOpen(false);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Xóa "${p.title}"?`)) return;
    try {
      await deleteAdminProduct(p.id);
      setRows((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Đã xóa sản phẩm");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  const totalStock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <AdminNav />
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sản phẩm</h1>
        <Button variant="primary" size="md" className="ml-auto" onClick={() => openForm(null)}>
          <Plus /> Thêm sản phẩm
        </Button>
      </div>

      {loadError && <p className="mt-4 text-sm font-semibold text-destructive">{loadError}</p>}

      <div className="mt-6 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Sản phẩm</th>
              <th className="px-4 py-3 font-semibold">Danh mục</th>
              <th className="px-4 py-3 font-semibold">Giá</th>
              <th className="px-4 py-3 font-semibold">Biến thể</th>
              <th className="px-4 py-3 font-semibold">Tồn kho</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && !loadError && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Chưa có sản phẩm.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.image}
                      data-fallback={fallbackImageFor(r.category, r.id)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                    <span className="font-medium text-foreground">{r.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatPrice(r.price)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.variants.length ? r.variants.map((v) => `${v.color}/${v.size} (${v.stock})`).join(", ") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      totalStock(r) === 0
                        ? "font-semibold text-destructive"
                        : totalStock(r) < 10
                          ? "font-semibold text-warning"
                          : "font-semibold text-success"
                    }
                  >
                    {totalStock(r)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openForm(r)}>
                      <Pencil /> Sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => void remove(r)}>
                      <Trash2 /> Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            className="my-8 w-full max-w-xl rounded-xl bg-background p-6 shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>
            )}

            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-foreground">
                Tên sản phẩm
                <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${inputCls}`} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-foreground">
                  Danh mục
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className={`mt-1 ${inputCls}`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-foreground">
                  Giá (₫)
                  <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={`mt-1 ${inputCls}`} />
                </label>
              </div>
              <label className="text-sm font-semibold text-foreground">
                Mô tả
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm font-semibold text-foreground">
                Link ảnh (mỗi dòng một link https://)
                <textarea
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary"
                />
              </label>
              {editing && editing.variants.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Biến thể (màu/size/tồn kho) hiện chỉ xem được — máy chủ chưa có chức năng sửa biến thể.
                </p>
              )}
              <div className="mt-2 flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Hủy</Button>
                <Button variant="primary" size="md" className="flex-1" disabled={saving} onClick={() => void save()}>
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
