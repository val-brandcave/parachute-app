"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, AnimatePresence, motion } from "framer-motion";
import { Callout } from "@realwired/ui";
import { ProgressBar } from "@/components/atoms";
import { cn } from "@/lib/utils";
import {
  cardHeight,
  cardMove,
  dist,
  dur,
  ease,
  takeHandoff,
  useMotionMode,
  type Dir,
  type Handoff,
} from "@/lib/motion";
import { STAGE_ORG_ID, useOrgStore } from "@/store/org.store";
import type { OrgKind } from "@/types";
import { SetupInterstitial, type InterstitialPath } from "./SetupInterstitial";
import { StepPanel, type PanelStep } from "./StepPanel";
import "./onboarding.css";

/* ------------------------------------------------------------------ steps */

/** /welcome = step 0; /welcome/invite and /welcome/call = step 1 (motion-spec §3.5). */
function stepOf(pathname: string): PanelStep {
  if (pathname.startsWith("/welcome/invite")) return "invite";
  if (pathname.startsWith("/welcome/call")) return "call";
  return "setup";
}
const STEP_INDEX: Record<PanelStep, number> = { setup: 0, invite: 1, call: 1 };
const STEP_COUNT = 2;

/** The org the onboarding flow is building (PC-19), or the stage default before it exists. */
const STAGE_ORG_NAME = "Harbor Community Bank";

/** Exit-before-push never waits longer than this, even if an animation never reports back. */
const EXIT_TIMEOUT_MS = 400;
/** T2: content and panel join the moving card after this delay (motion-spec §3.4). */
const T2_JOIN_MS = 120;
/** T2 lands by this time even if framer never reports the layout animation done. */
const T2_MAX_MS = (dur.slow + dur.standard) * 1000;

/** Motion tokens handed to onboarding.css as custom properties, so CSS keyframes
 *  use the same numbers as framer (lib/motion stays the single source). */
const CSS_MOTION = {
  "--onb-dur-quick": `${dur.quick}s`,
  "--onb-dur-standard": `${dur.standard}s`,
  "--onb-dur-fill": `${dur.fill}s`,
  "--onb-ease-standard": `cubic-bezier(${ease.standard.join(",")})`,
  "--onb-ease-enter": `cubic-bezier(${ease.enter.join(",")})`,
} as React.CSSProperties;

/* ---------------------------------------------------------------- context */

type T2Phase = "rest" | "first" | "moving";

interface FrameContext {
  /** Direction of the step change that brought the current content in. */
  dir: Dir;
  /** Direction the current content leaves in (set by `go` before the push). */
  exitDir: Dir;
  /** True once any step change has happened in this frame (direct loads render at rest). */
  navigated: boolean;
  /** The current content should play its exit (exit-before-push). */
  exiting: boolean;
  /** T2 hand-off in progress: content waits in its enter pose until `contentIn`. */
  handoff: boolean;
  contentIn: boolean;
  go: (href: string, dir: Dir) => Promise<void>;
  /** Called by the step content when its exit animation completes. */
  exitDone: () => void;
  /** T4: swap the steps for the interstitial, which runs `work` and then leaves for Get started. */
  finish: (path: InterstitialPath, work: () => Promise<void>) => void;
  /** Org setup reports the live "You are a" answer so the panel copy follows it. */
  setKind: (kind: OrgKind) => void;
}

const Ctx = createContext<FrameContext | null>(null);

/** The onboarding frame's controls. Null outside `OnboardingFrame`. */
export function useOnboardingFrame(): FrameContext | null {
  return useContext(Ctx);
}

/* ---------------------------------------------------------- view param */

const noopSubscribe = () => () => {};
/** `?view=interstitial&path=…` (prototype only, motion-spec §5): read without an effect,
 *  and "" on the server so hydration matches. */
function useViewParam(): { view: string | null; path: string | null } {
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => {
    const q = new URLSearchParams(search);
    return { view: q.get("view"), path: q.get("path") };
  }, [search]);
}

function interstitialPathFromParam(p: string | null): InterstitialPath {
  if (p === "enterprise" || p === "enterprise_booked") return "enterprise_booked";
  if (p === "enterprise_later") return "enterprise_later";
  return "self_serve";
}

