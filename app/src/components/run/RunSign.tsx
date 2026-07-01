"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, IconButton } from "@/components/atoms";
import { CURRENT_USER } from "@/lib/current-user";
import { formatLongDate } from "@/lib/workbook";

/** One summary row shown above the signature pad (e.g. Recommendation / Risk, or
 *  Items attested / Changes). */
export interface SignRow {
  label: string;
  value: string;
  valueColor?: string;
}

/** The sealed signature payload (shared shape across workbook + attestation). */
export interface SignSeal {
  name: string;
  designation: string;
  at: number;
  sha: string;
}

/**
 * Sign & seal — a floating two-step modal over the document (which stays visible
 * behind a scrim). Step 1 "Sign": a summary + a Type/Draw signature pad, gated
 * until the work is complete. Step 2 "Finalized": the sealed result (signer ·
 * timestamp · SHA-256) + Download + Return. Fully config-driven so BOTH the
 * Technical workbook and the Administrative attestation share the identical seal
 * experience — the caller supplies the copy, summary rows, blocked gate + seal.
 */
export function RunSignModal({
  open,
  sealed,
  signature,
  embedded,
  returnLabel,
  signing,
  blocked,
  blockedNote,
  title,
  statement,
  rows,
  sealedTitle,
  sealedNote,
  signCta,
  onSign,
  onClose,
  onReturn,
}: {
  open: boolean;
  sealed: boolean;
  signature: SignSeal | null;
  embedded: boolean;
  returnLabel: string | null;
  signing: boolean;
  blocked: boolean;
  blockedNote: ReactNode;
  title: string;
  statement: ReactNode;
  rows: SignRow[];
  sealedTitle: string;
  sealedNote: ReactNode;
  signCta: string;
  onSign: () => void;
  onClose: () => void;
  onReturn: () => void;
}) {

  // Signature pad state (lifted so the footer can gate on it).
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [typed, setTyped] = useState<string>(CURRENT_USER.signatureName);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasSignature = mode === "type" ? typed.trim().length > 0 : hasDrawn;

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const inkColor = () => {
    const el = canvasRef.current;
    if (!el) return "#1A1D21";
    return getComputedStyle(el).color || "#1A1D21";
  };
  const pointFor = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const el = canvasRef.current!;
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * el.width,
      y: ((e.clientY - rect.top) / rect.height) * el.height,
    };
  };
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const el = canvasRef.current;
    const c = el?.getContext("2d");
    if (!el || !c) return;
    drawing.current = true;
    el.setPointerCapture(e.pointerId);
    c.strokeStyle = inkColor();
    c.lineWidth = 2.4;
    c.lineCap = "round";
    c.lineJoin = "round";
    const p = pointFor(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    const p = pointFor(e);
    c.lineTo(p.x, p.y);
    c.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };
  const endDraw = () => {
    drawing.current = false;
  };
  const clearDraw = () => {
    const el = canvasRef.current;
    const c = el?.getContext("2d");
    if (el && c) c.clearRect(0, 0, el.width, el.height);
    setHasDrawn(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="run-sm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        >
          <motion.div
            className="run-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Sign and finalize"
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="run-sm-head">
              <h2>{title}</h2>
              <IconButton name="close" onClick={onClose} aria-label="Close" />
            </header>

            <div className="run-sm-body scroll">
              {sealed && signature ? (
                <div className="run-final">
                  <div className="run-final-seal">
                    <Icon name="check-circle" size={30} />
                  </div>
                  <h3 className="run-seal-title">{sealedTitle}</h3>
                  <p className="run-seal-stmt run-final-stmt">{sealedNote}</p>
                  <div className="run-seal-rows run-final-rows">
                    <div className="run-seal-row">
                      <span>Signed by</span>
                      <b>
                        {signature.name} · {signature.designation}
                      </b>
                    </div>
                    <div className="run-seal-row">
                      <span>Timestamp</span>
                      <b>{formatLongDate(signature.at)}</b>
                    </div>
                    <div className="run-seal-row">
                      <span>SHA-256 seal</span>
                      <b title={signature.sha}>{signature.sha.slice(0, 24)}…</b>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="run-sm-stmt">{statement}</p>

                  <div className="run-seal-rows">
                    {rows.map((r) => (
                      <div className="run-seal-row" key={r.label}>
                        <span>{r.label}</span>
                        <b style={r.valueColor ? { color: r.valueColor } : undefined}>{r.value}</b>
                      </div>
                    ))}
                  </div>

                  <div className="run-seal-pad-wrap">
                    <div className="run-seal-tabs">
                      <button
                        className={`run-seal-tab${mode === "type" ? " on" : ""}`}
                        onClick={() => setMode("type")}
                      >
                        Type
                      </button>
                      <button
                        className={`run-seal-tab${mode === "draw" ? " on" : ""}`}
                        onClick={() => setMode("draw")}
                      >
                        Draw
                      </button>
                    </div>

                    {mode === "type" ? (
                      <div className="run-seal-pad">
                        <span className="run-seal-script">{typed || "Your name"}</span>
                        <input
                          className="ui-input run-seal-input"
                          value={typed}
                          onChange={(e) => setTyped(e.target.value)}
                          placeholder="Type your full name"
                          aria-label="Type your signature"
                        />
                      </div>
                    ) : (
                      <div className="run-seal-pad">
                        <canvas
                          ref={canvasRef}
                          width={760}
                          height={150}
                          className="run-seal-canvas"
                          onPointerDown={startDraw}
                          onPointerMove={moveDraw}
                          onPointerUp={endDraw}
                          onPointerLeave={endDraw}
                        />
                        <div className="run-seal-pad-foot">
                          <span className="run-seal-pad-hint">Draw your signature above</span>
                          <button
                            className="run-seal-clear"
                            onClick={clearDraw}
                            disabled={!hasDrawn}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {blocked && (
                    <p className="run-seal-block">
                      <Icon name="clock" size={14} /> {blockedNote}
                    </p>
                  )}
                </>
              )}
            </div>

            <footer className="run-sm-foot">
              {sealed ? (
                <>
                  <Button variant="outline" size="sm" iconLeft="download">
                    Download PDF
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="forward"
                    onClick={onReturn}
                  >
                    {embedded ? `Return to ${returnLabel ?? "YouConnect"}` : "Go to reviews"}
                  </Button>
                </>
              ) : (
                <>
                  <span className="run-sm-foot-note">
                    {blocked ? (
                      <>
                        <Icon name="clock" size={14} /> Resolve first
                      </>
                    ) : (
                      <>
                        <Icon name="check-circle" size={14} /> Ready to seal
                      </>
                    )}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft="check-circle"
                    disabled={signing || blocked || !hasSignature}
                    onClick={onSign}
                  >
                    {signing ? "Sealing…" : signCta}
                  </Button>
                </>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
