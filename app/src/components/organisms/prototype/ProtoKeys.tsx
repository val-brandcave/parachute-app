"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@realwired/ui";
import { normalize } from "@/lib/prototype/scenario-builder";
import type { Scenario } from "@/lib/prototype/scenario";
import { useProtoStore } from "@/store/prototype.store";
import { useProtoFillStore } from "@/store/proto-fill.store";
import type { ProtoView } from "./useProtoView";

/** Typing in a field never triggers a prototype shortcut. */
function inField(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** `?s=` scenario links (spec §6 "Copy link"): base64url JSON of the scenario. */
export function encodeScenario(sc: Scenario): string {
  return btoa(JSON.stringify(sc)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeScenario(raw: string): Partial<Scenario> | null {
  try {
    return JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))) as Partial<Scenario>;
  } catch {
    return null;
  }
}

/** The last `?s=` value applied: StrictMode's double effect and a remount (hide / show)
 *  must not apply the same link twice. Module scope outlives both. */
let appliedShared: string | null = null;

/** The toast a Planned state shows, from a click or from Alt + 1…9 (same words both ways). */
export function plannedToast(toast: ReturnType<typeof useToast>, label: string): void {
  toast({ title: `${label}: not built yet`, description: "This state is Planned. See spec §6 and the Prototype Index." });
}

/** The toast that tells you how to get the controls back (state-system-draft §3.4). */
export function useHideToast(): () => void {
  const toast = useToast();
  return () => {
    const wasHidden = useProtoStore.getState().hidden;
    useProtoStore.getState().toggleHidden();
    if (!wasHidden) {
      toast({ title: "Prototype controls hidden", description: "Press Ctrl + . (Cmd + . on a Mac) to show them again." });
    }
  };
}

/**
 * Prototype keyboard shortcuts (spec §6, read via `e.code`, ignored in fields):
 * Ctrl/Cmd + . show or hide · Alt + 1…9 page state n · Alt + [ / ] previous / next ·
 * Alt + F fill (Shift: invalid) · Alt + S scenario · Alt + I Prototype Index.
 * Also handles the link params once: `?controls=0` hides without persisting, `?s=` applies
 * a scenario and is stripped. Renders nothing.
 */
export function ProtoKeys({ view }: { view: ProtoView }) {
  const router = useRouter();
  const params = useSearchParams();
  const hideWithToast = useHideToast();
  const toast = useToast();
  const toastRef = useRef(toast);
  const viewRef = useRef(view);
  const hideRef = useRef(hideWithToast);
  useEffect(() => {
    viewRef.current = view;
    hideRef.current = hideWithToast;
    toastRef.current = toast;
  });

  const controls = params.get("controls");
  const shared = params.get("s");
  useEffect(() => {
    if (controls === "0") useProtoStore.getState().forceHidden();
  }, [controls]);
  useEffect(() => {
    if (!shared || appliedShared === shared) return;
    appliedShared = shared;
    const patch = decodeScenario(shared);
    const url = new URL(window.location.href);
    url.searchParams.delete("s");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    if (patch) void useProtoStore.getState().apply(normalize({ ...useProtoStore.getState().scenario, ...patch }).scenario);
  }, [shared]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inField(e.target)) return;
      const store = useProtoStore.getState();
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.code === "Period") {
        e.preventDefault();
        hideRef.current();
        return;
      }
      if (!e.altKey || e.ctrlKey || e.metaKey || store.hidden) return;
      const v = viewRef.current;
      const digit = /^Digit([1-9])$/.exec(e.code);
      if (digit) {
        const st = v.screen?.states[Number(digit[1]) - 1];
        if (st) {
          e.preventDefault();
          void v.pick(st).then((ok) => {
            if (!ok) plannedToast(toastRef.current, st.label);
          });
        }
        return;
      }
      switch (e.code) {
        case "BracketLeft":
        case "BracketRight":
          e.preventDefault();
          void v.step(e.code === "BracketRight" ? 1 : -1);
          return;
        case "KeyS":
          e.preventDefault();
          store.setPopoverOpen(!store.popoverOpen);
          return;
        case "KeyI":
          e.preventDefault();
          router.push("/prototype");
          return;
        case "KeyF": {
          const fill = useProtoFillStore.getState().fill;
          if (!fill) return;
          e.preventDefault();
          if (e.shiftKey && fill.invalid) fill.invalid();
          else fill.valid();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
