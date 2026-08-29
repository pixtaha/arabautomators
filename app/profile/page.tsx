"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { UploadProgress } from "@/components/ui/UploadProgress";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createClient } from "@/lib/supabase/client";
import { compressImage, uploadAvatar } from "@/lib/imageUpload";

type UploadPhase = "idle" | "compressing" | "uploading";

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file || !user) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("That image is too large. Please choose a smaller file.");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));

    setUploadPhase("compressing");
    const compressed = await compressImage(file);

    setUploadPhase("uploading");
    setUploadProgress(0);
    const result = await uploadAvatar(user.id, compressed, {
      timeoutMs: 40000,
      onProgress: setUploadProgress,
    });
    setUploadPhase("idle");

    if (result.error || !result.url) {
      setUploadError("Couldn't update your photo. Please try again.");
      return;
    }
    setProfile((prev) => ({ username: prev?.username ?? null, avatar_url: result.url! }));
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
          <div className="relative mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-40 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayAvatar = avatarPreview ?? profile?.avatar_url ?? null;
  const username = profile?.username ?? (user.user_metadata?.username as string | undefined) ?? null;
  const initial = (username ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[560px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Your account
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Profile
            </h1>
          </div>

          <div className="flex flex-col gap-6 rounded-card border border-border-hairline bg-surface-card p-7 shadow-card">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-full border border-border-hairline-strong bg-surface-brand font-display text-2xl font-bold text-white">
                {displayAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayAvatar} alt="" className="h-full w-full object-cover object-center" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-display text-lg font-bold text-text-strong">
                  {username ? `@${username}` : "No username set"}
                </span>
                <span className="truncate text-sm text-text-muted">{user.email}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border-hairline pt-6">
              <label
                htmlFor="avatar-edit"
                className="font-mono text-[11px] tracking-widest text-text-muted uppercase"
              >
                Edit profile picture
              </label>
              <input
                id="avatar-edit"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadPhase !== "idle"}
                className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {uploadError && <p className="text-xs font-medium text-aa-red-700">{uploadError}</p>}
              {(uploadPhase === "compressing" || uploadPhase === "uploading") && (
                <UploadProgress phase={uploadPhase} progress={uploadProgress} />
              )}
            </div>
          </div>

          <div className="rounded-card border border-dashed border-border-hairline-strong bg-surface-sunken px-5 py-4 text-sm text-text-muted">
            This is a demo profile page. More settings — bio, password change, notification
            preferences — are coming soon.
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleSignOut}
            disabled={signingOut}
            className="self-start"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
