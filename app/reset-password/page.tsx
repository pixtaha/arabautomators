"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { createClient } from "@/lib/supabase/client";

type LinkStatus = "verifying" | "ready" | "invalid";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

const loginFooter = (
  <span>
    Remembered your password?{" "}
    <Link href="/login" className="font-semibold text-text-accent">
      Log in
    </Link>
  </span>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(() =>
    typeof window !== "undefined" && window.location.hash.includes("error=") ? "invalid" : "verifying",
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Supabase's client picks up the recovery tokens from the URL hash on
  // load and, once processed, fires a PASSWORD_RECOVERY auth event with an
  // active session. An expired/used link instead lands here with an
  // `error=` hash param and no session ever materializes, so we fall back
  // to "invalid" if neither happens within a few seconds.
  useEffect(() => {
    if (window.location.hash.includes("error=")) return;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setLinkStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setLinkStatus("ready");
    });

    const timeout = setTimeout(() => {
      setLinkStatus((current) => (current === "verifying" ? "invalid" : current));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => router.push("/login"), 1800);
    return () => clearTimeout(timeout);
  }, [success, router]);

  function validate(): FieldErrors {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthLayout
        eyebrow="All set"
        title="Password updated"
        subtitle="Redirecting you to log in…"
        footer={loginFooter}
      >
        <FormBanner tone="success">Your password has been updated. Taking you to the login page…</FormBanner>
      </AuthLayout>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <AuthLayout
        eyebrow="Reset password"
        title="Link expired"
        subtitle="This password reset link is invalid or has already been used."
        footer={loginFooter}
      >
        <FormBanner tone="error">Please request a new reset link to continue.</FormBanner>
        <ButtonLink href="/forgot-password" variant="primary" size="lg" className="mt-5 w-full">
          Request a new link
        </ButtonLink>
      </AuthLayout>
    );
  }

  if (linkStatus === "verifying") {
    return (
      <AuthLayout
        eyebrow="Reset password"
        title="Verifying your link"
        subtitle="Hang tight, this only takes a moment."
        footer={loginFooter}
      >
        <p className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Checking…</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Choose a new password"
      subtitle="Make it something you'll remember."
      footer={loginFooter}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <Input
          label="New password"
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
          label="Confirm new password"
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
          {loading ? "Updating…" : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
