import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !email.trim()) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .ilike("email", email.trim())
    .limit(1);

  if (error) {
    return Response.json({ error: "Could not verify email right now." }, { status: 500 });
  }

  return Response.json({ exists: (data?.length ?? 0) > 0 });
}
