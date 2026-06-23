"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SOURCE_PAGES } from "@/data/source-pages";
import { Icon } from "@/components/atoms";

/** Stepped zoom levels; 1 (100%) is the fit-width baseline at the panel's width. */
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
/** The appraisal's nominal length, so page-nav reads as a real document. Cited
 *  pages render in full; the rest show a placeholder. */
const TOTAL_PAGES = 84;

function stepZoom(z: number, dir: 1 | -1): number {
  const i = ZOOM_STEPS.indexOf(z);
  const base = i >= 0 ? i : ZOOM_STEPS.indexOf(1);
  return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, base + dir))];
}
const clampPage = (p: number) => Math.min(TOTAL_PAGES, Math.max(1, p));

/**
 * The docked source-appraisal viewer. Renders the cited page with the relevant
 * excerpt highlighted, plus a slim viewer toolbar (zoom out/in with a % readout
 * that resets to Fit, and previous/next page with a page indicator). The parent
 * sets `page` when a citation is opened; paging within the viewer is local.
 * Keyboard (conflict-safe with the workspace keys): Ctrl/⌘ +/−/0 zoom, [ / ]
 * change page.
 */
export function PdfPane({
  page,
  onClose,
}: {
  page: number;
  onClose: () => void;
}) {
  const [viewPage, setViewPage] = useState(page);
  const [syncedPage, setSyncedPage] = useState(page);
  const [zoom, setZoom] = useState(1); // 1 = fit-width baseline

  // Follow a new citation when the parent opens a different page — React's
  // "adjust state during render" pattern (avoids a prop-sync effect).
  if (page !== syncedPage) {
    setSyncedPage(page);
    setViewPage(page);
  }

  // Ctrl/⌘ +/−/0 zoom · [ / ] page. Ignored while typing; modifier-gated zoom
  // doesn't collide with the workspace's j/k or y/n/x/c keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((z) => stepZoom(z, 1));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((z) => stepZoom(z, -1));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(1);
        }
        return;
      }
      if (e.altKey) return;
      if (e.key === "[") {
        e.preventDefault();
        setViewPage((p) => clampPage(p - 1));
      } else if (e.key === "]") {
        e.preventDefault();
        setViewPage((p) => clampPage(p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const src = SOURCE_PAGES[viewPage];

  const renderBody = () => {
    if (!src) return null;
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

  const sheetStyle = { zoom } as React.CSSProperties;

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
          Source appraisal — page {viewPage}
        </span>
        <button
          className="appbar-icon"
          onClick={onClose}
          aria-label="Close"
          style={{ color: "var(--md-on-surface-v)" }}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="pdftools">
        <div className="pdftools-grp" role="group" aria-label="Zoom">
          <button
            className="pdftools-btn"
            onClick={() => setZoom((z) => stepZoom(z, -1))}
            disabled={zoom <= ZOOM_STEPS[0]}
            aria-label="Zoom out"
          >
            <Icon name="minus" size={16} />
          </button>
          <button
            className="pdftools-pct"
            onClick={() => setZoom(1)}
            title="Reset to fit width"
            aria-label={`Zoom ${Math.round(zoom * 100)} percent — reset to fit width`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="pdftools-btn"
            onClick={() => setZoom((z) => stepZoom(z, 1))}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label="Zoom in"
          >
            <Icon name="add" size={16} />
          </button>
        </div>

        <div className="pdftools-grp" role="group" aria-label="Page">
          <button
            className="pdftools-btn"
            onClick={() => setViewPage((p) => clampPage(p - 1))}
            disabled={viewPage <= 1}
            aria-label="Previous page"
          >
            <Icon name="chevron-left" size={17} />
          </button>
          <span className="pdftools-page">
            Page {viewPage} / {TOTAL_PAGES}
          </span>
          <button
            className="pdftools-btn"
            onClick={() => setViewPage((p) => clampPage(p + 1))}
            disabled={viewPage >= TOTAL_PAGES}
            aria-label="Next page"
          >
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      </div>

      <div className="pdfpage scroll">
        {src ? (
          <div className="sheet" style={sheetStyle}>
            <h4>{src.heading}</h4>
            {renderBody()}
            <div className="pp-num">Page {viewPage} · Subject Appraisal</div>
          </div>
        ) : (
          <div className="sheet sheet--empty" style={sheetStyle}>
            <Icon name="pdf" size={28} />
            <div className="pp-empty-t">Page {viewPage}</div>
            <p>
              This page isn&rsquo;t part of the excerpt set included in this prototype. Cited pages
              render in full.
            </p>
            <div className="pp-num">Page {viewPage} · Subject Appraisal</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
