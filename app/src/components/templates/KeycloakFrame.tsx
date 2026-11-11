"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { useBuildNotes } from "@/store/prefs.store";
import { Icon, Logo } from "@/components/atoms";
import {
  cardHeight,
  dist,
  dur,
  ease,
  motionModeNow,
  takeHandoff,
  useMotionMode,
  useStepVariants,
  type Dir,
  type Handoff,
} from "@/lib/motion";

/** Shake an element ±6 px twice (validation on click, motion-spec §4). Full motion only; reduced keeps the outline and the message. */
export function shakeEl(el: HTMLElement | null): void {
  if (!el || motionModeNow() !== "full") return;
  const s = dist.shake;
  animate(el, { x: [0, -s, s, -s, s, 0] }, { duration: dur.shake, ease: ease.standard });
}

type Frame = {
  /** Runs the content exit (150 ms) and resolves when it is done. Call before `router.push`. */
  exit: (dir?: Dir) => Promise<void>;
  /** The `.kc-card` rect, for `setHandoff`. */
  cardRect: () => Handoff["rect"] | null;
};

const FrameContext = createContext<Frame>({ exit: () => Promise.resolve(), cardRect: () => null });

/** Exit hook for the form inside a `KeycloakFrame` (T1 and the exit half of T2). */
export function useKeycloakFrame(): Frame {
  return useContext(FrameContext);
}

/**
 * The page Keycloak (CIM) renders in production, themed for Parachute (RWT-1061).
 * Parachute never renders this: the persistent tag says so, so no engineer
 * mistakes it for a Parachute-owned form. Calm canvas, one 420 card.
 *
 * Motion (T1, motion-spec §3.3): the card content exits before navigation and
 * enters from the matching side; the card glides from the handed-off height to
 * its own. A load with no hand-off renders at rest. Encoding of the hand-off
 * here: `from: "signup"` = arriving forward (dir 1), `from: "verify"` = arriving
 * back from verify (dir -1).
 */
export function KeycloakFrame({
  children,
  template,
  below,
  after,
}: {
  children: React.ReactNode;
  /** The Keycloak template this screen themes, e.g. "register.ftl". */
  template?: string;
  /** Content between the secured line and the template chip (e.g. legal text). */
  below?: React.ReactNode;
  /** Content after the template chip (e.g. the demo-accounts disclosure). */
  after?: React.ReactNode;
}) {
  // Engineering annotations (the corner tag, the template name) show only when
  // "Show build notes" is on in the DemoDock. Off by default for demos.
  const buildNotes = useBuildNotes();
  const mode = useMotionMode();
  const variants = useStepVariants();
  const cardRef = useRef<HTMLDivElement>(null);
  const [arrive, setArrive] = useState<{ dir: Dir; height: number } | null>(null);
  const [leave, setLeave] = useState<Dir | null>(null);
  const leaveDone = useRef<(() => void) | null>(null);

  // Read the hand-off once, before paint. Null on a reload or deep link: render at rest.
  useLayoutEffect(() => {
    const h = takeHandoff();
    // One-shot read of an external store (sessionStorage) that cannot run during SSR/hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h) setArrive({ dir: h.from === "signup" ? 1 : -1, height: h.rect.height });
  }, []);

  // Glide the card from the handed-off height to its own (T1). Full motion only.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!arrive || !card || mode !== "full") return;
    card.style.height = "";
    const target = card.getBoundingClientRect().height;
    card.style.height = `${arrive.height}px`;
    card.style.overflow = "hidden";
    const anim = animate(card, { height: target }, cardHeight);
    anim.then(() => {
      card.style.height = "";
      card.style.overflow = "";
    });
    return () => anim.stop();
  }, [arrive, mode]);

  const exit = useCallback((dir: Dir = 1) => {
    return new Promise<void>((resolve) => {
      leaveDone.current = resolve;
      setLeave(dir);
      // Safety net: never strand the navigation on a missed animation callback.
      setTimeout(resolve, dur.quick * 1000 + 250);
    });
  }, []);

  const frame = useMemo<Frame>(
    () => ({
      exit,
      cardRect: () => {
        const r = cardRef.current?.getBoundingClientRect();
        return r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      },
    }),
    [exit],
  );

  return (
    <div className="kc">
      {buildNotes && (
        <div className="kc-tag" role="note">
          <Icon name="info" size={14} />
          Keycloak theme reference · RWT-1061
        </div>
      )}
      <main className="kc-main">
        <div className="kc-card" ref={cardRef}>
          <Logo full height={30} themeAware />
          <FrameContext.Provider value={frame}>
            <motion.div
              key={arrive ? "arrive" : "rest"}
              variants={variants}
              custom={leave ?? arrive?.dir ?? 1}
              initial={arrive ? "enter" : false}
              animate={leave !== null ? "exit" : "center"}
              onAnimationComplete={(def) => {
                if (def === "exit") leaveDone.current?.();
              }}
            >
              {children}
            </motion.div>
          </FrameContext.Provider>
        </div>
        <div className="kc-secure">
          <Icon name="shield" size={14} />
          <span>
            Secured by <b>Realwired ID</b>
          </span>
        </div>
        {below}
        {buildNotes && template && (
          <div className="kc-secure" style={{ marginTop: 8 }} aria-hidden="true">
            <span className="ui-chip">{template}</span>
          </div>
        )}
        {after}
      </main>
      <footer className="kc-foot">
        <span>Realwired</span>
        <span aria-hidden="true">·</span>
        <a href="#help">Help</a>
        <span aria-hidden="true">·</span>
        <a href="#privacy">Privacy</a>
      </footer>
    </div>
  );
}
