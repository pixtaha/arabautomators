import { redirect } from "next/navigation";
import { AdminQuizAttemptsClient } from "@/components/admin/AdminQuizAttemptsClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminQuizAttemptsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const { quizId } = await params;
  return <AdminQuizAttemptsClient quizId={quizId} />;
}
