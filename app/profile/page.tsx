"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createClient } from "@/lib/supabase/client";
import { compressImage, uploadAvatar } from "@/lib/imageUpload";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileAbout } from "@/components/profile/ProfileAbout";
import { ProfileActivity } from "@/components/profile/ProfileActivity";
import { ProfileAccount } from "@/components/profile/ProfileAccount";

type UploadPhase = "idle" | "compressing" | "uploading";

interface Profile {
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

function formatJoined(iso: string | null | undefined) {
  if (!iso) return "Joined recently";
  return `Joined ${new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
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
      .select("username, avatar_url, created_at")
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
    setProfile((prev) => ({
      username: prev?.username ?? null,
      avatar_url: result.url!,
      created_at: prev?.created_at ?? null,
    }));
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
          <div className="relative mx-auto flex max-w-[620px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-40 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayAvatar = avatarPreview ?? profile?.avatar_url ?? null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[620px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Your account
            </span>
            <h2 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Profile
            </h2>
          </div>

          <ProfileHeader
            user={user}
            username={profile?.username ?? (user.user_metadata?.username as string | undefined) ?? null}
            displayAvatar={displayAvatar}
            uploadPhase={uploadPhase}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            onAvatarChange={handleAvatarChange}
            joinedLabel={formatJoined(profile?.created_at ?? user.created_at)}
          />

          <ProfileStats />
          <ProfileAbout user={user} />
          <ProfileActivity />
          <ProfileAccount onSignOut={handleSignOut} signingOut={signingOut} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
