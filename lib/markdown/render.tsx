import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/article-view/CodeBlock";

// Phase 1: plain markdown render.
// Phase 3 (slice 1): fenced code blocks route through CodeBlock, which adds
// syntax highlighting (Prism) + a copy button. Inline code (`like this`,
// no fence, no language) stays as a plain <code> — no highlighter, no copy
// button, since it's usually a single identifier inline in a sentence.
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-devpedia max-w-none prose-sm sm:prose-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(
              match || (node?.position && node.position.start.line !== node.position.end.line)
            );

            if (!isBlock) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }

            const code = String(children).replace(/\n$/, "");
            return <CodeBlock language={match?.[1] ?? "text"} code={code} />;
          },
          // react-markdown wraps `code` in a `pre` for fenced blocks — since
          // CodeBlock already renders its own container (div + pre from the
          // highlighter), skip the extra wrapper to avoid double padding /
          // nested <pre>.
          pre({ children }) {
            return <>{children}</>;
          },
          // Wide GFM tables (hal. schema references) ay maaaring lumagpas
          // sa screen width sa mobile — bigyan ng sarili nitong horizontal
          // scroll container sa halip na i-clip o i-overflow ang buong
          // page.
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
