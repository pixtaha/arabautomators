import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/ButtonLink";

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-6 w-6 text-text-faint" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export async function BunnyPlayer({ videoId }: { videoId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border-hairline bg-surface-sunken">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <LockIcon />
          <p className="text-sm font-semibold text-text-strong">Sign in to watch this video</p>
          <ButtonLink href="/login" size="sm">
            Go to login
          </ButtonLink>
        </div>
      </div>
    );
  }

  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!libraryId) {
    throw new Error("Bunny Stream is not configured: missing BUNNY_STREAM_LIBRARY_ID.");
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-card border border-border-hairline bg-surface-ink shadow-card">
      <iframe
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`}
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
