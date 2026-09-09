import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const user = await requireAdmin();
  return NextResponse.json({ isAdmin: Boolean(user) });
}
