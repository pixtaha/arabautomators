import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Row/content shapes match supabase/migrations/20260918_create_api_lab_docs_schema.sql
// exactly -- see that file for the full rationale (block-based content model
// instead of one raw-HTML column, endpoints as their own relational table).

export type ApiLabDocBlockKind =
  | "paragraph"
  | "numbered_steps"
  | "ordered_list"
  | "code"
  | "callout"
  | "table"
  | "endpoint_table"
  | "badge_sequence";

export interface ApiLabParagraphContent {
  text: string;
}
export interface ApiLabNumberedStepsContent {
  steps: string[];
}
export interface ApiLabOrderedListContent {
  items: string[];
}
export interface ApiLabCodeContent {
  language: "bash" | "json" | "text";
  code: string;
}
export interface ApiLabCalloutContent {
  accent: "brand" | "accent" | "ink";
  text: string;
}
export interface ApiLabTableColumn {
  key: string;
  label: string;
}
export interface ApiLabTableContent {
  columns: ApiLabTableColumn[];
  rows: Record<string, string>[];
}
export interface ApiLabBadgeSequenceContent {
  label: string;
  badges: string[];
}

export interface ApiLabEndpointRow {
  id: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  requires_key: boolean;
  is_write: boolean;
  purpose: string;
  display_order: number;
}

// The resolved, kind-discriminated shape the renderer actually consumes.
// endpoint_table is the one kind whose real payload (the section's rows)
// doesn't live in its own `content` column -- it's resolved server-side
// here and attached as `endpoints`, so Block.tsx never needs to know how
// that resolution happened.
export type ApiLabDocBlock =
  | { id: string; kind: "paragraph"; content: ApiLabParagraphContent }
  | { id: string; kind: "numbered_steps"; content: ApiLabNumberedStepsContent }
  | { id: string; kind: "ordered_list"; content: ApiLabOrderedListContent }
  | { id: string; kind: "code"; content: ApiLabCodeContent }
  | { id: string; kind: "callout"; content: ApiLabCalloutContent }
  | { id: string; kind: "table"; content: ApiLabTableContent }
  | { id: string; kind: "endpoint_table"; endpoints: ApiLabEndpointRow[] }
  | { id: string; kind: "badge_sequence"; content: ApiLabBadgeSequenceContent };

export interface ApiLabDocSection {
  slug: string;
  navLabel: string;
  title: string;
  eyebrow: string | null;
  blocks: ApiLabDocBlock[];
}

const SECTION_COLUMNS = "id, slug, nav_label, title, eyebrow, display_order";
const BLOCK_COLUMNS = "id, section_id, display_order, kind, content";
const ENDPOINT_COLUMNS = "id, section_id, method, path, requires_key, is_write, purpose, display_order";

export class ApiLabDocsReadError extends Error {
  constructor() {
    super("Could not load the Commerce API docs. Please try again.");
    this.name = "ApiLabDocsReadError";
  }
}

function failApiLabDocsRead(operation: string, error: { code?: string; message: string } | null): never {
  // Database diagnostics stay on the server -- same convention as
  // lib/data/taskBoard.ts's failTaskBoardRead().
  console.error("[api-lab-docs] Database read failed", {
    operation,
    code: error?.code ?? "NO_DATA",
    message: error?.message ?? "Query returned no data",
  });
  throw new ApiLabDocsReadError();
}

// Published sections, each with its blocks in display order and, for any
// endpoint_table block, that section's endpoint rows already attached. One
// round trip for sections, then sections+endpoints in parallel, rather than
// N+1 per-section queries.
export async function getApiLabDocSections(): Promise<ApiLabDocSection[]> {
  const supabase = createAdminClient();

  const { data: sections, error: sectionsError } = await supabase
    .from("api_lab_doc_sections")
    .select(SECTION_COLUMNS)
    .eq("is_published", true)
    .order("display_order");
  if (sectionsError || !sections) failApiLabDocsRead("sections", sectionsError);
  if (sections.length === 0) return [];

  const sectionIds = sections.map((section) => section.id);

  const [{ data: blocks, error: blocksError }, { data: endpoints, error: endpointsError }] = await Promise.all([
    supabase.from("api_lab_doc_blocks").select(BLOCK_COLUMNS).in("section_id", sectionIds).order("display_order"),
    supabase.from("api_lab_endpoints").select(ENDPOINT_COLUMNS).in("section_id", sectionIds).order("display_order"),
  ]);
  if (blocksError || !blocks) failApiLabDocsRead("blocks", blocksError);
  if (endpointsError || !endpoints) failApiLabDocsRead("endpoints", endpointsError);

  const endpointsBySection = new Map<string, ApiLabEndpointRow[]>();
  for (const endpoint of endpoints) {
    const list = endpointsBySection.get(endpoint.section_id) ?? [];
    list.push(endpoint);
    endpointsBySection.set(endpoint.section_id, list);
  }

  const blocksBySection = new Map<string, ApiLabDocBlock[]>();
  for (const block of blocks) {
    const resolved: ApiLabDocBlock =
      block.kind === "endpoint_table"
        ? { id: block.id, kind: "endpoint_table", endpoints: endpointsBySection.get(block.section_id) ?? [] }
        : { id: block.id, kind: block.kind, content: block.content };
    const list = blocksBySection.get(block.section_id) ?? [];
    list.push(resolved);
    blocksBySection.set(block.section_id, list);
  }

  return sections.map((section) => ({
    slug: section.slug,
    navLabel: section.nav_label,
    title: section.title,
    eyebrow: section.eyebrow,
    blocks: blocksBySection.get(section.id) ?? [],
  }));
}
