import type { SetupSectionId } from "@/types";

/**
 * Where each section's earn pill sits on screen right now, so `EarnedToastHost` can
 * play the section burst from it (motion-spec §6.3). `SetupSection` registers its pill
 * through a ref callback; nothing is registered when Get started isn't mounted, and
 * then the toast plays alone.
 */
const pills = new Map<SetupSectionId, HTMLElement>();

export function registerEarnPill(id: SetupSectionId, el: HTMLElement | null): void {
  if (el) pills.set(id, el);
  else pills.delete(id);
}

export function earnPillFor(id: SetupSectionId): HTMLElement | null {
  const el = pills.get(id);
  return el && el.isConnected ? el : null;
}
