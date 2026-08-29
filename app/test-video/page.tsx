import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BunnyPlayer } from "@/components/course/BunnyPlayer";

// Temporary page to verify the Bunny Stream integration end-to-end. Delete once
// real course session pages exist. Swap this for a video ID from the Bunny dashboard.
const TEST_VIDEO_ID = "REPLACE_WITH_BUNNY_VIDEO_ID";

export default function TestVideoPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Bunny stream · integration test
            </span>
            <h1 className="font-display text-[28px] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[32px]">
              Test video
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Temporary page for verifying the Bunny Stream player renders and plays correctly.
            </p>
          </div>

          <BunnyPlayer videoId={TEST_VIDEO_ID} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
