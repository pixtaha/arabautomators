import type { CSSProperties } from "react";
import { CopyButton } from "./CopyButton";
import { CredentialTrigger } from "./CredentialTrigger";

// Base URL / docs link / OpenAPI link are genuinely static config, not
// content -- they don't come from Supabase, per the agreed plan.
const API_LAB_BASE_URL = "https://api-lab.arabautomators.com";
const API_LAB_DOCS_URL = "https://api-lab.arabautomators.com/docs";
const API_LAB_OPENAPI_URL = "https://api-lab.arabautomators.com/openapi.json";

const INFOBOX_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "12px 16px",
  background: "var(--surface-card)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  boxShadow: "var(--shadow-sm)",
};

const EYEBROW_STYLE: CSSProperties = {
  font: "var(--type-eyebrow)",
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

// Scoped under .api-lab-docs -- this strip reuses the shared
// .lab-infobox/.lab-credential-*/design-token CSS from
// components/commerce-api-lab/reference.css (imported in page.tsx) instead
// of duplicating ~200 lines of styling here. Also why the dot-field
// background below is a plain div with --bg-dots (a global token) rather
// than the design-system DotField component -- DotField was the only
// component this page ever used from that bundle, and it was always just
// this one style declaration, so there is no need to load
// _ds_bundle.js/support.js for this route at all.
export function HeroInfoStrip() {
  return (
    <div className="api-lab-docs" style={{ background: "var(--bg-dots)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--hero-pad)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--surface-brand)" }} />
          <span style={EYEBROW_STYLE}>Arab Automators · student reference</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "var(--hero-fs)",
            lineHeight: 1.02,
            letterSpacing: "var(--tr-tightest)",
            color: "var(--text-strong)",
            marginBottom: 20,
          }}
        >
          Commerce API
        </h1>
        <p
          style={{
            maxWidth: "68ch",
            font: "var(--fw-regular) var(--fs-lg)/1.6 var(--font-body)",
            color: "var(--text-body)",
            textWrap: "pretty",
          }}
        >
          Build n8n workflows against a fictional e-commerce company. All customers, products, orders, reviews and
          shipments are generated. Payments are simulated. Use only fake exercise data; never submit real payment
          details, personal information, or production credentials.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
          <div className="lab-infobox" style={INFOBOX_STYLE}>
            <span style={EYEBROW_STYLE}>Base URL</span>
            <div data-block style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <code style={{ background: "none", padding: 0, font: "var(--fw-bold) 13px/1.4 var(--font-mono)", color: "var(--aa-black)" }}>
                {API_LAB_BASE_URL}
              </code>
              <CopyButton value={API_LAB_BASE_URL} label="Copy base URL" variant="icon" />
            </div>
          </div>
          <div className="lab-infobox" style={INFOBOX_STYLE}>
            <span style={EYEBROW_STYLE}>Interactive explorer</span>
            <a href={API_LAB_DOCS_URL} style={{ font: "var(--fw-bold) 13px/1.4 var(--font-mono)" }}>
              /docs
            </a>
          </div>
          <div className="lab-infobox" style={INFOBOX_STYLE}>
            <span style={EYEBROW_STYLE}>OpenAPI</span>
            <a href={API_LAB_OPENAPI_URL} style={{ font: "var(--fw-bold) 13px/1.4 var(--font-mono)" }}>
              /openapi.json
            </a>
          </div>
          <CredentialTrigger />
        </div>
      </div>
    </div>
  );
}
