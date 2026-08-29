"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SessionActions() {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}
