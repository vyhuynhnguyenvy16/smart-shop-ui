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
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
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
      <span className="text-foreground">{value.toFixed(1)}</span>
      <span className="text-muted-foreground">({count.toLocaleString()})</span>
    </div>
  );
}
