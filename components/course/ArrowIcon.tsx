export function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[17px] w-[17px]" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3.5L5 8l5 4.5" : "M6 3.5L11 8l-5 4.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
