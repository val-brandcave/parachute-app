"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { Callout } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { dist, dur, ease, useMotionMode } from "@/lib/motion";
import { RoutingNote } from "@/components/organisms/prototype/RoutingNote";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import { cn } from "@/lib/utils";
import type { OrgKind, TeamBand, VolumeBand } from "@/types";

export interface OrgSetupOption<T extends string> {
  value: T;
  label: string;
}

const SHAKE = [0, -dist.shake, dist.shake, -dist.shake, dist.shake, 0];

/**
 * Org setup (step 1 of 2, spec §5.1): organization name, what you are, and two
 * size bands. The route is live: crossing the enterprise threshold reveals the
 * "short call" callout, marks the answer that triggered it and relabels the
 * button, all without submitting. Submit is never `disabled`: an empty name shows
 * an inline error, shakes the field and focuses it.
 */
export function OrgSetupForm({
  name,
  onName,
  nameError = null,
  shake = 0,
  kind,
  onKind,
  team,
  onTeam,
  volume,
  onVolume,
  kindOptions,
  teamOptions,
  volumeOptions,
  route,
  trigger,
  unsure,
  busy = false,
  formError = null,
  onSubmit,
}: {
  name: string;
  onName: (v: string) => void;
  /** Inline error under the name field (set on submit). */
  nameError?: string | null;
  /** Bumped on each failed submit: shakes and focuses the name field. */
  shake?: number;
  kind: OrgKind;
  onKind: (v: OrgKind) => void;
  team: TeamBand;
  onTeam: (v: TeamBand) => void;
  volume: VolumeBand;
  onVolume: (v: VolumeBand) => void;
  kindOptions: OrgSetupOption<OrgKind>[];
  teamOptions: OrgSetupOption<TeamBand>[];
  volumeOptions: OrgSetupOption<VolumeBand>[];
  /** Live route from `routeForProfile`. */
  route: "self_serve" | "enterprise";
  /** Which answers crossed the threshold (petrol marker). */
  trigger: { team: boolean; volume: boolean };
  /** "I'm not sure yet": self-serve, with a note that a call is on offer later. */
  unsure: boolean;
  busy?: boolean;
  formError?: string | null;
  onSubmit: () => void;
}) {
  const mode = useMotionMode();
  const full = mode === "full";
  const enterprise = route === "enterprise";
  const inputRef = useRef<HTMLInputElement>(null);
  const [fieldScope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (shake === 0) return;
    inputRef.current?.focus();
    if (full && fieldScope.current) {
      void animate(fieldScope.current, { x: SHAKE }, { duration: dur.shake, ease: ease.standard });
    }
  }, [shake, full, animate, fieldScope]);

  const reveal = {
    initial: { height: 0, opacity: 0, y: full ? dist.lift : 0 },
    animate: {
      height: "auto",
      opacity: 1,
      y: 0,
      transition: {
        height: { duration: full ? dur.standard : 0, ease: ease.standard },
        opacity: { duration: full ? dur.standard : dur.reducedFade, ease: ease.standard, delay: full ? dur.quick : 0 },
        y: { duration: dur.standard, ease: ease.standard, delay: full ? dur.quick : 0 },
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: full ? dur.standard : 0, ease: ease.standard },
        opacity: { duration: full ? dur.standard : dur.reducedFade, ease: ease.standard },
      },
    },
  };

  const label = enterprise ? "Book a call" : "Continue to Parachute";

  // Fill wand: Self-serve answers (2-10 reviewers, under 50 reports). Shift-wand: Enterprise (11+, 200+).
  // Never submits; the route note and button flip live.
  useProtoFill("welcome", {
    valid: () => {
      if (!name.trim()) onName("Harbor Community Bank");
      onTeam("2-10");
      onVolume("lt50");
    },
    invalid: () => {
      if (!name.trim()) onName("Harbor Community Bank");
      onTeam("11+");
      onVolume("200+");
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h1 className="wel-title onb-title">Set up your organization</h1>
      <p className="wel-sub onb-sub">Three quick answers, then you&apos;re in.</p>

      <div ref={fieldScope} className={cn("field onb-field", nameError && "is-invalid")}>
        <label htmlFor="wel-org">Organization name</label>
        <input
          ref={inputRef}
          id="wel-org"
          autoComplete="organization"
          value={name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "wel-org-err" : undefined}
          onChange={(e) => onName(e.target.value)}
        />
        <AnimatePresence initial={false}>
          {nameError && (
            <motion.p key="err" id="wel-org-err" className="onb-field-err" role="alert" {...reveal}>
              {nameError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="wel-q">
        <span className="wel-lb">You are a</span>
        <SegmentedControl press block label="You are a" options={kindOptions} value={kind} onChange={onKind} />
      </div>
      <div className={cn("wel-q onb-q", trigger.team && "is-trigger")}>
        <span className="wel-lb">How many people will review reports?</span>
        <SegmentedControl press block label="Reviewers" options={teamOptions} value={team} onChange={onTeam} />
      </div>
      <div className={cn("wel-q onb-q", trigger.volume && "is-trigger")}>
        <span className="wel-lb">Reports a month, roughly</span>
        <SegmentedControl press block label="Reports a month" options={volumeOptions} value={volume} onChange={onVolume} />
      </div>

      <AnimatePresence initial={false}>
        {enterprise && (
          <motion.div key="sales" className="onb-reveal" {...reveal}>
            <div className="onb-callout">
              <Callout tone="info" icon="calendar">
                <strong>Teams your size start with a short call</strong>
                <br />
                We&apos;ll set up your policy and checklist with you, then open your trial credits.
              </Callout>
            </div>
          </motion.div>
        )}
        {!enterprise && unsure && (
          <motion.div key="unsure" className="onb-reveal" {...reveal}>
            <p className="onb-note">We&apos;ll offer a call later if you need one.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {formError && (
        <p className="onb-field-err onb-form-err" role="alert">
          {formError}
        </p>
      )}

      {/* DS-candidate: Button label swap (cross-fade with a sliding leading icon, width held) — @realwired/ui Button has no animated label. */}
      <Button type="submit" size="lg" block busy={busy} className="onb-submit">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className="onb-submit-lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.standard } }}
            exit={{ opacity: 0, transition: { duration: full ? dur.quick : dur.reducedFade, ease: ease.exit } }}
          >
            {enterprise && (
              <motion.span
                className="onb-submit-ic"
                initial={{ x: full ? -dist.icon : 0 }}
                animate={{ x: 0, transition: { duration: dur.standard, ease: ease.standard } }}
              >
                <Icon name="calendar" size={17} />
              </motion.span>
            )}
            {label}
          </motion.span>
        </AnimatePresence>
      </Button>
      <RoutingNote profile={{ teamBand: team, volumeBand: volume }} />
    </form>
  );
}
