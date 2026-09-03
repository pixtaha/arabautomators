export async function POST() {
  return Response.json(
    { error: "Username login is no longer available. Use your email address." },
    { status: 410 },
  );
}
