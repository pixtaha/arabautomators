import type { User } from "@supabase/supabase-js";
import { ChangeEvent } from "react";
import { UploadProgress } from "@/components/ui/UploadProgress";
import { CameraIcon, CalendarIcon, GraduationCapIcon } from "@/components/profile/icons";

type UploadPhase = "idle" | "compressing" | "uploading";

interface ProfileHeaderProps {
  user: User;
  username: string | null;
  displayAvatar: string | null;
  uploadPhase: UploadPhase;
  uploadProgress: number;
  uploadError: string | null;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  joinedLabel: string;
}

export function ProfileHeader({
  user,
  username,
  displayAvatar,
  uploadPhase,
  uploadProgress,
  uploadError,
  onAvatarChange,
  joinedLabel,
}: ProfileHeaderProps) {
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? username ?? "there";
  const initial = (username ?? user.email ?? "?").charAt(0).toUpperCase();
  const uploading = uploadPhase !== "idle";

  return (
    <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
      <div className="bg-dots mask-fade-b h-32 w-full bg-surface-sunken" />

      <div className="px-6 pb-6">
        <div className="-mt-11 flex items-end justify-between gap-3">
          <label
            htmlFor="avatar-edit"
            className={`group relative h-[88px] w-[88px] flex-none rounded-full border-4 border-surface-card bg-surface-card ${
              uploading ? "cursor-wait" : "cursor-pointer"
            }`}
          >
            <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display text-2xl font-black text-aa-green-800">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatar} alt="" className="h-full w-full object-cover object-center" />
              ) : (
                initial
              )}
            </span>
            <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
              <CameraIcon className="h-[18px] w-[18px]" />
            </span>
          </label>

          <label
            htmlFor="avatar-edit"
            className={`inline-flex h-8 flex-none items-center justify-center whitespace-nowrap rounded-full border border-border-hairline-strong bg-surface-card px-4 text-sm font-semibold text-text-strong transition-colors duration-150 hover:border-aa-neutral-500 hover:bg-surface-hover ${
              uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
            }`}
          >
            Edit profile
          </label>
        </div>

        <input
          id="avatar-edit"
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          disabled={uploading}
          className="sr-only"
        />

        <div className="mt-3 flex flex-col gap-0.5">
          <h1 className="font-display text-[28px] leading-[1.1] font-black tracking-tight text-text-strong sm:text-[30px]">
            {displayName}
          </h1>
          <span className="font-mono text-sm text-text-muted">
            {username ? `@${username}` : "No username set"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {joinedLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCapIcon className="h-3.5 w-3.5" />
            Round #1 cohort
          </span>
        </div>

        {uploadError && <p className="mt-3 text-xs font-medium text-aa-red-700">{uploadError}</p>}
        {uploading && (
          <div className="mt-3">
            <UploadProgress phase={uploadPhase === "compressing" ? "compressing" : "uploading"} progress={uploadProgress} />
          </div>
        )}
      </div>
    </div>
  );
}
