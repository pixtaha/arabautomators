"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/validation";

type LoginStep = "email" | "code";
const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const message = new URLSearchParams(window.location.search).get("message");
      if (message) setFormMessage(message);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  async function sendCode() {
    setFieldError(null);
    setFormError(null);
    setFormMessage(null);

    if (!isValidEmail(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await response.json()) as { error?: string; retryAfter?: number };

      if (!response.ok) {
        if (response.status === 429) {
          setResendCooldown(
            Number.isFinite(result.retryAfter) && (result.retryAfter ?? 0) > 0
              ? Math.ceil(result.retryAfter!)
              : RESEND_COOLDOWN_SECONDS,
          );
        }
        setFormError(result.error || "Could not send a login code. Please try again.");
        return;
      }

      setStep("code");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setFormMessage("If an account exists for this email, a login code has been sent.");
    } catch {
      setFormError("Could not send a login code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendCode();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setFieldError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: code.trim() }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(result.error || "Could not verify that code. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Could not verify that code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title={step === "email" ? "Log in to your account" : "Enter your login code"}
      subtitle={
        step === "email"
          ? "We'll email you a one-time code. No password needed."
          : `We sent a 6-digit code to ${email.trim()}.`
      }
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-text-accent">
            Sign up
          </Link>
        </span>
      }
    >
      {step === "email" ? (
        <form onSubmit={handleSend} noValidate className="flex flex-col gap-5">
          {formMessage && <FormBanner tone="success">{formMessage}</FormBanner>}
          {formError && <FormBanner tone="error">{formError}</FormBanner>}

          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldError || undefined}
            disabled={loading}
          />

          <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={loading}>
            {loading ? "Sending code…" : "Send login code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} noValidate className="flex flex-col gap-5">
          {formMessage && <FormBanner tone="success">{formMessage}</FormBanner>}
          {formError && <FormBanner tone="error">{formError}</FormBanner>}

          <Input
            label="One-time code"
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]*"
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            error={fieldError || undefined}
            disabled={loading}
            autoFocus
          />

          <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={loading}>
            {loading ? "Verifying…" : "Verify and log in"}
          </Button>

          <div className="flex items-center justify-between gap-4 text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setFieldError(null);
                setFormError(null);
                setFormMessage(null);
                setResendCooldown(0);
              }}
              disabled={loading}
              className="font-semibold text-text-accent"
            >
              ← Change email
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={loading || resendCooldown > 0}
              className="font-semibold text-text-accent"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
