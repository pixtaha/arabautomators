"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";

interface FieldErrors {
  email?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      errors.email = "Enter a valid email address.";
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

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
        eyebrow="Check your inbox"
        title="Reset link sent"
        subtitle="Follow the link in the email to choose a new password."
        footer={
          <span>
            Remembered it after all?{" "}
            <Link href="/login" className="font-semibold text-text-accent">
              Log in
            </Link>
          </span>
        }
      >
        <FormBanner tone="success">
          If an account exists for <span className="font-semibold">{email.trim()}</span>, we&apos;ve sent a
          password reset link.
        </FormBanner>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <span>
          Remembered it after all?{" "}
          <Link href="/login" className="font-semibold text-text-accent">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={loading}
        />

        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
