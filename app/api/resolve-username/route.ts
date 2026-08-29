import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { username } = await request.json();

  if (typeof username !== "string" || !username.trim()) {
    return Response.json({ error: "Username is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return Response.json({ error: "No account found with that username." }, { status: 404 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);

  if (userError || !userData.user?.email) {
    return Response.json({ error: "No account found with that username." }, { status: 404 });
  }

  return Response.json({ email: userData.user.email });
}
