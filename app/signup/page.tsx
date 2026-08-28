"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail, isValidUsername } from "@/lib/validation";
import { buttonClasses } from "@/lib/buttonStyles";

type Step = "identity" | "not-student" | "password";
type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken" | "error";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function mapAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("duplicate key") && lower.includes("username")) {
    return "That username was just taken. Go back and choose another.";
  }
  return message;
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>("identity");

  const [username, setUsername] = useState("");
  const [checkResult, setCheckResult] = useState<{
    username: string;
    status: "available" | "taken" | "error";
  } | null>(null);
  const latestUsernameRef = useRef("");

  const [email, setEmail] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarError(null);

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const trimmedUsername = username.trim();
  const usernameFormatValid = trimmedUsername.length > 0 && isValidUsername(trimmedUsername);

  useEffect(() => {
    latestUsernameRef.current = trimmedUsername;
    if (!usernameFormatValid) return;

    const handle = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", trimmedUsername)
        .limit(1);

      if (latestUsernameRef.current !== trimmedUsername) return;

      if (error) {
        setCheckResult({ username: trimmedUsername, status: "error" });
        return;
      }
      setCheckResult({
        username: trimmedUsername,
        status: data && data.length > 0 ? "taken" : "available",
      });
    }, 500);

    return () => clearTimeout(handle);
  }, [trimmedUsername, usernameFormatValid]);

  const usernameStatus: UsernameStatus = !trimmedUsername
    ? "idle"
    : !usernameFormatValid
      ? "invalid"
      : checkResult && checkResult.username === trimmedUsername
        ? checkResult.status
        : "checking";

  const canContinue = usernameStatus === "available" && isValidEmail(email.trim()) && !checkingEmail;

  async function handleContinue() {
    if (!canContinue) return;
    setFormError(null);
    setCheckingEmail(true);

    try {
      const res = await fetch("/api/check-student-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Something went wrong. Please try again.");
      }

      setStep(json.exists ? "password" : "not-student");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  }

  function validatePasswords(): FieldErrors {
    const errors: FieldErrors = {};
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validatePasswords();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (error) {
      setFormError(mapAuthError(error.message));
      setLoading(false);
      return;
    }

    // Supabase returns a user with an empty identities array when the email
    // is already registered but confirmation is required, instead of an error.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError("An account with this email already exists. Try logging in instead.");
      setLoading(false);
      return;
    }

    if (avatarFile && data.user) {
      const uploadForm = new FormData();
      uploadForm.append("userId", data.user.id);
      uploadForm.append("file", avatarFile);

      const uploadRes = await fetch("/api/upload-avatar", { method: "POST", body: uploadForm });
      if (!uploadRes.ok) {
        setAvatarError("Account created, but the photo didn't upload. You can add one later.");
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthLayout
        eyebrow="Almost there"
        title="Check your inbox"
        subtitle="We sent a confirmation link to finish setting up your account."
        footer={
          <span>
            Already confirmed?{" "}
            <Link href="/login" className="font-semibold text-text-accent">
              Log in
            </Link>
          </span>
        }
      >
        <FormBanner tone="success">
          We sent a confirmation email to <span className="font-semibold">{email.trim()}</span>. Click the
          link inside to activate your account.
        </FormBanner>
        {avatarError && (
          <div className="mt-3">
            <FormBanner tone="error">{avatarError}</FormBanner>
          </div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Join the program"
      title={step === "password" ? "Set a password" : "Create your account"}
      subtitle={
        step === "password"
          ? "Almost done — lock in your password."
          : "Six weeks, live, in Arabic. Let's get you set up."
      }
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-text-accent">
            Log in
          </Link>
        </span>
      }
    >
      {formError && (
        <div className="mb-5">
          <FormBanner tone="error">{formError}</FormBanner>
        </div>
      )}

      {step === "identity" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={
                usernameStatus === "invalid"
                  ? "3–20 characters: letters, numbers, underscores only."
                  : usernameStatus === "taken"
                    ? "That username is already taken."
                    : usernameStatus === "error"
                      ? "Couldn't check that username. Try again."
                      : undefined
              }
              disabled={loading}
            />
            {usernameStatus === "checking" && (
              <p className="font-mono text-[11px] text-text-muted">Checking…</p>
            )}
            {usernameStatus === "available" && (
              <p className="font-mono text-[11px] text-text-accent">Available</p>
            )}
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="mt-1 w-full"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {checkingEmail ? "Checking…" : "Continue"}
          </Button>
        </div>
      )}

      {step === "not-student" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-start gap-4 rounded-control border border-surface-brand/25 bg-surface-brand-soft px-4 py-4">
            <p className="text-sm leading-relaxed font-medium text-text-accent">
              This email isn&apos;t registered as a student yet. Want to join the course?
            </p>
            <a
              href="https://wa.me/201554445243"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "md")}
            >
              Message us on WhatsApp
            </a>
          </div>
          <button
            type="button"
            onClick={() => setStep("identity")}
            className="self-start text-sm font-semibold text-text-accent"
          >
            ← Try a different email
          </button>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={handleSignUp} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="avatar" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Profile picture (optional)
            </label>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full border border-border-hairline-strong bg-surface-sunken">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-lg font-bold text-text-faint">
                    {username.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading}
                className="flex-1 cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>
            {avatarError && <p className="text-xs font-medium text-aa-red-700">{avatarError}</p>}
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={loading}
          />

          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            disabled={loading}
          />

          <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={loading}>
            {loading ? "Creating account…" : "Sign up"}
          </Button>

          <button
            type="button"
            onClick={() => setStep("identity")}
            disabled={loading}
            className="self-start text-sm font-semibold text-text-accent"
          >
            ← Back
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
