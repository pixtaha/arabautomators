"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SessionVideoPart } from "@/lib/session-video-parts";

interface SessionVideoContextValue {
  selectedPart: SessionVideoPart | undefined;
  selectPart: (id: string) => void;
  /** Ordered IDs of the session's own lecture parts (session_video_parts), for part-to-part navigation. */
  lecturePartIds: string[];
}

const SessionVideoContext = createContext<SessionVideoContextValue | null>(null);

export function SessionVideoProvider({
  parts,
  lecturePartIds,
  children,
}: {
  parts: SessionVideoPart[];
  lecturePartIds: string[];
  children: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(parts[0]?.id);
  const selectedPart = parts.find((part) => part.id === selectedId) ?? parts[0];
  const value = useMemo(
    () => ({ selectedPart, selectPart: setSelectedId, lecturePartIds }),
    [selectedPart, lecturePartIds],
  );

  return <SessionVideoContext.Provider value={value}>{children}</SessionVideoContext.Provider>;
}

/** Reads/switches which session video (lecture part or a video resource) the SessionVideoStage plays. */
export function useSessionVideo() {
  const context = useContext(SessionVideoContext);
  if (!context) throw new Error("useSessionVideo must be used within a SessionVideoProvider");
  return context;
}
