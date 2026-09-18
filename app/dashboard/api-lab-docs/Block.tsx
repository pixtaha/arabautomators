import type { CSSProperties } from "react";
import { RichText } from "@/lib/richText";
import type { ApiLabDocBlock, ApiLabEndpointRow, ApiLabTableColumn } from "@/lib/data/apiLabDocs";
import { CopyButton } from "./CopyButton";

const CARD_STYLE: CSSProperties = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 16,
  boxShadow: "var(--shadow-sm)",
  overflow: "hidden",
};

const CALLOUT_ACCENT: Record<string, string> = {
  brand: "var(--surface-brand)",
  accent: "var(--surface-accent)",
  ink: "var(--aa-neutral-950)",
};

// One trusted React component per block kind -- the dispatcher a Supabase
// row's `kind` column routes into. Nothing here ever uses
// dangerouslySetInnerHTML; inline formatting goes through RichText.
export function Block({ block }: { block: ApiLabDocBlock }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p style={{ maxWidth: "68ch" }}>
          <RichText text={block.content.text} />
        </p>
      );
    case "numbered_steps":
      return <NumberedSteps steps={block.content.steps} />;
    case "ordered_list":
      return (
        <ol style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: "68ch" }}>
          {block.content.items.map((item, index) => (
            <li key={index}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      );
    case "code":
      return <CodeBlock language={block.content.language} code={block.content.code} />;
    case "callout":
      return <Callout accent={block.content.accent} text={block.content.text} />;
    case "table":
      return <DataTable columns={block.content.columns} rows={block.content.rows} />;
    case "endpoint_table":
      return <EndpointTable endpoints={block.endpoints} />;
    case "badge_sequence":
      return <BadgeSequence label={block.content.label} badges={block.content.badges} />;
    default:
      return null;
  }
}

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((step, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: 14,
            padding: "16px 20px",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span style={{ flex: "none", font: "var(--fw-bold) 13px/1.6 var(--font-mono)", color: "var(--aa-green-700)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <p>
            <RichText text={step} />
          </p>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div style={{ position: "relative", background: "var(--surface-ink)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0" }}>
        <CopyButton value={code} label={`Copy ${language === "bash" ? "command" : "example"}`} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <pre style={{ padding: "6px 20px 20px", font: "var(--fw-medium) 13px/1.75 var(--font-mono)", color: "#E8E8E8" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function Callout({ accent, text }: { accent: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 0, ...CARD_STYLE }}>
      <div style={{ flex: "none", width: 4, background: CALLOUT_ACCENT[accent] ?? CALLOUT_ACCENT.brand }} />
      <p style={{ padding: "16px 20px", maxWidth: "68ch" }}>
        <RichText text={text} />
      </p>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: ApiLabTableColumn[]; rows: Record<string, string>[] }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    <RichText text={row[column.key] ?? ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// data-write / data-y mirror the original page's own attribute-selector
// technique (see reference.css's td[data-write]/td[data-y] rules) instead
// of computing colors inline -- same visual result, same mechanism.
function EndpointTable({ endpoints }: { endpoints: ApiLabEndpointRow[] }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Key</th>
              <th>Purpose / successful status</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint) => (
              <tr key={endpoint.id}>
                <td data-write={endpoint.is_write || undefined}>{endpoint.method}</td>
                <td>
                  <code>{endpoint.path}</code>
                </td>
                <td data-y={endpoint.requires_key ? "y" : "n"}>{endpoint.requires_key ? "Yes" : "No"}</td>
                <td>
                  <RichText text={endpoint.purpose} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BadgeSequence({ label, badges }: { label: string; badges: string[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        padding: "16px 20px",
        background: "var(--surface-sunken)",
        borderRadius: 12,
      }}
    >
      <span
        style={{
          font: "var(--type-eyebrow)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginRight: 6,
        }}
      >
        {label}
      </span>
      {badges.map((badge, index) => {
        const isLast = index === badges.length - 1;
        return (
          <span key={badge} style={{ display: "contents" }}>
            {index > 0 && <span style={{ color: "var(--text-faint)" }}>→</span>}
            <span
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                font: "var(--fw-bold) 12px/1.2 var(--font-mono)",
                background: isLast ? "var(--surface-brand)" : "var(--surface-card)",
                border: isLast ? "none" : "1px solid var(--border-hairline)",
                color: isLast ? "var(--text-inverse)" : "var(--aa-black)",
              }}
            >
              {badge}
            </span>
          </span>
        );
      })}
    </div>
  );
}
