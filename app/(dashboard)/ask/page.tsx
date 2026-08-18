"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { askEncyclopedia, type AskSource } from "@/lib/actions/ask";
import { articleTypePath } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AskSource[];
  isError?: boolean;
}

const TYPE_LABELS: Record<AskSource["type"], string> = {
  encyclopedia: "Encyclopedia",
  concept: "Concept",
  technology: "Technology",
  architecture: "Architecture",
  experiment: "Experiment",
};

function makeId() {
  return Math.random().toString(36).slice(2);
}

// Phase 4 (slice 1): "Ask my encyclopedia" chat page. Client component
// dahil kailangan ng scroll-as-you-chat na UX — pero ang totoong trabaho
// (retrieval + Gemini call) ay nasa server action (askEncyclopedia), kaya
// hindi kailangan i-expose ang GEMINI_API_KEY sa browser.
export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus lang sa mga device na may tunay na keyboard (mouse/
    // trackpad, "fine" pointer) — sa touch devices, ang auto-focus ay
    // agad na nagpapalabas ng on-screen keyboard at nagpapa-jump ng
    // layout pagbukas pa lang ng page, kaya sadyang sino-skip doon.
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await askEncyclopedia(question);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "May nangyaring error. Subukan ulit.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">🤖 Ask my Encyclopedia</h1>
        <p className="text-sm text-muted-foreground">
          Magtanong gamit ang sarili mong salita — sasagot ito base sa mga
          article na naisulat mo na.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-md border border-border p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Wala pang tanong. Subukan mo, hal. "paano ko ginamit si Supabase
            RLS sa mga project ko?"
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-md bg-primary/10 px-4 py-2.5 text-sm"
                : "max-w-[80%] space-y-2 rounded-md border border-border px-4 py-2.5 text-sm"
            }
          >
            <p
              className={
                m.isError
                  ? "whitespace-pre-wrap text-red-600"
                  : "whitespace-pre-wrap"
              }
            >
              {m.content}
            </p>

            {m.sources && m.sources.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-2">
                {m.sources.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/${articleTypePath(s.type)}/${s.slug}`}
                    className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:underline"
                  >
                    [{i + 1}] {s.title}
                    <span className="ml-1 opacity-70">
                      ({TYPE_LABELS[s.type]})
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <p className="text-sm text-muted-foreground">Naghahanap at nag-iisip…</p>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Magtanong tungkol sa mga naisulat mong article…"
          className="flex-1 rounded-md border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
