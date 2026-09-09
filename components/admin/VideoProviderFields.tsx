"use client";

import { useId } from "react";
import { Input } from "@/components/ui/Input";
import { VIDEO_ID_PATTERNS, type VideoProvider } from "@/lib/video-provider";

export interface VideoLinkDraft {
  videoProvider: VideoProvider;
  vdocipherVideoId: string;
}

export function videoLinkDraft(vdocipherId?: string | null): VideoLinkDraft {
  return { videoProvider: "vdocipher", vdocipherVideoId: vdocipherId ?? "" };
}

export function VideoProviderFields({ value, onChange, disabled = false }: {
  value: VideoLinkDraft; onChange: (value: VideoLinkDraft) => void; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Input
        id={`${id}-video-id`}
        label="VdoCipher Video ID"
        value={value.vdocipherVideoId}
        onChange={(event) => onChange({ ...value, vdocipherVideoId: event.target.value })}
        disabled={disabled} required autoCapitalize="none" autoCorrect="off" spellCheck={false}
        aria-describedby={`${id}-helper`}
        title="32 hexadecimal characters"
        pattern={VIDEO_ID_PATTERNS.vdocipher.source.replace("[0-9a-f]", "[0-9a-fA-F]").replaceAll("[0-9a-f]", "[0-9a-fA-F]")}
        className="min-w-0 w-full"
      />
      <p id={`${id}-helper`} className="text-xs leading-relaxed text-text-muted">
        Upload the video to VdoCipher, wait until processing is complete, then paste the Video ID.
      </p>
    </div>
  );
}
