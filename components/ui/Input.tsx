import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...rest },
  ref,
) {
  const inputId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`h-11 rounded-control border bg-surface-card px-3.5 text-sm text-text-strong placeholder:text-text-faint transition-colors focus:outline-none focus:ring-2 focus:ring-surface-brand/25 ${
          error
            ? "border-aa-red-500 focus:border-aa-red-500"
            : "border-border-hairline-strong focus:border-surface-brand"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-aa-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
