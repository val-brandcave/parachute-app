"use client";

import { motion } from "framer-motion";
import { SOURCE_PAGES } from "@/data/source-pages";
import { Icon } from "@/components/atoms";

/** Renders the cited appraisal page with the relevant excerpt highlighted. */
export function PdfPane({
  page,
  onClose,
}: {
  page: number;
  onClose: () => void;
}) {
  const src = SOURCE_PAGES[page];

  const renderBody = () => {
    if (!src) return "Page not available in this demo.";
    if (!src.highlight) return src.body;
    const idx = src.body.indexOf(src.highlight);
    if (idx === -1) return src.body;
    return (
      <>
        {src.body.slice(0, idx)}
        <span className="hl">{src.highlight}</span>
        {src.body.slice(idx + src.highlight.length)}
      </>
    );
  };

  return (
    <motion.div
      className="pdfpane"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="pdfpane-h">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="pdf" size={16} style={{ color: "var(--md-primary)" }} />
          Source appraisal — page {page}
        </span>
        <button className="appbar-icon" onClick={onClose} aria-label="Close" style={{ color: "var(--md-on-surface-v)" }}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="pdfpage scroll">
        <div className="sheet">
          <h4>{src?.heading ?? "Appraisal Report"}</h4>
          {renderBody()}
          <div className="pp-num">Page {page} · Subject Appraisal</div>
        </div>
      </div>
    </motion.div>
  );
}
