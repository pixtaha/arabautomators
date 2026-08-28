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
  name?: string;
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
  return message;
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = "Name is required.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
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
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Join the program"
      title="Create your account"
      subtitle="Six weeks, live, in Arabic. Let's get you set up."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-text-accent">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <Input
          label="Full name"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={loading}
        />

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
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
