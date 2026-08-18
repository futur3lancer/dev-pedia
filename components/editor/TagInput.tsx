"use client";

import { useEffect, useState } from "react";
import { listTags } from "@/lib/actions/tags";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/database";

interface TagInputProps {
  value: string[]; // current tag names
  onChange: (tagNames: string[]) => void;
}

// Phase 2 (slice 1): plain chip input + datalist-style suggestions.
// Ang aktwal na "find or create" logic ay nasa lib/actions/tags.ts,
// tinatawag lang sa ArticleEditor kapag na-save na ang article.
export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  useEffect(() => {
    listTags()
      .then(setExistingTags)
      .catch(() => setExistingTags([]));
  }, []);

  const suggestions = existingTags
    .map((t) => t.name)
    .filter(
      (name) =>
        name.toLowerCase().includes(draft.trim().toLowerCase()) &&
        draft.trim().length > 0 &&
        !value.some((v) => v.toLowerCase() === name.toLowerCase())
    )
    .slice(0, 5);

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function removeTag(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Tags</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/30">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Alisin ang tag na ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "hal. postgres, auth" : ""}
          className="min-w-[8ch] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addTag(name)}
              className={cn(
                "rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs",
                "text-muted-foreground hover:border-primary hover:text-foreground"
              )}
            >
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
