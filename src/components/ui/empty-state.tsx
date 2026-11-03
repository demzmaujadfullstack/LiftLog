import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center animate-fade-in">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted-2">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-xs text-muted max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
