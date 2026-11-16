import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

export function StockBadge({ stock, className }: { stock: Product["stock"]; className?: string }) {
  const map = {
    in: { label: "In stock", cls: "text-success" },
    low: { label: "Low stock", cls: "text-warning" },
    out: { label: "Out of stock", cls: "text-destructive" },
  } as const;
  const { label, cls } = map[stock];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
