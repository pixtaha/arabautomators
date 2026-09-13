// Plain constants shared between server routes and client components for
// the Task Board's code-resource type. Deliberately NOT in
// lib/data/taskBoard.ts -- that module starts with `import "server-only"`
// (it wraps createAdminClient() calls), which forbids importing it from any
// Client Component at all, even for a value with no server dependency like
// this one. Keeping it in its own file lets CreateTaskBoardTaskForm.tsx
// import the real runtime array (needed to render/iterate the language
// picker, not just for its type) without pulling the server-only module in.
export const ALLOWED_CODE_LANGUAGES = ["javascript", "typescript", "json", "python", "bash"] as const;
export type TaskBoardCodeLanguage = (typeof ALLOWED_CODE_LANGUAGES)[number];
