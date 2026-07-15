"use client";

import { createContext, useContext, type ReactNode } from "react";
import { renderedPageForReportPage } from "@/data/appraisal-doc";
import type { SourceFocus } from "@/components/run/SourceDoc";

/**
 * Opens the side-by-side Source pane, provided by the run workbook / attestation
 * so ANY descendant citation can jump to the source without prop-drilling. Null
 * outside a run (e.g. an exported/print render) — citations then read as plain
 * text.
 */
export const SourcePaneContext = createContext<((focus: SourceFocus) => void) | null>(null);
export const useSourcePane = () => useContext(SourcePaneContext);

// "p.47", "p. 47", "pp. 56–61" — captures the first page number; parentheses
// around a citation stay as plain text so only the reference itself is a link.
// Built fresh per call (no shared mutable lastIndex) so it's safe under the
// React compiler.
const CITE_SRC = "\\bpp?\\.\\s?(\\d+)(?:\\s?[–-]\\s?\\d+)?";

/**
 * Linkify page citations in prose (Jul 15): every "p.N" in workbook / attestation
 * copy — grid captions, exhibit notes, cross-references — becomes a clickable
 * citation that opens the Source pane at that page (report page → rendered page).
 * The finding blocks keep their own "Cited p.X" chip; this covers everywhere else.
 */
export function CitationText({ children }: { children: string }) {
  const open = useSourcePane();
  const text = children;
  if (!open) return <>{text}</>;

  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(new RegExp(CITE_SRC, "gi"))) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const n = parseInt(m[1], 10);
    out.push(
      <button
        key={`cite-${key++}`}
        type="button"
        className="wb-cite-inline"
        onClick={() => open({ kind: "page", id: renderedPageForReportPage(n) })}
        title={`Open the source at page ${n}`}
      >
        {m[0]}
      </button>,
    );
    last = idx + m[0].length;
  }
  if (!out.length) return <>{text}</>;
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
