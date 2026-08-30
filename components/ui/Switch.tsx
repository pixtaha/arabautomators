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
      className={`relative h-6 w-[42px] flex-none cursor-pointer rounded-full border transition-colors duration-150 ease-out ${
        checked ? "border-surface-brand bg-surface-brand" : "border-border-hairline-strong bg-surface-sunken"
      }`}
    >
      <span
        className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-card transition-transform duration-150 ease-out ${
          checked ? "translate-x-[21px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
