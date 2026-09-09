import type { ReactNode } from "react";

export function CourseSessionShell({
  children,
  resources,
}: {
  children: ReactNode;
  resources: ReactNode;
}) {
  return (
    <div className="relative mx-auto grid max-w-[1400px] items-start gap-4 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 lg:grid-cols-[minmax(0,1fr)_344px]">
      <main className="flex min-w-0 flex-col gap-4">{children}</main>
      <aside className="flex flex-col gap-4">{resources}</aside>
    </div>
  );
}
