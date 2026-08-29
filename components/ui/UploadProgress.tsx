interface UploadProgressProps {
  phase: "compressing" | "uploading";
  progress: number;
}

export function UploadProgress({ phase, progress }: UploadProgressProps) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-border-hairline-strong bg-surface-sunken px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-surface-brand border-t-transparent" />
        <span className="text-xs font-medium text-text-body">
          {phase === "compressing" ? "Preparing your photo…" : "Uploading photo… this may take a moment"}
        </span>
      </div>
      {phase === "uploading" && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-hairline">
          <div
            className="h-full rounded-full bg-surface-brand transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
