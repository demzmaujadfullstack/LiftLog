import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "accent" | "danger" | "warning" | "success" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface-3 text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  outline: "bg-transparent text-muted border-line-strong",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
