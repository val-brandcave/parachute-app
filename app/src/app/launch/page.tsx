"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, YouConnectGlyph, ParachuteGlyph } from "@/components/atoms";

/**
 * SSO handoff / bridge screen (wireframe 1.4 / 2.1) — the "Transferring you to
 * Parachute…" interstitial after a YouConnect SSO pass-through. The two systems
 * sit as peers with a document chip drifting across the bridge between them
 * (the appraisal being handed over); the setup steps tick off; on completion the
 * Parachute mark gets an arrival check and the screen morphs out into the app.
 */
const STEPS = [
  "Establishing secure session",
  "Verifying single sign-on",
  "Loading your reviews",
];

export default function LaunchPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0..STEPS.length (=== length → all done)
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1700),
      setTimeout(() => setStep(3), 2500), // all checked → arrival beat
      setTimeout(() => setLeaving(true), 3100), // morph out
      setTimeout(() => router.push("/dashboard"), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [router]);

  const done = step >= STEPS.length;

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="hf"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <motion.div
            className="hf-inner"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            {/* Bridge: YouConnect → (document in transit) → Parachute */}
            <div className="hf-bridge">
              <div className="hf-brand">
                <span className="hf-brand-mark">
                  <YouConnectGlyph size={26} />
                </span>
                <span className="hf-brand-name">YouConnect</span>
              </div>

              <div className="hf-track" aria-hidden="true">
                <span className="hf-track-line" />
                <motion.span
                  className="hf-doc"
                  initial={{ left: "0%", opacity: 0 }}
                  animate={
                    done
                      ? { left: "100%", opacity: 0 }
                      : { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }
                  }
                  transition={
                    done
                      ? { duration: 0.4, ease: "easeIn" }
                      : { duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.15 }
                  }
                >
                  <Icon name="pdf" size={14} />
                </motion.span>
              </div>

              <div className={`hf-brand hf-brand--dest${done ? " is-arrived" : ""}`}>
                <span className="hf-brand-mark">
                  <ParachuteGlyph size={30} />
                  <AnimatePresence>
                    {done && (
                      <motion.span
                        className="hf-arrive"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 440, damping: 18 }}
                      >
                        <Icon name="check" size={13} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="hf-brand-name">Parachute</span>
              </div>
            </div>

            {/* Setup steps */}
            <ul className="hf-steps">
              {STEPS.map((label, i) => {
                const state = i < step ? "done" : i === step ? "active" : "idle";
                return (
                  <li key={label} className={`hf-step hf-step--${state}`}>
                    <span className="hf-step-ic">
                      {state === "done" ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          style={{ display: "inline-flex" }}
                        >
                          <Icon name="check" size={13} />
                        </motion.span>
                      ) : state === "active" ? (
                        <span className="hf-spinner" />
                      ) : (
                        <span className="hf-dot" />
                      )}
                    </span>
                    <span className="hf-step-label">{label}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
