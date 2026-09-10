"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface ModuleOption {
  id: string;
  title: string;
  orderIndex: number;
}

export interface CreatedSession {
  id: string;
  title: string;
  order_index: number;
  module_id: string;
  status: string;
}

export function CreateSessionForm({
  modules,
  onCreated,
  onCancel,
}: {
  modules: ModuleOption[];
  onCreated: (session: CreatedSession) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [orderIndex, setOrderIndex] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId && modules.length > 0) setModuleId(modules[0].id);
  }, [modules, moduleId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required."); return; }
    if (!moduleId) { setError("Choose a module."); return; }

    let parsedOrderIndex: number | undefined;
    if (orderIndex.trim()) {
      const parsed = Number(orderIndex);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError("Order index must be a positive whole number.");
        return;
      }
      parsedOrderIndex = parsed;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          moduleId,
          ...(parsedOrderIndex !== undefined ? { orderIndex: parsedOrderIndex } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.session) {
        setError(data.error ?? "Could not create session.");
        return;
      }
      onCreated(data.session);
      setTitle("");
      setOrderIndex("");
    } catch {
      setError("Could not create session. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
    >
      <div>
        <h2 className="font-display text-lg font-bold text-text-strong">Create new session</h2>
        <p className="mt-1 text-sm text-text-muted">Add a new session row to a module.</p>
      </div>

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Session 4: Error Handling"
        disabled={submitting}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-session-module" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Module
        </label>
        <select
          id="new-session-module"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          disabled={submitting || modules.length === 0}
          className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
        >
          {modules.length === 0 && <option>No modules found</option>}
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              Module {m.orderIndex}: {m.title}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Order index (optional)"
        type="number"
        min="1"
        step="1"
        value={orderIndex}
        onChange={(e) => setOrderIndex(e.target.value)}
        placeholder="Leave blank to auto-assign next in module"
        disabled={submitting}
      />

      {error && <p role="alert" className="text-xs font-medium text-aa-red-700">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || modules.length === 0}>
          {submitting ? "Creating…" : "Create session"}
        </Button>
        <Button type="button" variant="ghost" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
