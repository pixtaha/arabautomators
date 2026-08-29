import Image from "next/image";

interface WordmarkProps {
  /** "dark" text for light backgrounds (Header, auth pages); "light" text for dark backgrounds (Footer). */
  variant?: "dark" | "light";
  size?: "sm" | "lg";
}

export function Wordmark({ variant = "dark", size = "sm" }: WordmarkProps) {
  const isLight = variant === "light";
  const isLarge = size === "lg";

  return (
    <div className={isLarge ? "flex items-center gap-3.5" : "flex items-center gap-2.5"}>
      <Image
        src={isLight ? "/assets/logo-mark-white.svg" : "/assets/logo-mark-green.svg"}
        alt=""
        width={isLarge ? 44 : 30}
        height={isLarge ? 44 : 30}
        className={isLarge ? "h-auto w-11" : "h-auto w-[30px]"}
      />
      <span
        className={`flex flex-col items-start font-display leading-[1.02] font-extrabold tracking-[-0.03em] ${
          isLarge ? "text-2xl" : "text-[17px]"
        } ${isLight ? "text-white" : "text-text-strong"}`}
      >
        <span>
          <span className="text-surface-brand">A</span>rab
        </span>
        <span>
          <span className="text-surface-brand">A</span>utomators
        </span>
      </span>
    </div>
  );
}
