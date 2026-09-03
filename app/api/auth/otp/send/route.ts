import { isValidEmail } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_RETRY_AFTER_SECONDS = 60;

function getRetryAfterSeconds(message: string) {
  const match = message.match(/after\s+(\d+)\s+seconds?/i);
  if (!match) return DEFAULT_RETRY_AFTER_SECONDS;

  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds, 60 * 60)
    : DEFAULT_RETRY_AFTER_SECONDS;
}

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (typeof email !== "string" || !isValidEmail(email.trim()) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  });

  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit")) {
    const retryAfter = getRetryAfterSeconds(error.message);
    return Response.json(
      {
        error: `Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} before requesting another code.`,
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
  }

  // Do not reveal whether an address has an account.
  return Response.json({ ok: true });
}
