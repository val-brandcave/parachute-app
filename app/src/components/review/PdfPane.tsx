"use client";

import { motion } from "framer-motion";
import { SOURCE_PAGES } from "@/data/source-pages";

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
        <span>
          <span
            className="material-icons"
            style={{ fontSize: 16, color: "var(--md-primary)", marginRight: 6 }}
          >
            picture_as_pdf
          </span>
          Source appraisal — page {page}
        </span>
        <button className="appbar-icon" onClick={onClose} aria-label="Close" style={{ color: "var(--md-on-surface-v)" }}>
          <span className="material-icons">close</span>
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
