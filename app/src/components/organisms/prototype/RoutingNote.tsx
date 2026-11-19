"use client";

import { useSyncExternalStore } from "react";
import { SALES_THRESHOLDS, VOLUME_BAND_LABEL, routeForProfile } from "@/lib/pricing";
import { useProtoStore } from "@/store/prototype.store";
import type { TeamBand, VolumeBand } from "@/types";
import "./proto-index.css";

const TEAM_LABEL: Record<TeamBand, string> = { "1": "1", "2-10": "2–10", "11+": "11+" };

function controlsOff(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("controls") === "0";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  const off = useProtoStore.subscribe(cb);
  return () => {
    window.removeEventListener("popstate", cb);
    off();
  };
}

/** True while the prototype controls are shown: not hidden in the prototype store, not `?controls=0`. */
export function useProtoControlsVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => process.env.NEXT_PUBLIC_DEMO_PERSONAS !== "0" && !useProtoStore.getState().hidden && !controlsOff(),
    () => false,
  );
}

/**
 * The routing condition as a build note under the org-setup form (spec §6, draft §5.2):
 * "Route: Enterprise · because Reviewers = 11+ (≥ 11)". Drawn only while the prototype
 * controls are visible; hiding them (or `?controls=0`) removes it.
 */
export function RoutingNote({ profile }: { profile: { teamBand: string; volumeBand: string } }) {
  const visible = useProtoControlsVisible();
  if (!visible) return null;

  const route = routeForProfile(profile);
  const team = TEAM_LABEL[profile.teamBand as TeamBand] ?? profile.teamBand;
  const volume = VOLUME_BAND_LABEL[profile.volumeBand as VolumeBand] ?? profile.volumeBand;
  const { reviewers, reportsPerMonth } = SALES_THRESHOLDS;
  const teamHit = profile.teamBand === "11+";
  const volumeHit = profile.volumeBand === "200+";

  let text: string;
  if (route === "enterprise") {
    const because = [
      teamHit && `Reviewers = ${team} (≥ ${reviewers})`,
      volumeHit && `Reports = ${volume} (≥ ${reportsPerMonth})`,
    ].filter(Boolean);
    text = `Route: Enterprise · because ${because.join(" and ")}`;
  } else {
    text = `Route: Self-serve · Reviewers ${team} < ${reviewers}, Reports ${volume} < ${reportsPerMonth}`;
  }

  return (
    <p className="proto-route-note" role="note" data-proto-note="routing">
      {text}
    </p>
  );
}
