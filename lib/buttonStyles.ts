export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-control font-semibold font-body transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.985]";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-[52px] px-[26px] text-base gap-2.5",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "btn-sheen animate-sheen text-white border border-transparent bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] shadow-card hover:shadow-md",
  secondary:
    "btn-sheen animate-sheen-slow text-text-strong border border-border-hairline-strong bg-[linear-gradient(100deg,#fff_0%,#fff_30%,#EFF4F2_50%,#fff_70%,#fff_100%)] hover:border-surface-brand hover:shadow-md",
  ghost: "text-text-body bg-transparent hover:bg-surface-sunken",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return [base, sizeClasses[size], variantClasses[variant], className].filter(Boolean).join(" ");
}
