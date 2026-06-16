"use client";
import { useState } from "react";

export default function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const link = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={handleCopy} style={{ marginTop: 6, fontSize: 12 }}>
      {copied ? "Copied!" : "Copy review link"}
    </button>
  );
}