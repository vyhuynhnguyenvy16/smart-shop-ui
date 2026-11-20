import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count: number;
  className?: string;
}) {
  // The catalog API doesn't return reviews yet (rating/reviewsCount are always 0).
  // Showing "0.0 (0)" stars reads as a badly-rated product, so render nothing.
  if (!count) return null;
  return (
    <div
      className={cn("flex items-center gap-2 text-sm", className)}
      aria-label={`Đánh giá ${value.toFixed(1)} trên 5, ${count} lượt`}
    >
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i <= Math.round(value) ? "fill-foreground text-foreground" : "text-border",
            )}
          />
        ))}
      </span>
      <span className="tabular text-foreground" aria-hidden="true">
        {value.toFixed(1)}
      </span>
      <span className="tabular text-muted-foreground" aria-hidden="true">
        ({count.toLocaleString("vi-VN")})
      </span>
    </div>
  );
}
