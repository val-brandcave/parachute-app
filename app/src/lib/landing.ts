import { SETUP_STEPS } from "@/lib/setup-steps";
import {
  setupEligible,
  useOnboardingStore,
  useOrgStore,
  usePrefsStore,
  useSessionStore,
  useSetupHidden,
  useOrgStage,
} from "@/store";
import { useProtoStore } from "@/store/prototype.store";
import type { Preset } from "@/lib/prototype/presets";

export const GET_STARTED_HREF = "/get-started";
export const DASHBOARD_HREF = "/dashboard";

/** Is the setup guide live for this user right now (read outside React)?
 *  Setup-eligible orgs (self-serve, plus enterprise orgs that came through sales), setup unfinished, not dismissed org-wide, and not hidden by this user. */
export function setupGuideVisible(): boolean {
  const { progress } = useOnboardingStore.getState();
  const { org } = useOrgStore.getState();
  const { userId } = useSessionStore.getState();
  if (!progress || !org) return false;
  if (!setupEligible(org)) return false;
  if (progress.homeDismissedAt) return false;
  if (SETUP_STEPS.every((s) => progress.completed[s.id] !== undefined)) return false;
  if (userId && usePrefsStore.getState().setupHiddenBy[userId]) return false;
  return true;
}

/** Where a person lands after sign-in, onboarding or a persona switch: the setup
 *  page while setup is unfinished and not hidden, otherwise the dashboard. Call it
 *  AFTER the session data has loaded. */
export function landingRoute(): string {
  return setupGuideVisible() ? GET_STARTED_HREF : DASHBOARD_HREF;
}

/** Entry routes that mean "the front door" resolve through `landingRoute`; any
 *  other route (a persona that deliberately opens on Launchpad, say) is kept. */
export function resolveEntryRoute(route: string): string {
  return route === DASHBOARD_HREF ? landingRoute() : route;
}

/** Reactive: show the "Get started" rail item. */
export function useSetupGuideVisible(): boolean {
  const stage = useOrgStage();
  const hidden = useSetupHidden();
  return stage === "new" && !hidden;
}

/** PROTOTYPE ONLY. Apply a preset (spec §6) and return where it lands: its `entry`
 *  through `resolveEntryRoute`, AFTER the session data has loaded. `alias` = a legacy
 *  persona id (`/demo/<id>`, `?persona=`) that keeps that persona's seeded identity. */
export async function enterPreset(preset: Preset, opts?: { alias?: boolean }): Promise<string> {
  await useProtoStore.getState().enterPreset(preset, opts);
  return resolveEntryRoute(preset.entry);
}
