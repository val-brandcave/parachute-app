"use client";

import { Button, Icon } from "@/components/atoms";
import { StatusPill } from "@/components/molecules";
import { SALES_THRESHOLDS } from "@/lib/pricing";
import { WelcomeStepLine } from "./OrgSetupForm";

type Choice = "trial" | "sales";

function Option({
  checked,
  onSelect,
  title,
  chip,
  desc,
  side,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  chip?: React.ReactNode;
  desc: string;
  side?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="wel-opt"
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="wel-radio" aria-hidden="true" />
      <div className="wel-opt-body">
        <div className="wel-opt-head">
          {title}
          {chip}
        </div>
        <p className="wel-opt-desc">{desc}</p>
        {children}
      </div>
      {side && <div className="wel-opt-side">{side}</div>}
    </div>
  );
}

/** B2 / B2b: the two ways to start. Order and preselection follow the size bands. */
export function PathChoice({
  salesFirst,
  choice,
  onChoice,
  trialCredits,
  fullReviews,
  slots,
  slot,
  onSlot,
  booked,
  onBook,
  onContinue,
}: {
  salesFirst: boolean;
  choice: Choice;
  onChoice: (c: Choice) => void;
  trialCredits: number;
  fullReviews: number;
  slots: string[];
  slot: string | null;
  onSlot: (s: string) => void;
  booked: boolean;
  onBook: () => void;
  onContinue: () => void;
}) {
  const trial = (
    <Option
      key="trial"
      checked={choice === "trial"}
      onSelect={() => onChoice("trial")}
      title={salesFirst ? "Start the trial anyway" : `Start now with ${trialCredits} trial credits`}
      chip={!salesFirst && <StatusPill tone="pass">Your team fits self-serve</StatusPill>}
      desc={
        salesFirst
          ? `${trialCredits} trial credits, about ${fullReviews} full reviews. No card needed. ${booked ? "The call stays booked." : "The call is optional."}`
          : `A finished sample review plus about ${fullReviews} full reviews. No card needed; add one when you top up.`
      }
    />
  );

  const sales = (
    <Option
      key="sales"
      checked={choice === "sales"}
      onSelect={() => onChoice("sales")}
      title="Talk to us"
      chip={
        booked ? (
          <StatusPill tone="pass" icon="check">
            Call requested
          </StatusPill>
        ) : (
          salesFirst && <StatusPill tone="flag">Flagged for sales</StatusPill>
        )
      }
      desc={
        salesFirst
          ? `For ${SALES_THRESHOLDS.reviewers}+ reviewers or around ${SALES_THRESHOLDS.reportsPerMonth} reports a month: invoicing, ACH and a named contact. A Realwired specialist walks your team through setup.`
          : `For ${SALES_THRESHOLDS.reviewers}+ reviewers or around ${SALES_THRESHOLDS.reportsPerMonth} reports a month: invoicing, ACH and a named contact. The trial stays open either way.`
      }
      side={
        !salesFirst &&
        !booked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconLeft="calendar"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
          >
            Book a call
          </Button>
        )
      }
    >
      {salesFirst && !booked && (
        <div className="wel-slots">
          <span className="wel-slots-lb">Pick a time · Eastern</span>
          <div className="wel-slots-row">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                className="wel-slot"
                aria-pressed={slot === s}
                onClick={(e) => {
                  e.stopPropagation();
                  onSlot(s);
                }}
              >
                <Icon name="clock" size={13} />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </Option>
  );

  return (
    <div>
      <WelcomeStepLine step={2} label="Getting started" />
      <h1 className="wel-title">How you&apos;ll get started</h1>
      <p className="wel-sub">
        {salesFirst
          ? "Your answers suggest a larger team. Self-serve stays open either way."
          : "Based on your answers. You can change your mind later."}
      </p>

      <div className="wel-opts" role="radiogroup" aria-label="How you will get started">
        {salesFirst ? [sales, trial] : [trial, sales]}
      </div>

      <Button type="button" size="lg" block onClick={onContinue}>
        {choice === "sales" && !booked ? "Book the call and continue" : "Continue"}
      </Button>
      <p className="wel-note">
        Answers above {SALES_THRESHOLDS.reviewers - 1} people or {SALES_THRESHOLDS.reportsPerMonth} reports show
        Talk to us first and flag the organization for sales.
      </p>
    </div>
  );
}
