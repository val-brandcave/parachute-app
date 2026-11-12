"use client";

import { useEffect, useRef } from "react";
import { useProtoFillStore } from "@/store/proto-fill.store";

/**
 * Fill wand registry (spec §6, state-system-draft §3.3). A form registers a pair of
 * fills for its screen id; the pill's wand (or Alt + F) calls `runProtoFill`. A fill never
 * submits. The valid fill is the demo-good data; the alternate is the invalid or
 * other-side data (Shift-click, Alt + Shift + F). A screen with nothing registered has no wand.
 */
export interface ProtoFills {
  valid(): void;
  invalid?(): void;
}

/** Window event any control can dispatch instead of importing this module. */
export const PROTO_FILL_EVENT = "parachute:proto-fill";

/** True while a form for this screen is mounted and has registered a fill. */
export function hasProtoFill(screenId: string | undefined): boolean {
  return !!screenId && useProtoFillStore.getState().fill?.screenId === screenId;
}

/**
 * Runs the current screen's fill (what the pill's wand and Alt + F call). Returns false when
 * nothing is registered. Without an alternate, the valid fill runs.
 */
export function runProtoFill(opts: { invalid?: boolean } = {}): boolean {
  const f = useProtoFillStore.getState().fill;
  if (!f) return false;
  if (opts.invalid && f.invalid) f.invalid();
  else f.valid();
  return true;
}

/**
 * Registers the wand for the current screen: the handlers go to `useProtoFillStore.fill`, which the
 * pill reads (no handlers, no wand). Pass the screen's registry id (`lib/prototype-registry.ts`).
 * The handlers may close over fresh state: the latest ones are always called. Also answers the
 * `parachute:proto-fill` window event.
 */
export function useProtoFill(screenId: string, handlers: ProtoFills): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const entry = {
      screenId,
      valid: () => ref.current.valid(),
      invalid: () => (ref.current.invalid ?? ref.current.valid)(),
    };
    const off = useProtoFillStore.getState().setFill(entry);
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent<{ invalid?: boolean } | undefined>).detail;
      if (useProtoFillStore.getState().fill !== entry) return;
      if (d?.invalid) entry.invalid();
      else entry.valid();
    };
    window.addEventListener(PROTO_FILL_EVENT, onEvent);
    return () => {
      window.removeEventListener(PROTO_FILL_EVENT, onEvent);
      off();
    };
  }, [screenId]);
}
