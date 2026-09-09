"use client";

import { useId } from "react";
import { Input } from "@/components/ui/Input";
import { VIDEO_ID_PATTERNS, type VideoProvider } from "@/lib/video-provider";

export interface VideoLinkDraft {
  videoProvider: VideoProvider;
  vdocipherVideoId: string;
  bunnyVideoId: string;
}

export function videoLinkDraft(provider?: VideoProvider | null, bunnyId?: string | null, vdocipherId?: string | null): VideoLinkDraft {
  return { videoProvider: provider ?? (bunnyId ? "bunny" : "vdocipher"), bunnyVideoId: bunnyId ?? "", vdocipherVideoId: vdocipherId ?? "" };
}

export function VideoProviderFields({ value, onChange, disabled = false }: {
  value: VideoLinkDraft; onChange: (value: VideoLinkDraft) => void; disabled?: boolean;
}) {
  const id = useId();
  const isVdoCipher = value.videoProvider === "vdocipher";
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <fieldset disabled={disabled}>
        <legend className="mb-2 font-mono text-[11px] tracking-widest text-text-muted uppercase">Video provider</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["vdocipher", "bunny"] as const).map((provider) => (
            <label key={provider} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3.5 py-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-surface-brand ${value.videoProvider === provider ? "border-surface-brand bg-surface-brand-soft text-text-accent" : "border-border-hairline bg-surface-card text-text-body"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
              <input type="radio" name={`${id}-provider`} value={provider} checked={value.videoProvider === provider}
                onChange={() => onChange({ ...value, videoProvider: provider })} className="accent-surface-brand" />
              {provider === "vdocipher" ? "VdoCipher" : "Bunny"}
            </label>
          ))}
        </div>
      </fieldset>
      <Input
        id={`${id}-video-id`}
        label={isVdoCipher ? "VdoCipher Video ID" : "Bunny Stream video ID"}
        value={isVdoCipher ? value.vdocipherVideoId : value.bunnyVideoId}
        onChange={(event) => onChange({ ...value, [isVdoCipher ? "vdocipherVideoId" : "bunnyVideoId"]: event.target.value })}
        disabled={disabled} required autoCapitalize="none" autoCorrect="off" spellCheck={false}
        aria-describedby={`${id}-helper`}
        title={isVdoCipher ? "32 hexadecimal characters" : "Bunny Stream video UUID"}
        pattern={VIDEO_ID_PATTERNS[value.videoProvider].source.replace("[0-9a-f]", "[0-9a-fA-F]").replaceAll("[0-9a-f]", "[0-9a-fA-F]")}
        className="min-w-0 w-full"
      />
      <p id={`${id}-helper`} className="text-xs leading-relaxed text-text-muted">
        {isVdoCipher
          ? "Upload the video to VdoCipher, wait until processing is complete, then paste the Video ID."
          : "Upload to Bunny library 739542, wait for processing, then paste the video ID. Playback becomes available after protected delivery is activated."}
      </p>
    </div>
  );
}
