"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { activeState, patchForState, screenForPath, type PageState, type ScreenDef } from "@/lib/prototype-registry";
import { useProtoStore } from "@/store/prototype.store";

export interface ProtoView {
  /** The registry screen for this route, if any. */
  screen: ScreenDef | undefined;
  /** The derived selection (spec §6); undefined = "Custom" (no match, or rows edited by an action). */
  active: PageState | undefined;
  /** Apply a page state: world patch through the store, view params with `router.replace`.
   *  Returns false for a Planned state (the caller explains it). */
  pick: (state: PageState) => Promise<boolean>;
  /** Step the selection by `delta` (Alt + [ / ]). */
  step: (delta: number) => Promise<void>;
}

/** The pill's view of the current page: which screen, which state, how to switch. */
export function useProtoView(): ProtoView {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const scenario = useProtoStore((s) => s.scenario);
  const edited = useProtoStore((s) => s.edited);
  const apply = useProtoStore((s) => s.apply);

  const query = params.toString();
  // The query picks a tab that is its own screen (How credits work on /configure/billing).
  const screen = useMemo(() => screenForPath(pathname, query), [pathname, query]);
  const active = useMemo(
    // After Add 5 / Spend 1 / Complete next step the rows no longer match any state: "Custom".
    () => (screen && !edited ? activeState(screen, scenario, new URLSearchParams(query)) : undefined),
    [screen, scenario, edited, query],
  );

  const pick = useCallback(
    async (state: PageState) => {
      if (state.status === "planned") return false;
      // Screen base + state: a leftover from the previous screen (a reviewer role) never leaks in.
      await apply(patchForState(scenario, screen, state) ?? {}, state.view);
      // View params: this state's, minus any key another state of the screen owns.
      const next = new URLSearchParams(query);
      for (const other of screen?.states ?? []) for (const k of Object.keys(other.view ?? {})) next.delete(k);
      for (const [k, v] of Object.entries(state.view ?? {})) next.set(k, v);
      const q = next.toString();
      if (q !== query) router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      return true;
    },
    [apply, scenario, query, screen, pathname, router],
  );

  const step = useCallback(
    async (delta: number) => {
      const states = (screen?.states ?? []).filter((s) => s.status !== "planned");
      if (!states.length) return;
      const i = active ? states.findIndex((s) => s.id === active.id) : -1;
      const n = i < 0 ? (delta > 0 ? 0 : states.length - 1) : (i + delta + states.length) % states.length;
      await pick(states[n]);
    },
    [screen, active, pick],
  );

  return { screen, active, pick, step };
}
