"use client";

// Renders avatar images as a CSS background-image instead of an <img>
// element, plus blocks the context menu and drag-out. This is casual-user
// friction only (no right-click "Save Image As" / "Open image in new tab",
// no drag-to-desktop, no long-press "Save to Photos" callout on iOS) -- it
// does not prevent a determined user from getting the image via a
// screenshot, devtools, the network tab, or opening the storage URL
// directly, since the URL is still public and still loads.
export function Avatar({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      style={{
        display: "block",
        backgroundImage: `url("${src.replace(/["\\]/g, "\\$&")}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    />
  );
}
