"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, IconButton, Icon, Input, Label } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { generateId, type ChecklistTemplateItem } from "@/types";

/** Extraction stages — mirrors the review pipeline's staged progress (same
 *  `.run-progress` visual), phrased for a checklist. No new animation type. */
const EXTRACT_STAGES = [
  "Reading the document",
  "Normalizing the questions",
  "Detecting answer types",
  "Mapping to review fields",
];
const STAGE_MS = 1100;

// Simulated AI extraction output. In production this comes from the document
// pipeline; here it stands in so the flow is demonstrable end-to-end. The
// reviewer confirms/adjusts these mappings on the details page, then publishes.
function sampleExtract(): ChecklistTemplateItem[] {
  const mk = (
    group: string,
    question: string,
    type: ChecklistTemplateItem["type"],
    map: ChecklistTemplateItem["map"] = "ok",
    hint?: string,
  ): ChecklistTemplateItem => ({
    id: generateId(),
    group,
    orig: question,
    question,
    type,
    map,
    requireCitation: type === "binary",
    hint,
  });
  return [
    mk("Report & Compliance", "Is the report signed by a certified appraiser?", "binary"),
    mk("Report & Compliance", "Are the effective and report dates stated?", "binary"),
    mk("Report & Compliance", "Does the report conform with USPAP / FIRREA?", "binary"),
    mk("Valuation Approaches", "Is the income approach adequately supported?", "qualitative"),
    mk("Valuation Approaches", "Are at least three comparable sales included?", "binary"),
    mk(
      "Valuation Approaches",
      "Sales comp approach used and supported? Cap rate supported?",
      "qualitative",
      "warn",
      "Double-barrelled: two questions detected in one row — split before publishing.",
    ),
    mk("Bank Policy & Special Considerations", "Are environmental concerns addressed?", "qualitative"),
    mk("Bank Policy & Special Considerations", "Is a flood-zone determination included?", "binary"),
  ];
}

