import { highlight } from "sugar-high";

/** Syntax-highlighted code; lines fade in one by one and `highlight` lines glow. */
export function CodeBlock({ code, lines = [], animate = true, small = false }: { code: string; lines?: number[]; animate?: boolean; small?: boolean }) {
  const rows = code.split("\n");
  return (
    <pre className={`code ${small ? "code-small" : ""}`} aria-label="code">
      <code>
        {rows.map((row, i) => (
          <span
            key={i}
            className={`code-line ${lines.includes(i + 1) ? "is-hl" : ""} ${lines.length && !lines.includes(i + 1) ? "is-dim" : ""}`}
            style={animate ? { animationDelay: `${i * 90}ms` } : { animation: "none", opacity: 1 }}
            dangerouslySetInnerHTML={{ __html: highlight(row) || "&nbsp;" }}
          />
        ))}
      </code>
    </pre>
  );
}
