import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATALOG_SEED, seedImagePath, type SeedProduct } from "@/lib/catalog-seed";
import { formatPrice, type Product } from "@/lib/products";
import { getApiErrorMessage, updateAdminProduct, type CategoryResponse } from "@/lib/api-client";
import { SITE_URL } from "@/lib/seo";

type Plan = { product: Product; seed: SeedProduct };

/**
 * Admin tool: puts the Vietnamese catalogue copy and the new product photos
 * onto the products that already exist in the backend, through the existing
 * admin API (PUT /api/admin/products/:id). Only same-category matches are
 * proposed, so a shoe never turns into a scarf and existing variants (sizes,
 * colours, stock) and prices stay valid. Nothing is sent until the admin
 * reviews the table and confirms; a JSON backup of the current data can be
 * downloaded first.
 */
export function CatalogImport({
  rows,
  categories,
  onClose,
  onDone,
}: {
  rows: Product[];
  categories: CategoryResponse[];
  onClose: () => void;
  onDone: () => void;
}) {
  const plan = useMemo<Plan[]>(() => {
    const used = new Set<string>();
    return [...rows]
      .sort((a, b) => a.id - b.id)
      .flatMap((product) => {
        const seed = CATALOG_SEED.find((s) => s.category === product.category && !used.has(s.slug));
        if (!seed) return [];
        used.add(seed.slug);
        return [{ product, seed }];
      });
  }, [rows]);
  const unused = CATALOG_SEED.filter((s) => !plan.some((p) => p.seed.slug === s.slug));
  const unmatched = rows.filter((r) => !plan.some((p) => p.product.id === r.id));

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(plan.map((p) => p.product.id)),
  );
  const [updatePrice, setUpdatePrice] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const onOtherHost = typeof window !== "undefined" && window.location.origin !== SITE_URL;

  const downloadBackup = () => {
    const data = rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      name: r.name,
      description: r.description,
      basePrice: r.price,
      imageUrls: r.images,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `northline-san-pham-sao-luu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const apply = async () => {
    const todo = plan.filter((p) => selected.has(p.product.id));
    if (!todo.length) return;
    setRunning(true);
    setDone(0);
    setFailures([]);
    const errs: string[] = [];
    for (const { product, seed } of todo) {
      try {
        await updateAdminProduct(product.id, {
          categoryId:
            product.categoryId || categories.find((c) => c.name === seed.category)?.id || 0,
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          basePrice: updatePrice ? seed.price : product.price,
          imageUrls: [`${SITE_URL}${seedImagePath(seed.slug)}`],
        });
      } catch (e) {
        errs.push(`#${product.id} ${product.name}: ${getApiErrorMessage(e)}`);
      }
      setDone((n) => n + 1);
    }
    setFailures(errs);
    setRunning(false);
    if (errs.length)
      toast.error(
        `Đã cập nhật ${todo.length - errs.length}/${todo.length} sản phẩm, ${errs.length} lỗi.`,
      );
    else toast.success(`Đã cập nhật ${todo.length} sản phẩm.`);
    onDone();
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div className="relative my-8 w-full max-w-5xl bg-background p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={running}
          aria-label="Đóng"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 id="import-title" className="text-h2 text-foreground">
          Áp dụng ảnh & mô tả tiếng Việt
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Gán tên, mô tả tiếng Việt và ảnh mới cho sản phẩm đang có, theo đúng danh mục. Biến thể,
          tồn kho và danh mục giữ nguyên. Chất liệu và giá trong bộ mẫu là gợi ý — hãy kiểm tra với
          hàng thật trước khi áp dụng.
        </p>
        {onOtherHost && (
          <p className="mt-3 border-l-2 border-warning bg-warning/10 px-4 py-2 text-sm text-foreground">
            Ảnh sẽ trỏ tới {SITE_URL}/products/… — chỉ hiển thị sau khi bản có thư mục ảnh này được
            deploy lên production.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={downloadBackup}>
            Tải bản sao lưu (JSON)
          </Button>
          <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={updatePrice}
              onChange={(e) => setUpdatePrice(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Cập nhật giá theo bộ mẫu
          </label>
          <span className="tabular ml-auto text-sm text-muted-foreground">
            {selected.size}/{plan.length} sản phẩm được chọn
          </span>
        </div>

        <div className="mt-4 max-h-[55vh] overflow-auto hairline">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2">
                  <span className="sr-only">Chọn</span>
                </th>
                <th className="px-3 py-2 font-medium">Hiện tại</th>
                <th className="px-3 py-2 font-medium">Sau khi áp dụng</th>
                <th className="px-3 py-2 font-medium">Giá</th>
              </tr>
            </thead>
            <tbody>
              {plan.map(({ product, seed }) => (
                <tr key={product.id} className="hairline-t align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggle(product.id)}
                      aria-label={`Áp dụng cho ${product.name}`}
                      className="h-5 w-5 accent-[var(--primary)]"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-foreground">
                      #{product.id} {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-3">
                      <img
                        src={seedImagePath(seed.slug)}
                        alt=""
                        width={48}
                        height={64}
                        className="aspect-[3/4] w-12 shrink-0 bg-muted object-cover"
                      />
                      <div>
                        <p className="text-foreground">{seed.name}</p>
                        <p className="line-clamp-2-title text-xs text-muted-foreground">
                          {seed.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="tabular whitespace-nowrap px-3 py-3 text-foreground">
                    {updatePrice && seed.price !== product.price ? (
                      <>
                        <span className="text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                        <br />
                        {formatPrice(seed.price)}
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </td>
                </tr>
              ))}
              {plan.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Không có sản phẩm nào trùng danh mục với bộ mẫu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(unmatched.length > 0 || unused.length > 0) && (
          <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
            {unmatched.length > 0 && (
              <p>
                {unmatched.length} sản phẩm giữ nguyên vì danh mục của chúng đã hết mẫu:{" "}
                {unmatched.map((u) => `#${u.id}`).join(", ")}.
              </p>
            )}
            {unused.length > 0 && (
              <p>
                {unused.length} mẫu chưa dùng (
                {[...new Set(unused.map((u) => u.category))].join(", ")}). Tạo thêm sản phẩm (kèm
                biến thể) trong các danh mục này rồi mở lại công cụ để gán tiếp.
              </p>
            )}
          </div>
        )}

        {failures.length > 0 && (
          <ul
            role="alert"
            className="mt-4 list-disc border-l-2 border-destructive bg-destructive/10 py-2 pl-8 pr-4 text-sm text-destructive"
          >
            {failures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={running}>
            Đóng
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => void apply()}
            disabled={running || selected.size === 0}
          >
            {running
              ? `Đang cập nhật ${done}/${selected.size}…`
              : `Áp dụng cho ${selected.size} sản phẩm`}
          </Button>
        </div>
      </div>
    </div>
  );
}
