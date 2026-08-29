"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";

interface FieldErrors {
  identifier?: string;
  password?: string;
}

function mapAuthError(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect username/email or password. Please try again.";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const trimmed = identifier.trim();
    if (!trimmed) {
      errors.identifier = "Username or email is required.";
    } else if (trimmed.includes("@") && !isValidEmail(trimmed)) {
      errors.identifier = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
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

    const trimmed = identifier.trim();
    let loginEmail = trimmed;

    if (!trimmed.includes("@")) {
      try {
        const res = await fetch("/api/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmed }),
        });
        const json = await res.json();

        if (!res.ok || !json.email) {
          setFormError(json.error || "No account found with that username.");
          setLoading(false);
          return;
        }

        loginEmail = json.email;
      } catch {
        setFormError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setFormError(mapAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your account"
      subtitle="Pick up where you left off in the program."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-text-accent">
            Sign up
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <Input
          label="Username or Email"
          type="text"
          name="identifier"
          autoComplete="username"
          placeholder="yourname or you@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={loading}
          />
          <Link
            href="/forgot-password"
            className="self-end text-xs font-semibold text-text-accent"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
