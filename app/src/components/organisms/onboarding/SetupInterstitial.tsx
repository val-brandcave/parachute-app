"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimate } from "framer-motion";
import { Icon, Logo } from "@/components/atoms";
import { dur, ease, markArrival, useMotionMode } from "@/lib/motion";
import { TRIAL_GRANT_CREDITS } from "@/lib/pricing";
import { STAGE_ORG_ID, useOrgStore } from "@/store/org.store";
import { orgShortName } from "./StepPanel";

export type InterstitialPath = "self_serve" | "enterprise_booked" | "enterprise_later";

/* Timing (motion-contract "Interstitial", motion-spec §5), in ms. */
const LINE_AT = [500, 1000, 1500];
/** Hold after the last check, then T5. */
const HOLD_MS = 300;
/** Never longer than this: Get started shows its own skeleton if the data is late. */
const MAX_MS = 2400;
/** Reduced motion / motion off: the finished list, held this long. */
const REDUCED_HOLD_MS = 600;

const FALLBACK_ORG = "Harbor Community Bank";
const GET_STARTED = "/get-started";

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * "Setting up your workspace" (PC-26): state inside the onboarding frame, not a
 * route. A centred column with no card: logo mark, title, a checklist that ticks
 * on schedule (the last line also waits for `work`), and a thin bar. Then it fades,
 * marks the arrival (Get started fires the self-serve confetti) and goes to
 * `/get-started`. If `work` rejects, `onFail` returns the frame to the step.
 * `loop` (the `?view=interstitial` prototype view) replays and never navigates.
 */
export function SetupInterstitial({
  path,
  work,
  loop = false,
  onFail,
}: {
  path: InterstitialPath;
  work: () => Promise<void>;
  loop?: boolean;
  onFail?: (err: unknown) => void;
}) {
  const router = useRouter();
  const org = useOrgStore((s) => s.org);
  const mode = useMotionMode();
  const instant = mode !== "full";
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The org onboarding just built (PC-19); the stage default before it exists.
  const stage = org?.id === STAGE_ORG_ID ? org : null;
  const name = stage?.name ?? FALLBACK_ORG;
  const slot = stage?.profile?.callSlot;
  const title = path === "enterprise_booked" ? `Getting ${orgShortName(name)} ready for your call` : `Setting up ${name}`;
  const lines =
    path === "self_serve"
      ? ["Creating your organization", `Adding your ${TRIAL_GRANT_CREDITS} trial credits`, "Preparing your setup guide"]
      : path === "enterprise_booked"
        ? ["Creating your organization", slot ? `Booking ${slot}` : "Booking your setup call", "Preparing your setup guide"]
        : ["Creating your organization", "Preparing your setup guide"];
  const count = lines.length;
  const lastAt = LINE_AT[count - 1];
  const barSeconds = (lastAt + HOLD_MS) / 1000;

  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(instant ? count : 0);

  // Latest callbacks for the one-shot schedule below (written after commit, read in timers).
  const latest = useRef({ work, onFail, loop });
  useEffect(() => {
    latest.current = { work, onFail, loop };
  });

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    let alive = true;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => alive && fn(), ms));

    let failed = false;
    const workDone = latest.current.work().catch((err) => {
      failed = true;
      if (alive) latest.current.onFail?.(err);
    });

    let left = false;
    const leave = async () => {
      if (!alive || failed || left) return;
      left = true;
      if (latest.current.loop) {
        later(() => {
          setDone(instant ? count : 0);
          setCycle((c) => c + 1);
        }, HOLD_MS * 3);
        return;
      }
      markArrival({ path: path === "self_serve" ? "self_serve" : "enterprise", at: Date.now() });
      if (scope.current) {
        await animate(
          scope.current,
          { opacity: 0 },
          { duration: instant ? dur.reducedFade : dur.standard, ease: ease.exit },
        );
      }
      if (alive) router.push(GET_STARTED);
    };

    const ceiling = window.setTimeout(() => void leave(), MAX_MS);
    timers.push(ceiling);

    if (instant) {
      void Promise.all([workDone, wait(REDUCED_HOLD_MS)]).then(() => {
        window.clearTimeout(ceiling);
        void leave();
      });
    } else {
      LINE_AT.slice(0, count - 1).forEach((at, i) => later(() => setDone((d) => Math.max(d, i + 1)), at));
      void Promise.all([workDone, wait(lastAt)]).then(() => {
        if (!alive || failed) return;
        setDone(count);
        later(() => {
          window.clearTimeout(ceiling);
          void leave();
        }, HOLD_MS);
      });
    }

    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
    // One schedule per mount (and per preview loop); the inputs are read from `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  return (
    <div ref={scope} className="onb-inter">
      <Logo full={false} height={36} themeAware />
      <h1 ref={titleRef} tabIndex={-1} className="onb-inter-title">
        {title}
      </h1>
      <ul className="onb-inter-list" role="status" aria-live="polite">
        {lines.map((line, i) => {
          const ok = i < done;
          return (
            <li key={line} className={ok ? "is-done" : undefined}>
              <span className="onb-inter-mark" aria-hidden="true">
                {ok ? <Icon name="check" size={14} /> : <span className="ui-spinner onb-spin" />}
              </span>
              <span>
                {line}
                {ok && <span className="ui-visually-hidden">, done</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="onb-inter-bar" aria-hidden="true">
        <motion.span
          key={cycle}
          className="onb-inter-fill"
          initial={{ scaleX: instant ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: instant ? 0 : barSeconds, ease: ease.linear }}
        />
      </div>
    </div>
  );
}
