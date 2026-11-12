import { encodeScenario } from "@/components/organisms/prototype/ProtoKeys";
import { PRESETS, SCREENS, patchForState, type PageState, type Preset, type ScreenDef } from "@/lib/prototype-registry";
import { resolveEntryRoute } from "@/lib/landing";
import { useProtoStore } from "@/store/prototype.store";

/** A pattern route needs a concrete path to open; these are the sample ids. */
const SAMPLE_PATH: Record<string, string> = {
  "/reviews/[id]": "/reviews/review-001",
  "/configure/checklists/[id]": "/configure/checklists",
  "/demo/[persona]": "/demo/trial-admin",
};

export function concreteRoute(route: string): string {
  return SAMPLE_PATH[route] ?? route;
}

/** Route plus a state's view params, as a path the router can open. */
export function hrefForState(screen: ScreenDef, state?: PageState): string {
  const base = concreteRoute(screen.route);
  const q = new URLSearchParams(state?.view ?? {}).toString();
  return q ? `${base}?${q}` : base;
}

/** The deep link a card chip, a flow step and "Copy link" share. */
export function goHref(screenId: string, stateId?: string): string {
  const q = new URLSearchParams({ screen: screenId });
  if (stateId) q.set("state", stateId);
  return `/prototype/go?${q.toString()}`;
}

export function screenById(id: string | null | undefined): ScreenDef | undefined {
  return SCREENS.find((s) => s.id === id);
}

/** Applies the screen's base plus the state's world patch (the same patch as a pill pick), then
 *  returns where to go. A state with no world of its own (an auth `?variant=`) applies nothing. */
export async function landState(screen: ScreenDef, state?: PageState): Promise<string> {
  const store = useProtoStore.getState();
  const patch = state && !state.set && !screen.base ? null : patchForState(store.scenario, screen, state);
  if (patch) await store.apply(patch, state?.view);
  return hrefForState(screen, state);
}

/** Applies a preset's scenario, then returns its entry route through `resolveEntryRoute`. */
export async function landPreset(preset: Preset): Promise<string> {
  await useProtoStore.getState().enterPreset(preset);
  return resolveEntryRoute(preset.entry);
}

export function presetById(id: string | null | undefined): Preset | undefined {
  return PRESETS.find((p) => p.id === id || p.legacyPersonaId === id);
}

/** Copies the current world as a `?s=` link on the front door (ProtoKeys applies it once on load). */
export async function copyScenarioLink(): Promise<boolean> {
  try {
    const sc = useProtoStore.getState().scenario;
    await navigator.clipboard.writeText(`${window.location.origin}/dashboard?s=${encodeScenario(sc)}`);
    return true;
  } catch {
    return false;
  }
}
