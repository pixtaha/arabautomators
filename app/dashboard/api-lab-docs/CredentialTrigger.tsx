// The 4th static info box. A plain server-rendered button -- it needs no
// client-side state of its own. CommerceCredentialDialog (components/
// commerce-api-lab/) listens for clicks on
// ".api-lab-docs [data-commerce-credential]" at the document level, and
// this button's ancestor (HeroInfoStrip's own wrapper) carries that exact
// class, so the existing, already-fixed dialog just works here with zero
// new wiring.
export function CredentialTrigger() {
  return (
    <button
      type="button"
      className="lab-infobox lab-credential-trigger"
      data-commerce-credential
      aria-haspopup="dialog"
      aria-controls="commerce-credential-dialog"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "12px 16px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        style={{
          font: "var(--type-eyebrow)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        API credential
      </span>
      <span className="lab-credential-action" style={{ font: "var(--fw-bold) 13px/1.4 var(--font-mono)" }}>
        View API Key
      </span>
    </button>
  );
}
