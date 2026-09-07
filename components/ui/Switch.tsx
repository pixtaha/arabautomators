"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-6 w-[42px] flex-none items-center rounded-full border p-0.5 transition-colors duration-150 ease-out ${
        checked ? "border-surface-brand bg-surface-brand" : "border-border-hairline-strong bg-surface-sunken"
      }`}
    >
      <span
        className={`h-[18px] w-[18px] flex-none rounded-full bg-white shadow-card transition-transform duration-150 ease-out ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
