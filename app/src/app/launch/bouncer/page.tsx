"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, Logo, ParachuteGlyph } from "@/components/atoms";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { safeReturn } from "../../bouncer/return-path";
import "../../bouncer/bouncer.css";

/**
 * G1: the bridge from Parachute to Realwired Admin (Bouncer), where members,
 * roles and SSO live. Same visual language as the `/launch` YouConnect handoff
 * (`.hf*`, `.run-st*` classes), with the two peers Parachute and Realwired Admin.
 * The first two steps tick on their own; the last waits for Continue.
 *
 * Backend: until the customer area exists, Continue sends a request to
 * Realwired staff instead of opening a live admin session.
 */
function BouncerBridge() {
  const router = useRouter();
  const params = useSearchParams();
  const me = useCurrentUser();
  const org = useCurrentOrg();
  const to = params.get("to") ?? "members";
  const back = safeReturn(params.get("return"));

  const steps = [
    "Opening Realwired Admin",
    `Signed in as ${me.name}`,
    `Members & roles for ${org.name}`,
  ];

  const [step, setStep] = useState(0); // 3 = all done
  const [leaving, setLeaving] = useState(false);
  const ready = step >= 2;
  const done = step >= steps.length;

  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 1500)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const go = () => {
    if (done) return;
    setStep(3);
    setTimeout(() => setLeaving(true), 650);
    setTimeout(() => router.push(`/bouncer?to=${encodeURIComponent(to)}&return=${encodeURIComponent(back)}`), 1100);
  };

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="hf bx-hf"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <div className="bx-hf-top">
            <Logo full height={25} themeAware />
          </div>

          <motion.div
            className="hf-inner"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <div className="hf-bridge">
              <div className="hf-brand">
                <span className="hf-brand-mark">
                  <ParachuteGlyph size={30} />
                </span>
                <span className="hf-brand-name">Parachute</span>
              </div>

              <div className="hf-track bx-track" aria-hidden="true">
                <span className="hf-track-line" />
                <span className="bx-track-chip">
                  <Icon name="users" size={14} />
                  Members &amp; roles
                </span>
              </div>

              <div className="hf-brand">
                <span className="hf-brand-mark">
                  <Icon name="shield" size={26} />
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
                <span className="hf-brand-name">Realwired Admin</span>
              </div>
            </div>

            <div className="run-stages hf-stages bx-stages" role="status" aria-live="polite">
              {steps.map((label, i) => {
                const isDone = i < step;
                const isActive = i === step;
                const state = isDone ? "done" : isActive ? "active" : "idle";
                return (
                  <div key={label} className={`run-st run-st--${state}`}>
                    <div className="run-st-row">
                      <span className="run-st-label">{label}</span>
                      <span className="run-st-ind">
                        <AnimatePresence initial={false}>
                          {isDone ? (
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
                          ) : isActive ? (
                            <motion.span
                              key="active"
                              className="run-st-dot"
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: [1, 0.6, 1], opacity: [1, 0.5, 1] }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            />
                          ) : (
                            <motion.span key="idle" className="run-st-ring" />
                          )}
                        </AnimatePresence>
                      </span>
                    </div>
                    <span className="run-st-bar">
                      <motion.span
                        className="run-st-bar-fill"
                        initial={{ width: "0%" }}
                        animate={{ width: isDone ? "100%" : isActive ? (ready ? "42%" : "100%") : "0%" }}
                        transition={{ duration: isActive ? 0.85 : 0.3, ease: "easeInOut" }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bx-hf-copy">
              <p className="bx-hf-note">
                Members, roles and SSO live in Realwired Admin. You&rsquo;ll come back here when you&rsquo;re done.
              </p>
              <Button size="lg" iconRight="forward" onClick={go} disabled={!ready || done}>
                Continue
              </Button>
              <span className="bx-hf-chip">
                <Icon name="info" size={13} />
                Until the customer area exists, this sends a request to Realwired staff
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function BouncerBridgePage() {
  return (
    <Suspense fallback={null}>
      <BouncerBridge />
    </Suspense>
  );
}
