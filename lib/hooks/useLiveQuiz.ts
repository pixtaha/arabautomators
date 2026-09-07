"use client";

import { useEffect, useId, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { QuizJson } from "@/lib/quizzes";

export interface LiveQuizRow {
  id: string;
  session_id: string;
  quiz_json: QuizJson;
  is_live: boolean;
}

// One initial read (RLS already limits this to an is_live=true row, if any)
// plus a Realtime subscription for every change after that -- no polling.
// Row level security means an is_live: true -> false update arrives to a
// subscribed student as an update they can no longer see, which the Realtime
// client surfaces as an UPDATE payload with is_live: false (not a DELETE),
// so both cases are handled below.
export function useLiveQuiz() {
  const [quiz, setQuiz] = useState<LiveQuizRow | null>(null);
  const [loading, setLoading] = useState(true);
  // The Supabase browser client is a singleton (createBrowserClient caches
  // one instance per page), so a hardcoded channel name would collide across
  // independent hook consumers mounted at once (e.g. Header + QuizClient both
  // rendering on /dashboard/quiz): RealtimeClient.channel() returns the same
  // channel object for a topic it already has, and calling .on() on one that
  // another consumer already subscribed throws. useId keeps each mount's
  // channel topic unique so consumers never share (or fight over) a channel.
  const id = useId();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase
      .from("quizzes")
      .select("id, session_id, quiz_json, is_live")
      .eq("is_live", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setQuiz((data as LiveQuizRow | null) ?? null);
        setLoading(false);
      });

    const channel = supabase
      .channel(`quizzes-live-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quizzes" },
        (payload: RealtimePostgresChangesPayload<LiveQuizRow>) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            setQuiz((current) => (current && current.id === oldId ? null : current));
            return;
          }

          const row = payload.new as LiveQuizRow;
          setQuiz((current) => {
            if (row.is_live) return row;
            return current && current.id === row.id ? null : current;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { quiz, loading };
}
