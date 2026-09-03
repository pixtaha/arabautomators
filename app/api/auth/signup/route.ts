import { cookies } from "next/headers";
import {
  SIGNUP_AVATAR_COOKIE,
  createSignupAvatarTicket,
  signupAvatarCookieOptions,
} from "@/lib/auth/signup-avatar-ticket";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, isValidUsername } from "@/lib/validation";

export async function POST(request: Request) {
  let email: unknown;
  let password: unknown;
  let username: unknown;
  try {
    ({ email, password, username } = await request.json());
  } catch {
    return Response.json({ error: "Invalid signup details." }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    !isValidEmail(email.trim()) ||
    email.length > 254 ||
    typeof username !== "string" ||
    !isValidUsername(username.trim()) ||
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 1024
  ) {
    return Response.json({ error: "Invalid signup details." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();
  const { count, error: studentError } = await admin
    .from("students")
    .select("id", { count: "exact", head: true })
    .ilike("email", normalizedEmail);

  if (studentError) {
    return Response.json({ error: "Could not verify email right now." }, { status: 500 });
  }
  if (!count) {
    return Response.json({ error: "This email is not registered as a student." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { username: username.trim() },
      emailRedirectTo: `${new URL(request.url).origin}/login`,
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return Response.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SIGNUP_AVATAR_COOKIE,
    createSignupAvatarTicket(data.user.id),
    signupAvatarCookieOptions(),
  );

  return Response.json({ userId: data.user.id });
}
