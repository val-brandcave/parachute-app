import type { IllustrationName } from "@/components/atoms/illustrations";
import type { SetupStepId } from "@/types";

/**
 * Tour definitions (spec §5.13, PC-14/PC-38). Every target is a `[data-tour="…"]`
 * selector added to the real UI (no behaviour change); a missing target is skipped.
 * Tours are opt-in: nothing here auto-starts.
 */
export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export interface TourStep {
  target: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  art?: IllustrationName;
}

export interface TourDef {
  id: string;
  /** Page tours: the exact pathname the header chip appears on. Absent for the run tour. */
  route?: string;
  /** "shell" = page tour (header chip); "run" = inside the review takeover (.run-head chip). */
  scope: "shell" | "run";
  /** Human name (Learning Center "Page tours", the Index). */
  title: string;
  /** Chip label. */
  label: string;
  steps: TourStep[];
  completesStep?: SetupStepId;
  /** data-tour ids that must exist before the chip is offered (default: the first step's target).
   *  Reviews needs a row, so its chip never shows on the empty queue (PC-38). */
  requiredTargets?: string[];
}

export const tourTarget = (id: string) => `[data-tour="${id}"]`;

/** Selectors that must be present before a tour's chip is offered. */
export function requiredSelectors(t: { steps: { target: string }[]; requiredTargets?: string[] }): string[] {
  return t.requiredTargets?.length ? t.requiredTargets.map(tourTarget) : t.steps.slice(0, 1).map((s) => s.target);
}

export const TOURS: TourDef[] = [
  {
    id: "first-review",
    title: "Your first review",
    scope: "run",
    label: "Take a 1-minute tour",
    completesStep: "tutorial",
    steps: [
      {
        target: tourTarget("wb-cite"),
        title: "Every figure, traced",
        body: "Click any cited figure to open its page in the appraisal, beside the workbook.",
        placement: "right",
        art: "23-scene-first-review",
      },
      {
        target: tourTarget("wb-decision"),
        title: "Concur or reject",
        body: "Concur to keep a finding as written. Edit to put it in your own words, or Reject it with a reason.",
        placement: "bottom",
        art: "07b-finding-citation",
      },
      {
        target: tourTarget("wb-viewmode"),
        title: "This is the workbook",
        body: "Your decisions edit it in place. Preview shows exactly what gets signed.",
        placement: "bottom",
        art: "08b-signed-workbook",
      },
      {
        target: tourTarget("wb-sign"),
        title: "Sign when it's right",
        body: "Sign & finalize seals the workbook so it's ready for the lender.",
        placement: "top",
        art: "08b-signed-workbook",
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    requiredTargets: ["reviews-start", "reviews-row-action"],
    route: "/reviews",
    scope: "shell",
    label: "Take a 1-minute tour",
    steps: [
      { target: tourTarget("reviews-start"), title: "Start a review", body: "Upload an appraisal or pick a delivery from YouConnect.", placement: "bottom" },
      { target: tourTarget("reviews-tabs"), title: "Tabs and search", body: "Tabs split the queue by stage. Search matches the property, loan number or firm.", placement: "bottom" },
      { target: tourTarget("reviews-row-action"), title: "Row actions", body: "Each row offers the one next step for that review. More options sit behind the menu.", placement: "left" },
    ],
  },
  {
    id: "checklists",
    title: "Compliance checklists",
    route: "/configure/checklists",
    scope: "shell",
    label: "Take a 1-minute tour",
    steps: [
      { target: tourTarget("checklists-upload"), title: "Upload your checklist", body: "Drop your compliance checklist. Parachute maps each item for you to confirm.", placement: "bottom" },
      { target: tourTarget("checklists-default"), title: "Set as default", body: "The default checklist runs on every administrative review.", placement: "left" },
    ],
  },
  {
    id: "workbook-layouts",
    title: "Workbook layouts",
    route: "/configure/workbook-layouts",
    scope: "shell",
    label: "Take a 1-minute tour",
    steps: [
      { target: tourTarget("layouts-default"), title: "Your default layout", body: "Every new workbook starts from this layout.", placement: "bottom" },
      { target: tourTarget("layouts-open"), title: "Open it to edit", body: "Edit sections, add your logo and labels, then publish.", placement: "left" },
    ],
  },
  {
    id: "billing",
    title: "Billing and credits",
    route: "/configure/billing",
    scope: "shell",
    label: "Take a 1-minute tour",
    steps: [
      { target: tourTarget("billing-balance"), title: "Your balance", body: "One shared balance for the whole team. Each review type uses one credit.", placement: "bottom" },
      { target: tourTarget("billing-runway"), title: "How long it lasts", body: "At your recent pace, this is when the balance runs out.", placement: "bottom" },
      { target: tourTarget("billing-usage"), title: "Where credits went", body: "Usage shows credits by review type and by person.", placement: "bottom" },
      { target: tourTarget("billing-add"), title: "Add credits", body: "Buy a pack or any amount. Purchased credits last 12 months.", placement: "left" },
    ],
  },
];

export function tourById(id: string): TourDef | undefined {
  return TOURS.find((t) => t.id === id);
}

/** The page tour whose route is exactly this pathname (run tours never match a page). */
export function tourForPath(pathname: string): TourDef | undefined {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return TOURS.find((t) => t.scope === "shell" && t.route === path);
}
