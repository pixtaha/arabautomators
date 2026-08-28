interface FormBannerProps {
  tone: "error" | "success";
  children: React.ReactNode;
}

export function FormBanner({ tone, children }: FormBannerProps) {
  const toneClasses =
    tone === "error"
      ? "border-aa-red-500/25 bg-surface-danger-soft text-aa-red-700"
      : "border-surface-brand/25 bg-surface-brand-soft text-text-accent";

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-control border px-3.5 py-3 text-sm font-medium ${toneClasses}`}>
      {children}
    </div>
  );
}
