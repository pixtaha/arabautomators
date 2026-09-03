import { getActiveDeviceSession } from "@/lib/auth/device-session";

export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) {
    return Response.json({ active: false }, { status: 401 });
  }

  return Response.json({ active: true });
}
