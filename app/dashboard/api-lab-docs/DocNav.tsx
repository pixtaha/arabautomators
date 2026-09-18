"use client";

import { useEffect, useState } from "react";

export interface DocNavItem {
  slug: string;
  navLabel: string;
}

// Scroll-spy sidebar, generated from the same section list DocSection
// renders below -- one source of truth, unlike the original page where the
// nav links and the section headings were two separately hardcoded pieces
// of markup that could drift apart.
export function DocNav({ items }: { items: DocNavItem[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.slug))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSlug(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav id="doc-nav">
      <div className="doc-nav-list">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <a
              key={item.slug}
              href={`#${item.slug}`}
              className="doc-nav-link"
              style={{
                color: active ? "var(--aa-green-700)" : "var(--text-muted)",
                background: active ? "var(--surface-brand-soft)" : "transparent",
              }}
            >
              {item.navLabel}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