/** Turn a picked filename into a sensible default checklist name. */
function nameFromFile(file: string) {
  return file
    .replace(/\.(docx?|xlsx?|pdf)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

/**
 * New-compliance-checklist flow. The file is already captured on the page's
 * dropzone, so this is a single confirm step — the uploaded file + a name to
 * confirm. "Extract & review" swaps the body to the review-style processing
 * animation (extraction happens here, not as its own step); when it finishes the
 * checklist is created as a DRAFT and we route to its details page, where the
 * reviewer confirms/adjusts the AI mappings and publishes v1 for the first time.
 * (The old separate AI-extract / review-mapping / publish steps were redundant
 * with that page.)
 */
export function ChecklistUploadWizard({
  open,
  fileName,
  onClose,
}: {
  open: boolean;
  fileName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const addChecklist = useTemplatesStore((s) => s.addChecklist);

  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"confirm" | "extracting">("confirm");

  // Seed the name + reset the phase when a new file opens the wizard. This is the
  // documented "adjust state during render" pattern (React docs: storing info
  // from previous renders) — a state-syncing effect would both lint-error and lag
  // a frame; a key-remount would kill the close animation.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (open && fileName && fileName !== seededFor) {
    setSeededFor(fileName);
    setName(nameFromFile(fileName));
    setPhase("confirm");
  }

  const close = () => {
    setPhase("confirm");
    onClose();
  };

  // Extraction finished → persist the draft + hand off to the details page for
  // review/edit/first-publish. Stable via ref so the timer never restarts.
  const finishExtract = async () => {
    const created = await addChecklist({
      name: name.trim() || nameFromFile(fileName) || "Untitled checklist",
      sourceFile: fileName || "uploaded.docx",
      items: sampleExtract(),
    });
    setPhase("confirm");
    onClose();
    router.push(`/configure/checklists/${created.id}`);
  };

  // Esc closes only from the confirm phase (never mid-extraction).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "confirm") close();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="spm spm--solo"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="New compliance checklist"
        >
          <header className="spm-head">
            <div style={{ flex: 1 }}>
              <div className="spm-title">New compliance checklist</div>
            </div>
            {phase === "confirm" && (
              <IconButton name="close" onClick={close} aria-label="Close" />
            )}
          </header>

          <div className="spm-main">
            <div className="spm-body">
              <div className="spm-content scroll">
                <div className="spm-content-inner">
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "confirm" ? (
                      <motion.div
                        key="confirm"
                        className="ckw-step ckw-confirm"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="ckw-confirm-lead">
                          Confirm the file and name, then Parachute extracts and maps each
                          item for you to review.
                        </div>

                        {/* The already-captured file. */}
                        <div className="ckw-file">
                          <span className="ckw-file-ic" aria-hidden="true">
                            <Icon name="document" size={18} />
                          </span>
                          <span className="ckw-file-name">
                            {fileName || "Checklist file"}
                          </span>
                          <span className="ckw-file-tag">
                            <Icon name="check-circle" size={15} /> ready
                          </span>
                        </div>

                        <div className="tpl-field" style={{ marginTop: 20 }}>
                          <Label htmlFor="ckw-name">Checklist name</Label>
                          <Input
                            id="ckw-name"
                            value={name}
                            placeholder="e.g. Demo Bank — Commercial Review Form"
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="extracting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ExtractProgress fileName={fileName} onDone={finishExtract} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {phase === "confirm" && (
            <footer className="spm-foot">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                iconRight="chevron-right"
                onClick={() => setPhase("extracting")}
                disabled={!name.trim()}
              >
                Extract &amp; review
              </Button>
            </footer>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------- Extraction progress ----------------------------- */

const RUN_WRAP_V = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const RUN_ITEM_V = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
} as const;

/** The extraction beat — the review pipeline's staged-progress visual
 *  (`.run-progress`), reused verbatim so it reads as the same processing moment. */
function ExtractProgress({
  fileName,
  onDone,
}: {
  fileName: string;
  onDone: () => void;
}) {
  const [stage, setStage] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timers = EXTRACT_STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), STAGE_MS * (i + 1)),
    );
    const done = setTimeout(() => doneRef.current(), STAGE_MS * EXTRACT_STAGES.length + 600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  return (
    <div className="run-progress">
      <motion.div
        className="run-progress-inner"
        variants={RUN_WRAP_V}
        initial="hidden"
        animate="show"
      >
        <motion.div className="run-scan" variants={RUN_ITEM_V} aria-hidden="true">
          <span className="run-scan-glow" />
          <Icon name="scan" size={30} />
          <span className="run-scan-line" />
        </motion.div>

        <motion.h2 className="run-progress-title" variants={RUN_ITEM_V}>
          Extracting your checklist…
        </motion.h2>
        {fileName && (
          <motion.p className="run-progress-doc" variants={RUN_ITEM_V}>
            {fileName}
          </motion.p>
        )}

        <motion.div
          className="run-stages"
          variants={RUN_ITEM_V}
          role="status"
          aria-live="polite"
        >
          {EXTRACT_STAGES.map((label, i) => {
            const done = i < stage;
            const active = i === stage;
            const state = done ? "done" : active ? "active" : "idle";
            return (
              <div key={label} className={`run-st run-st--${state}`}>
                <div className="run-st-row">
                  <span className="run-st-label">{label}</span>
                  <span className="run-st-ind">
                    <AnimatePresence initial={false}>
                      {done ? (
                        <motion.span
                          key="done"
                          className="run-st-check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 24 }}
                        >
                          <Icon name="check-circle" size={18} />
                        </motion.span>
                      ) : active ? (
                        <motion.span
                          key="active"
                          className="run-st-dot"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: [1, 0.6, 1], opacity: [1, 0.5, 1] }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <motion.span
                          key="idle"
                          className="run-st-ring"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </span>
                </div>
                <span className="run-st-bar">
                  <motion.span
                    className="run-st-bar-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: done || active ? "100%" : "0%" }}
                    transition={{
                      duration: active ? STAGE_MS / 1000 : done ? 0.3 : 0.2,
                      ease: active ? "easeInOut" : "easeOut",
                    }}
                  />
                </span>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
