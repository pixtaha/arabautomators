import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdjacentSessions, getCourseSessionData } from "@/lib/data/courseSessions";
import { Header } from "@/components/layout/Header";
import { CourseSessionShell } from "@/components/course/CourseSessionShell";
import { SessionHeader } from "@/components/course/SessionHeader";
import { SessionVideoStage } from "@/components/course/SessionVideoStage";
import { SessionVideoProvider } from "@/components/course/SessionVideoContext";
import { getSessionVideoParts } from "@/lib/session-video-parts";
import { SessionNotesCard } from "@/components/course/SessionNotesCard";
import { SessionPartsSection } from "@/components/course/SessionPartsSection";
import { SessionResourcesPanel } from "@/components/course/SessionResourcesPanel";
import { SessionWarningCallout } from "@/components/course/SessionWarningCallout";

export async function generateMetadata(props: PageProps<"/course/[sessionId]">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Session — Arab Automators" };

  const { sessionId } = await props.params;
  const data = await getCourseSessionData(sessionId);
  return { title: data ? `${data.session.title} — Arab Automators` : "Session — Arab Automators" };
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
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

export default async function CourseSessionPage(props: PageProps<"/course/[sessionId]">) {
  const { sessionId } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCourseSessionData(sessionId);
  if (!data) notFound();

  const { session, module, moduleSessions, resources } = data;
  const videoParts = getSessionVideoParts(session, resources);
  const { prev, next } = getAdjacentSessions(moduleSessions, session.id);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />
      <div className="relative min-h-screen overflow-hidden bg-surface-page">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
        <SessionVideoProvider parts={videoParts}>
          <CourseSessionShell
            resources={
              <>
                <SessionResourcesPanel resources={resources} />
                {session.warning_title && (
                  <SessionWarningCallout title={session.warning_title} body={session.warning_body} />
                )}
              </>
            }
          >
            <SessionHeader session={session} />
            <SessionVideoStage sessionId={session.id} />

            {(prev || next) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/course/${prev.id}`}
                    className="flex items-center gap-3.5 rounded-card border border-border-hairline bg-surface-card p-4.5 shadow-card transition-[transform,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-sunken text-text-strong">
                      <ArrowIcon direction="left" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] tracking-widest text-text-muted uppercase">
                        Previous session
                      </span>
                      <span className="mt-1 block truncate font-display text-[15px] font-bold tracking-tight text-text-strong">
                        {prev.title}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {next ? (
                  <Link
                    href={`/course/${next.id}`}
                    className="flex items-center justify-end gap-3.5 rounded-card border border-border-hairline bg-surface-card p-4.5 text-right shadow-card transition-[transform,box-shadow] duration-150 ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] tracking-widest text-text-muted uppercase">
                        Next session
                      </span>
                      <span className="mt-1 block truncate font-display text-[15px] font-bold tracking-tight text-text-strong">
                        {next.title}
                      </span>
                    </span>
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-surface-ink text-white">
                      <ArrowIcon direction="right" />
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}

            <SessionNotesCard session={session} />

            <SessionPartsSection
              moduleTitle={module?.title ?? "Module"}
              sessions={moduleSessions}
              currentSessionId={session.id}
            />
          </CourseSessionShell>
        </SessionVideoProvider>
      </div>
    </div>
  );
}
