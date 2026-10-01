import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { CATEGORIES, formatPrice, getProducts } from "@/lib/products";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Product management — Northline Admin" },
      {
        name: "description",
        content:
          "Create, edit and delete Northline products, including variants and per-variant stock levels.",
      },
      { property: "og:title", content: "Product management — Northline Admin" },
      {
        property: "og:description",
        content: "CRUD products with variants and inventory tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminProducts,
});

type Variant = { name: string; stock: number };
type Row = {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  variants: Variant[];
};

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [variants, setVariants] = useState<Variant[]>([{ name: "", stock: 0 }]);
  const [error, setError] = useState("");
  const defaultImage = rows[0]?.image ?? "";

  useEffect(() => {
    // API QUẢN TRỊ GET /admin/products: trả danh sách + variants(stock,sku,giá) thực;
    // endpoint phải xác thực quyền admin ở server, không dựa vào giao diện này.
    void getProducts({ page: 0, size: 100 }).then((items) => {
      setRows(
        items.map((p) => ({
          id: String(p.id),
          title: p.title,
          category: p.category,
          price: p.price,
          image: p.image,
          variants: [{ name: "Variant data unavailable", stock: p.stock === "out" ? 0 : 0 }],
        })),
      );
    });
  }, []);

  function openNew() {
    setEditing(null);
    setTitle("");
    setCategory(CATEGORIES[0]);
    setPrice("");
    setVariants([{ name: "", stock: 0 }]);
    setError("");
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setTitle(row.title);
    setCategory(row.category);
    setPrice(String(row.price));
    setVariants(row.variants.length ? row.variants : [{ name: "", stock: 0 }]);
    setError("");
    setOpen(true);
  }

  function save() {
    // API QUẢN TRỊ POST /admin/products hoặc PATCH /admin/products/:id:
    // lưu tên, danh mục, giá, ảnh upload/URL và variants(id,sku,color,size,stock).
    // Hiện chỉ cập nhật state trên trang; tải lại sẽ mất thay đổi.
    if (!title.trim()) return setError("Product name is required.");
    if (!price.trim() || Number.isNaN(Number(price))) return setError("Enter a valid price.");
    const cleaned = variants.filter((v) => v.name.trim());
    if (cleaned.length === 0) return setError("Add at least one variant.");

    const next: Row = {
      id: editing?.id ?? `p-${Date.now()}`,
      title: title.trim(),
      category,
      price: Number(price),
      image: editing?.image ?? defaultImage,
      variants: cleaned,
    };
    setRows((prev) =>
      editing ? prev.map((r) => (r.id === editing.id ? next : r)) : [next, ...prev],
    );
    setOpen(false);
  }

  const totalStock = (r: Row) => r.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <AdminNav />
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
        <Button variant="primary" size="md" className="ml-auto" onClick={openNew}>
          <Plus /> New product
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Variants</th>
              <th className="px-4 py-3 font-semibold">Inventory</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.image}
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
                  {r.variants.map((v) => v.name).join(", ")}
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
                    {totalStock(r)} in stock
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>
                      <Pencil /> Edit
                    </Button>
                    {/* API QUẢN TRỊ DELETE /admin/products/:id: xác thực admin,
                        kiểm tra đơn liên quan trước khi xóa; hiện chỉ xóa khỏi state. */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 /> Delete
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
            aria-label={editing ? "Edit product" : "New product"}
            className="my-8 w-full max-w-xl rounded-xl bg-background p-6 shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editing ? "Edit product" : "New product"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <div className="mt-4 grid gap-4">
              <div>
                <label
                  htmlFor="p-title"
                  className="mb-1 block text-sm font-semibold text-foreground"
                >
                  Product name
                </label>
                <input
                  id="p-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="p-cat"
                    className="mb-1 block text-sm font-semibold text-foreground"
                  >
                    Category
                  </label>
                  <select
                    id="p-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="p-price"
                    className="mb-1 block text-sm font-semibold text-foreground"
                  >
                    Price (USD)
                  </label>
                  <input
                    id="p-price"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-12 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-foreground">
                  Variants & inventory
                </legend>
                <div className="grid gap-3">
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-3">
                      <input
                        value={v.name}
                        placeholder="e.g. Black / M"
                        aria-label={`Variant ${i + 1} name`}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)),
                          )
                        }
                        className="h-12 flex-1 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        aria-label={`Variant ${i + 1} stock`}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x, xi) =>
                              xi === i ? { ...x, stock: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        className="h-12 w-28 rounded-lg border border-input bg-background px-4 text-base outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        aria-label={`Remove variant ${i + 1}`}
                        onClick={() => setVariants((prev) => prev.filter((_, xi) => xi !== i))}
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setVariants((prev) => [...prev, { name: "", stock: 0 }])}
                >
                  <Plus /> Add variant
                </Button>
              </fieldset>

              <div className="mt-2 flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" className="flex-1" onClick={save}>
                  {editing ? "Save changes" : "Create product"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
