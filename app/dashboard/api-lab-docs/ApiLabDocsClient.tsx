"use client";

import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { COMMERCE_API_REFERENCE_HTML } from "./fragment";
import "./reference.css";

// _ds_bundle.js and support.js are plain global-scope scripts (they set
// window.ArabAutomatorsDesignSystem_f5d5e6 / window.__dcBoot etc., not ES
// modules), so they load as classic scripts via next/script rather than
// `import`. support.js hides <x-dc> the instant it runs and only reveals the
// rendered content once it boots (see boot()/hideRawTemplate() in the file
// itself) -- afterInteractive keeps that behavior without blocking the rest
// of this page (Header, chrome) from painting immediately like every other
// dashboard route.
const BUNDLE_URL =
  "/api-lab-docs/_ds/arab-automators-design-system-f5d5e6cd-069e-4c1c-91b7-6cf2a79a141a/_ds_bundle.js";

export function ApiLabDocsClient() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      {/* support.js's boot() looks for a literal <x-dc> element and a sibling
          <script data-dc-script> and replaces/renders them itself -- that
          can't be expressed as JSX, hence dangerouslySetInnerHTML. */}
      <main className="api-lab-docs min-h-screen" dangerouslySetInnerHTML={{ __html: COMMERCE_API_REFERENCE_HTML }} />

      <Script src={BUNDLE_URL} strategy="afterInteractive" />
      <Script src="/api-lab-docs/support.js" strategy="afterInteractive" />
    </div>
  );
}
