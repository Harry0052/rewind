import type { ReactNode } from "react";

export const inputClass =
  "min-h-12 w-full rounded-2xl border-2 border-line bg-card px-4 text-base text-ink placeholder:text-muted";

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-semibold text-ink">
        {label}
      </label>
      <div data-describedby={describedBy}>{children}</div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm leading-6 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-caution">
          {error}
        </p>
      ) : null}
    </div>
  );
}
