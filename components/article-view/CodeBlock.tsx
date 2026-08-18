"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

interface CodeBlockProps {
  language: string;
  code: string;
}

// Phase 3 (slice 1): fenced code blocks + syntax highlighting + copy
// button. react-syntax-highlighter (Prism) ang ginamit sa halip na Shiki
// — sync at client-safe, kaya gumagana ito pareho sa live editor preview
// (ArticleEditor, "use client") at sa server-rendered article pages nang
// walang async-server-component complications.
export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Tahimik lang i-ignore kung walang clipboard access (hal. http, o
      // hindi pinayagan ng browser).
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs font-medium text-white opacity-70 backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <div className="overflow-x-auto rounded-lg">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
