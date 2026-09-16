"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function TaskBoardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="min-h-screen bg-surface-page font-body text-text-body">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
        <div role="alert" className="rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
          <h1 className="font-display text-xl font-bold text-text-strong">Could not load your Task Board</h1>
          <p className="mt-2 text-sm text-text-muted">Please try again in a moment.</p>
          <Button className="mt-4" onClick={retry}>Try again</Button>
        </div>
      </main>
    </div>
  );
}
