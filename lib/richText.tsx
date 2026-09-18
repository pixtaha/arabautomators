// Parses the small markdown-lite subset used by api_lab_doc_blocks content
// (`code`, **bold**, [text](url)) into real React nodes. This is the only
// place inline formatting in doc content is interpreted, and it only
// recognizes these three constructs on purpose -- no raw HTML, ever, so doc
// content (which an admin UI will eventually let non-developers edit) can
// never inject markup.
const TOKEN_RE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN_RE);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          return (
            <a key={index} href={link[2]}>
              {link[1]}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}
