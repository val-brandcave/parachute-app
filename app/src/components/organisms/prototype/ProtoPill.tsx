"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@realwired/ui";
import { Icon } from "@/components/atoms";
import { PROTO_ENABLED } from "@/lib/demo";
import { dur, ease } from "@/lib/motion";
import type { PageState } from "@/lib/prototype-registry";
import { cn } from "@/lib/utils";
import { useProtoStore } from "@/store/prototype.store";
import { useProtoFillStore } from "@/store/proto-fill.store";
import { ProtoKeys, plannedToast, useHideToast } from "./ProtoKeys";
import { ScenarioPopover } from "./ScenarioPopover";
import { useProtoView } from "./useProtoView";
import "./prototype.css";

/**
 * Prototype state pill (spec §6, state-system-draft §3.1): portal, z 210 (above the 200
 * overlay tier, so it works over the review, checkout and dialogs). Placed BOTTOM centre, not
 * top centre: at the top it covered the header (tour chip, search, credits) or, under the
 * header, each page's own band (Reviews tabs, Billing tabs) — page content scrolls past the
 * bottom edge, the header and bands don't.
 * `[Page label] │ states │ wand │ scenario ▾ │ index │ hide`. The selection is derived
 * (`activeState`); no match shows "Custom". Mounted once in AppShell, the onboarding layout
 * and the checkout layout. `NEXT_PUBLIC_PROTOTYPE_CONTROLS=0` removes it entirely.
 */
export function ProtoPill() {
  if (!PROTO_ENABLED) return null;
  return (
    <Suspense fallback={null}>
      <Pill />
    </Suspense>
  );
}

function Pill() {
  const view = useProtoView();
  const hidden = useProtoStore((s) => s.hidden);
  const busy = useProtoStore((s) => s.busy);
  const fill = useProtoFillStore((s) => s.fill);
  const hideWithToast = useHideToast();
  const toast = useToast();
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const segsRef = useRef<HTMLDivElement>(null);

  const { screen, active } = view;
  const states = screen?.states ?? [];

  // Keep the selected state in view when the segments scroll sideways.
  useEffect(() => {
    segsRef.current?.querySelector<HTMLElement>(".proto-seg.on")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active?.id, hidden]);

  const pick = async (st: PageState) => {
    setTip(null);
    const ok = await view.pick(st);
    if (!ok) plannedToast(toast, st.label);
  };
  const showTip = (el: HTMLElement, text?: string) => {
    if (!text) return;
    const r = el.getBoundingClientRect();
    setTip({ text, x: r.left + r.width / 2, y: r.top - 8 });
  };

  if (hidden) return <ProtoKeys view={view} />;

  return (
    <>
      <ProtoKeys view={view} />
      {createPortal(
        <div className="proto-pill" role="toolbar" aria-label="Prototype controls" data-busy={busy || undefined}>
          <span className="proto-label">
            <Icon name="switch-horizontal" size={14} />
            <span>{screen?.pillLabel ?? screen?.title ?? "Prototype"}</span>
          </span>

          {states.length > 0 && (
            <>
              <span className="proto-sep" aria-hidden="true" />
              <div className="proto-segs" ref={segsRef} role="group" aria-label={`${screen?.title} states`}>
                {states.map((st) => {
                  const on = active?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={cn("proto-seg", on && "on", st.status === "planned" && "is-planned")}
                      aria-pressed={on}
                      data-state={st.id}
                      onClick={() => pick(st)}
                      onMouseEnter={(e) => showTip(e.currentTarget, st.description)}
                      onFocus={(e) => showTip(e.currentTarget, st.description)}
                      onMouseLeave={() => setTip(null)}
                      onBlur={() => setTip(null)}
                    >
                      {on && <motion.span layoutId="proto-seg-thumb" className="proto-seg-thumb" transition={{ duration: dur.standard, ease: ease.standard }} />}
                      <span className="proto-seg-lb">{st.label}</span>
                    </button>
                  );
                })}
                {!active && (
                  <span className="proto-custom" aria-live="polite">
                    Custom
                  </span>
                )}
              </div>
              <label className="proto-narrow">
                <span className="ui-visually-hidden">{screen?.title} state</span>
                <select
                  className="proto-select"
                  value={active?.id ?? ""}
                  onChange={(e) => {
                    const st = states.find((s) => s.id === e.target.value);
                    if (st) void pick(st);
                  }}
                >
                  {!active && <option value="">Custom</option>}
                  {states.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                      {st.status === "planned" ? " (Planned)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <span className="proto-sep" aria-hidden="true" />
          {fill && (
            <button
              type="button"
              className="proto-btn"
              aria-label="Fill the form (Shift: invalid data)"
              onClick={(e) => (e.shiftKey && fill.invalid ? fill.invalid() : fill.valid())}
            >
              <Icon name="wand" size={15} />
            </button>
          )}
          <ScenarioPopover screenId={screen?.id} />
          <Link className="proto-btn" href="/prototype" aria-label="Prototype Index">
            <Icon name="sitemap" size={15} />
          </Link>
          <button type="button" className="proto-btn" aria-label="Hide prototype controls" onClick={hideWithToast}>
            <Icon name="eye-off" size={15} />
          </button>
        </div>,
        document.body,
      )}
      {tip &&
        createPortal(
          // DS-candidate: Tooltip over a z-210 surface — the local Tooltip sits on the 160
          // tier, under the pill.
          <span className="proto-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
            {tip.text}
          </span>,
          document.body,
        )}
    </>
  );
}