/* ------------------------------------------------------------------ frame */

/**
 * The persistent /welcome frame (spec §5.1 option C, motion-spec §2–§5): one centred
 * card under a 2-segment progress bar, with a side panel beside it whose content
 * follows the step (from `usePathname()`, so it can cross-fade on its own).
 *
 * - Card height is measured (ResizeObserver on the inner box) and glides with
 *   `cardHeight`; flexbox centring makes the card and the panel glide with it (T3).
 * - Step changes go through `useStepNav().go()`: the content exits, then the push;
 *   `welcome/template.tsx` plays the enter. Browser back gets enter only (T3b).
 * - A verify hand-off (`takeHandoff()`) starts the card at the verify card's rect
 *   and moves it into the left column, then the panel enters (T2).
 * - `finish()` swaps to the "Setting up your workspace" interstitial (T4, PC-26).
 */
export function OnboardingFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/welcome";
  const router = useRouter();
  const motionMode = useMotionMode();
  const full = motionMode === "full";
  const step = stepOf(pathname);

  /* --- navigation state, adjusted during render when the path changes --- */
  const [nav, setNav] = useState({
    path: pathname,
    dir: 1 as Dir,
    navigated: false,
    exiting: false,
    pendingDir: null as Dir | null,
  });
  if (nav.path !== pathname) {
    const back = STEP_INDEX[stepOf(pathname)] < STEP_INDEX[stepOf(nav.path)];
    setNav({
      path: pathname,
      dir: nav.pendingDir ?? (back ? -1 : 1),
      navigated: true,
      exiting: false,
      pendingDir: null,
    });
  }

  const exitResolve = useRef<(() => void) | null>(null);
  const exitDone = useCallback(() => {
    exitResolve.current?.();
    exitResolve.current = null;
  }, []);
  const inFlight = useRef(false);
  const go = useCallback(
    async (href: string, d: Dir) => {
      // One step change at a time; never push the page we're on (no duplicate history entries).
      if (inFlight.current || href === pathname) return;
      inFlight.current = true;
      setNav((s) => ({ ...s, exiting: true, pendingDir: d }));
      await new Promise<void>((resolve) => {
        const safety = window.setTimeout(resolve, EXIT_TIMEOUT_MS);
        exitResolve.current = () => {
          window.clearTimeout(safety);
          resolve();
        };
      });
      exitResolve.current = null;
      router.push(href);
    },
    [router, pathname],
  );
  // The push landed (or browser navigation happened): accept the next step change.
  useEffect(() => {
    inFlight.current = false;
  }, [pathname]);

  /* --- interstitial (T4) --- */
  const viewParam = useViewParam();
  const [finishing, setFinishing] = useState<{ path: InterstitialPath; work: () => Promise<void> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const finish = useCallback((path: InterstitialPath, work: () => Promise<void>) => {
    setError(null);
    setFinishing({ path, work });
  }, []);
  const onFail = useCallback(() => {
    setFinishing(null);
    setError("We couldn't finish setting up your workspace. Try again.");
  }, []);
  const previewLoop = viewParam.view === "interstitial";
  const interstitial = previewLoop
    ? { path: interstitialPathFromParam(viewParam.path), work: resolved, loop: true }
    : finishing
      ? { ...finishing, loop: false }
      : null;

  /* --- panel copy inputs --- */
  const [formKind, setKind] = useState<OrgKind>("bank");
  const org = useOrgStore((s) => s.org);
  const stageOrg = org?.id === STAGE_ORG_ID ? org : null;
  const orgName = stageOrg?.name ?? STAGE_ORG_NAME;
  const kind = step === "setup" ? formKind : stageOrg?.profile?.kind ?? formKind;
  const booked = step === "call" && stageOrg?.profile?.callBookedAt !== undefined;

  /* --- T2: matching first frame from the verify hand-off --- */
  const [t2, setT2] = useState<{ phase: T2Phase; rect: Handoff["rect"] | null; contentIn: boolean }>({
    phase: "rest",
    rect: null,
    contentIn: true,
  });
  const handoffRead = useRef(false);
  useLayoutEffect(() => {
    if (handoffRead.current) return;
    handoffRead.current = true;
    const h = takeHandoff();
    if (!h || h.from !== "verify" || !full) return;
    // One-shot, before paint: render the first frame at the verify card's rect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setT2({ phase: "first", rect: h.rect, contentIn: false });
  }, [full]);
  useEffect(() => {
    if (t2.phase !== "first") return;
    // Two frames: the first frame paints at the hand-off rect before the move starts.
    let raf = window.requestAnimationFrame(() => {
      raf = window.requestAnimationFrame(() => setT2((s) => ({ ...s, phase: "moving" })));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [t2.phase]);
  useEffect(() => {
    if (t2.phase !== "moving") return;
    const t = window.setTimeout(() => setT2((s) => ({ ...s, contentIn: true })), T2_JOIN_MS);
    // Safety net: if the layout animation never reports completion, land anyway.
    const land = window.setTimeout(() => setT2({ phase: "rest", rect: null, contentIn: true }), T2_MAX_MS);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(land);
    };
  }, [t2.phase]);
  /* T2 move: a FLIP from the hand-off rect to the card's place in the left column.
     One tween drives the card's translate + scale and the inner box's inverse scale,
     so the content keeps its proportions while the card grows (no stretched text). */
  useLayoutEffect(() => {
    if (t2.phase !== "moving" || !t2.rect) return;
    const card = cardRef.current;
    const inner = innerRef.current;
    if (!card || !inner) return;
    const to = card.getBoundingClientRect();
    const from = t2.rect;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    card.style.transformOrigin = "0 0";
    inner.style.transformOrigin = "0 0";
    const paint = (t: number) => {
      const kx = sx + (1 - sx) * t;
      const ky = sy + (1 - sy) * t;
      card.style.transform = `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px) scale(${kx}, ${ky})`;
      inner.style.transform = `scale(${1 / kx}, ${1 / ky})`;
    };
    paint(0);
    const clear = () => {
      card.style.transform = "";
      inner.style.transform = "";
      card.style.transformOrigin = "";
      inner.style.transformOrigin = "";
    };
    const move = animate(0, 1, {
      ...cardMove,
      onUpdate: paint,
      onComplete: () => {
        clear();
        setT2({ phase: "rest", rect: null, contentIn: true });
      },
    });
    return () => {
      move.stop();
      clear();
    };
  }, [t2.phase, t2.rect]);

  /* --- measured card height (§3.2) ---
     The inner box is observed; the card's content-box height is pinned to it and,
     at rest with full motion, animated from its current height (framer `animate`,
     imperative so the start value is always the real one). During T2 it is auto. */
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glide = useRef<{ stop: () => void } | null>(null);
  const live = useRef({ rest: true, full });
  useLayoutEffect(() => {
    live.current = { rest: t2.phase === "rest", full };
  });
  const [gliding, setGliding] = useState(false);
  const stepsMounted = !interstitial;
  /* Glide only across a step change (new pathname, or the steps remounting). In-step
     growth (callout reveal, inline error, window resize) follows the content directly,
     so the card never lags behind it and clips the button. A glide already running
     retargets, so late ticks of the same step change stay smooth. */
  const glideArmed = useRef(false);
  useLayoutEffect(() => {
    glideArmed.current = true;
  }, [pathname, stepsMounted]);
  const pinHeight = useCallback((h: number) => {
    const card = cardRef.current;
    if (!card) return;
    const running = glide.current !== null;
    glide.current?.stop();
    glide.current = null;
    if (!live.current.rest) return; // T2 owns the size until it lands
    const from = card.clientHeight;
    const stepChange = glideArmed.current || running;
    glideArmed.current = false;
    if (!stepChange || !live.current.full || !card.style.height || Math.abs(from - h) < 1) {
      pinPx(card, h);
      setGliding(false);
      return;
    }
    setGliding(true);
    const anim = animate(card, { height: [from, h] }, cardHeight);
    glide.current = anim;
    void anim.then(() => {
      if (glide.current === anim) {
        glide.current = null;
        setGliding(false);
      }
    });
  }, []);
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.borderBoxSize?.[0];
      pinHeight(box ? box.blockSize : el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stepsMounted, pinHeight]);
  // Leaving T2: pin the height the card arrived at.
  useLayoutEffect(() => {
    if (t2.phase === "rest" && innerRef.current) pinHeight(innerRef.current.offsetHeight);
  }, [t2.phase, pinHeight]);

  /* --- progress: which segment is filling right now (CSS keyframe, tokens via vars) --- */
  const filled = STEP_INDEX[step] + 1;
  const fillingSeg = !full ? null : t2.phase !== "rest" ? 0 : nav.navigated && nav.dir === 1 && filled === STEP_COUNT ? 1 : null;

  const ctx = useMemo<FrameContext>(
    () => ({
      dir: nav.dir,
      exitDir: nav.pendingDir ?? nav.dir,
      navigated: nav.navigated,
      exiting: nav.exiting,
      handoff: t2.phase !== "rest",
      contentIn: t2.contentIn,
      go,
      exitDone,
      finish,
      setKind,
    }),
    [nav, t2.phase, t2.contentIn, go, exitDone, finish],
  );

  const first = t2.phase === "first";
  const rest = t2.phase === "rest";
  const cardStyle: React.CSSProperties | undefined =
    first && t2.rect
      ? {
          position: "fixed",
          top: t2.rect.top,
          left: t2.rect.left,
          width: t2.rect.width,
          height: t2.rect.height,
          overflow: "hidden",
          margin: 0,
        }
      : !rest || gliding
        ? { overflow: "hidden" }
        : undefined;

  return (
    <Ctx.Provider value={ctx}>
      <div className="onb" style={CSS_MOTION}>
        <AnimatePresence mode="wait" initial={false}>
          {interstitial ? (
            <motion.div
              key="interstitial"
              className="onb-inter-wrap"
              initial={{ opacity: 0, y: full ? dist.enter : 0 }}
              animate={{ opacity: 1, y: 0, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.enter } }}
            >
              <SetupInterstitial
                path={interstitial.path}
                work={interstitial.work}
                loop={interstitial.loop}
                onFail={onFail}
              />
            </motion.div>
          ) : (
            <motion.div
              key="steps"
              className="onb-steps"
              exit={{
                opacity: 0,
                scale: full ? 0.98 : 1,
                transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.exit },
              }}
            >
              <>
                <div ref={cardRef} className="onb-card" style={cardStyle}>
                  <div ref={innerRef} className="onb-card-in">
                    <div
                      className={cn(
                        "onb-progress-wrap",
                        first && "onb-hidden",
                        fillingSeg !== null && `is-filling-${fillingSeg}`,
                      )}
                    >
                      <ProgressBar
                        className="onb-progress"
                        label={`Step ${filled} of ${STEP_COUNT}`}
                        segments={Array.from({ length: STEP_COUNT }, (_, i) => ({ filled: i < filled }))}
                      />
                      {fillingSeg !== null && (
                        <span
                          key={`fill-${fillingSeg}-${pathname}`}
                          className="onb-progress-fill"
                          data-seg={fillingSeg}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {error && (
                      <div className="onb-error">
                        <Callout tone="danger">{error}</Callout>
                      </div>
                    )}
                    {/* T2 first frame: an empty card; the content joins once the move starts. */}
                    <div className={first ? "onb-hidden" : undefined}>{children}</div>
                  </div>
                </div>

                {!first && (
                  <motion.aside
                    className="onb-panel"
                    aria-label="About this step"
                    initial={t2.phase === "moving" ? { opacity: 0, x: dist.panel } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: T2_JOIN_MS / 1000, duration: dur.standard, ease: ease.enter }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={`${step}-${booked ? "booked" : "open"}`}
                        className="onb-panel-body"
                        initial={{ opacity: 0, y: full ? dist.lift : 0 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.enter },
                        }}
                        exit={{
                          opacity: 0,
                          y: full ? -dist.lift : 0,
                          transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.exit },
                        }}
                      >
                        <StepPanel step={step} kind={kind} orgName={orgName} booked={booked} />
                      </motion.div>
                    </AnimatePresence>
                  </motion.aside>
                )}
              </>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

/** Imperative height pin (outside the component so the compiler doesn't treat it as a ref write in render scope). */
function pinPx(el: HTMLElement, h: number): void {
  el.style.height = `${h}px`;
}

function resolved(): Promise<void> {
  return Promise.resolve();
}
