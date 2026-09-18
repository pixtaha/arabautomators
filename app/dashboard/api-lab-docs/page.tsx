import { requireDeviceSession } from "@/lib/auth/device-session";
import { getApiLabDocSections } from "@/lib/data/apiLabDocs";
import { Header } from "@/components/layout/Header";
import { CommerceCredentialDialog } from "@/components/commerce-api-lab/CommerceCredentialDialog";
import { HeroInfoStrip } from "./HeroInfoStrip";
import { DocNav } from "./DocNav";
import { DocSection } from "./DocSection";
// Imported for its global design tokens (colors/typography/spacing/motion/etc,
// all bare :root custom properties) and for the .api-lab-docs-scoped
// .lab-infobox/.lab-credential-*/element rules that HeroInfoStrip and
// CommerceCredentialDialog need -- see those files' own comments. Lives in
// components/commerce-api-lab/ (not this route folder) since it is shared,
// route-independent styling, not specific to this page.
import "@/components/commerce-api-lab/reference.css";
import "./reference.css";

// Reads with the service-role key (container runtime only) and shows
// per-student data, so it can't be statically generated -- same reasoning
// as every other authenticated page in this app.
export const dynamic = "force-dynamic";

export default async function ApiLabDocsPage() {
  await requireDeviceSession();
  const sections = await getApiLabDocSections();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="api-lab-docs min-h-screen">
        <HeroInfoStrip />
        <div className="doc-body-grid">
          <DocNav items={sections.map((section) => ({ slug: section.slug, navLabel: section.navLabel }))} />
          <div className="doc-main">
            {sections.map((section) => (
              <DocSection key={section.slug} section={section} />
            ))}
          </div>
        </div>
      </main>

      <CommerceCredentialDialog />
    </div>
  );
}
