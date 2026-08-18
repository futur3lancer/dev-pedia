import type { ArticleType } from "@/types/database";

// Starter content per article type, hango sa docs/04-content-templates.md.
// Ginagamit para may laman na agad ang editor sa "New Article" — hindi
// kailangang balikan pa ang docs para malaman ang expected structure.

const GENERIC_TEMPLATE = `## What is {Title}?

1-3 sentence definition — diretso sa punto.

## Why It Matters

Bakit importante malaman ito — practical na dahilan, hindi textbook definition.

## How It Works

Explanation, pwedeng may diagram.

\`\`\`
Frontend
   ↓
HTTP Request
   ↓
API
   ↓
Backend
\`\`\`

## Example

\`\`\`ts
// concrete code example, hindi abstract
\`\`\`

## Related Concepts

→ Concept A
→ Concept B
→ Concept C

## My Notes

Personal insight — bakit ganito ang naiintindihan mo dito, anong analogy ang gumana sa'yo, atbp.

## Where I Used It

→ Project A
→ Project B
`;

const TECHNOLOGY_TEMPLATE = `## What is {Title}?

Short description.

## Sub-Concepts

→ Sub-concept A
→ Sub-concept B
→ Sub-concept C

## Why I Use It

Practical reasoning.

## Common Pitfalls

Mga bagay na madalas ikamali — cross-reference sa Error Encyclopedia kung meron.

## Related Concepts

→ Concept A
→ Concept B

## Where I Used It

→ Project A
`;

const ARCHITECTURE_TEMPLATE = `## Definition

1-2 paragraph explanation.

## When to Use

- Scenario A
- Scenario B

## When NOT to Use

- Scenario A
- Scenario B

## Advantages

- Advantage A
- Advantage B

## Disadvantages

- Disadvantage A
- Disadvantage B

## Diagram

\`\`\`
{ASCII o Mermaid diagram}
\`\`\`

## Example

Concrete example — pwedeng reference sa isang totoong system.

## My Projects

→ Project A — isang linyang paliwanag kung paano ginamit
→ Project B

## Related Concepts

→ Concept A
→ Concept B
`;

export function getStarterContent(type: ArticleType, title: string): string {
  const heading = `# ${title || "Untitled"}\n\n`;
  switch (type) {
    case "technology":
      return heading + TECHNOLOGY_TEMPLATE.replace(/\{Title\}/g, title || "Untitled");
    case "architecture":
      return heading + ARCHITECTURE_TEMPLATE;
    case "encyclopedia":
    case "concept":
    case "experiment":
    default:
      return heading + GENERIC_TEMPLATE.replace(/\{Title\}/g, title || "Untitled");
  }
}
