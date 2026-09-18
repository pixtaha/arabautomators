import type { ApiLabDocSection } from "@/lib/data/apiLabDocs";
import { Block } from "./Block";

export function DocSection({ section }: { section: ApiLabDocSection }) {
  return (
    <section id={section.slug} style={{ scrollMarginTop: 80 }}>
      <div style={{ width: 40, height: 3, background: "var(--aa-black)", marginBottom: 16 }} />
      {section.eyebrow && (
        <p
          style={{
            font: "var(--type-eyebrow)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          {section.eyebrow}
        </p>
      )}
      <h2
        style={{
          font: "var(--type-title)",
          letterSpacing: "var(--tr-tighter)",
          color: "var(--text-strong)",
          marginBottom: 20,
        }}
      >
        {section.title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {section.blocks.map((block) => (
          <Block key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}
