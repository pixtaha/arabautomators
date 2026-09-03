import { isValidEmail } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

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

  if (error?.message.toLowerCase().includes("rate")) {
    return Response.json(
      { error: "Please wait before requesting another code." },
      { status: 429 },
    );
  }

  // Do not reveal whether an address has an account.
  return Response.json({ ok: true });
}
