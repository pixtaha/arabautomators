import { redirect } from "next/navigation";
import { AdminQuizAttemptDetailClient } from "@/components/admin/AdminQuizAttemptDetailClient";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminQuizAttemptDetailPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const { quizId, attemptId } = await params;
  return <AdminQuizAttemptDetailClient quizId={quizId} attemptId={attemptId} />;
}
