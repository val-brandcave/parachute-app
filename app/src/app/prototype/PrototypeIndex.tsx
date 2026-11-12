"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/atoms";
import { ActionMenu, SegmentedControl } from "@/components/molecules";
import {
  FLOWS,
  NON_SCREEN_ROUTES,
  PRESETS,
  SCREENS,
  type Audience,
  type BuildStatus,
  type FlowDef,
  type GroupId,
  type PageState,
  type ScreenDef,
} from "@/lib/prototype-registry";
import { cn } from "@/lib/utils";
import { plannedToast } from "@/components/organisms/prototype/ProtoKeys";
import { copyScenarioLink, goHref, hrefForState, landPreset } from "./land";
import "@/components/organisms/prototype/proto-index.css";

type Tab = "screens" | "flows" | "states";
type StatusFilter = "all" | "built" | "planned";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "auth", label: "Auth" },
  { id: "onboarding", label: "Onboarding" },
  { id: "get-started", label: "Get started" },
  { id: "reviews", label: "Reviews" },
  { id: "billing", label: "Billing & credits" },
  { id: "configure", label: "Configure" },
  { id: "trust-learning", label: "Trust & Learning" },
  { id: "emails", label: "Emails" },
  { id: "integrations", label: "Integrations" },
  { id: "design-system", label: "Design system" },
];

const STATUS_LABEL: Record<BuildStatus, string> = { built: "Built", variant: "Variant", planned: "Planned", retired: "Retired" };
const STATUS_TONE: Record<BuildStatus, string> = { built: "pass", variant: "info", planned: "flag", retired: "na" };
const AUDIENCE_LABEL: Record<Audience, string> = { self_serve: "PLG", enterprise: "Ent", youconnect: "YC" };
const ROLE_LABEL = { org_admin: "Admin only", approver: "Approver only", reviewer: "Reviewer only" } as const;
const CHIPS_SHOWN = 4;

function matches(q: string, ...parts: (string | undefined)[]): boolean {
  if (!q) return true;
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

function screenText(s: ScreenDef): string {
  return [s.id, s.title, s.route, s.group, ...(s.tags ?? []), ...s.states.flatMap((x) => [x.id, x.label, x.description ?? ""])].join(" ");
}

/** Dev only: registry and filesystem must agree. Returns the problems, or [] when clean. */
function registryProblems(pageRoutes: string[] | undefined): string[] {
  const out: string[] = [];
  const screenIds = new Set<string>();
  for (const s of SCREENS) {
    if (screenIds.has(s.id)) out.push(`duplicate screen id "${s.id}"`);
    screenIds.add(s.id);
  }
  for (const f of FLOWS) {
    for (const step of f.steps) {
      const sc = SCREENS.find((s) => s.id === step.screen);
      if (!sc) out.push(`flow "${f.id}": unknown screen "${step.screen}"`);
      else if (step.state && !sc.states.some((x) => x.id === step.state)) out.push(`flow "${f.id}": screen "${sc.id}" has no state "${step.state}"`);
    }
  }
  if (pageRoutes) {
    const known = new Set(SCREENS.map((s) => s.route));
    for (const r of pageRoutes) if (!known.has(r) && !NON_SCREEN_ROUTES.includes(r)) out.push(`page.tsx route ${r} has no registry entry`);
    const pages = new Set(pageRoutes);
    for (const s of SCREENS) if (!pages.has(s.route) && s.status !== "planned") out.push(`registry route ${s.route} has no page.tsx and is not Planned`);
  }
  return out;
}

export function PrototypeIndex({ pageRoutes, thumbs = [] }: { pageRoutes?: string[]; thumbs?: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("screens");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const problems = useMemo(() => registryProblems(pageRoutes), [pageRoutes]);
  useEffect(() => {
    for (const p of problems) console.warn(`[prototype-registry] ${p}`);
  }, [problems]);

  // "/" focuses the search, unless a field already has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = q.trim().toLowerCase();
  const statusOk = (s: BuildStatus) => status === "all" || (status === "built" ? s !== "planned" : s === "planned");

  const flowCount = useMemo(() => {
    const n: Record<string, number> = {};
    for (const f of FLOWS) for (const id of new Set(f.steps.map((s) => s.screen))) n[id] = (n[id] ?? 0) + 1;
    return n;
  }, []);

  /** Screens that pass the search and the status filter (the rail counts use these, before the group filter). */
  const searched = SCREENS.filter((s) => statusOk(s.status) && matches(query, screenText(s)));
  const shown = group === "all" ? searched : searched.filter((s) => s.group === group);

  const stateRows = SCREENS.filter((s) => group === "all" || s.group === group).flatMap((s) =>
    s.states
      .filter((st) => statusOk(st.status) && matches(query, s.title, s.route, s.id, st.id, st.label, st.description))
      .map((st) => ({ screen: s, state: st })),
  );

  const shownFlows = FLOWS.filter((f) => matches(query, f.id, f.title, ...f.steps.map((s) => `${s.screen} ${s.state ?? ""} ${s.note ?? ""}`)));

  const counter =
    tab === "screens"
      ? `${shown.length} of ${SCREENS.length} screens`
      : tab === "flows"
        ? `${shownFlows.length} of ${FLOWS.length} flows`
        : `${stateRows.length} of ${SCREENS.reduce((n, s) => n + s.states.length, 0)} states`;

  const openPreset = async (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    router.push(await landPreset(p));
  };

  const copy = async () => {
    const ok = await copyScenarioLink();
    toast(ok ? { title: "Scenario link copied", tone: "success" } : { title: "Could not copy the link", tone: "danger" });
  };

  return (
    <div className="pi-page">
      <header className="pi-head">
        <div className="pi-brand">
          <Logo full height={24} themeAware />
          <h1 className="pi-title">Prototype Index</h1>
        </div>
        <div className="pi-search field">
          <label htmlFor="pi-q" className="sr-only">
            Search pages, routes, states, tags
          </label>
          <Icon name="search" size={16} />
          <input
            id="pi-q"
            ref={searchRef}
            type="search"
            placeholder="Search pages, routes, states, tags"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="pi-count" role="status" aria-live="polite" data-testid="pi-count">
          {counter}
        </span>
        <div className="pi-actions">
          <button type="button" className="ui-btn ui-btn--outline ui-btn--sm" onClick={copy}>
            <Icon name="copy" size={15} />
            Copy scenario link
          </button>
          <ActionMenu
            menuClassName="pi-presets"
            items={[
              { header: true, label: "Presets" },
              ...PRESETS.map((p) => ({
                label: p.label,
                description: p.description,
                onClick: () => void openPreset(p.id),
              })),
            ]}
            trigger={({ open, toggle }) => (
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                Open prototype
                <Icon name="chevron-down" size={15} />
              </button>
            )}
          />
        </div>
      </header>

      <div className="pi-body">
        <nav className="pi-rail" aria-label="Groups">
          <ul className="pi-groups">
            <li>
              <button type="button" className={cn("pi-group", group === "all" && "on")} aria-pressed={group === "all"} onClick={() => setGroup("all")}>
                <span>All</span>
                <span className="pi-n">{searched.length}</span>
              </button>
            </li>
            {GROUPS.map((g) => (
              <li key={g.id}>
                <button type="button" className={cn("pi-group", group === g.id && "on")} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
                  <span>{g.label}</span>
                  <span className="pi-n">{searched.filter((s) => s.group === g.id).length}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="pi-filter">
            <span className="pi-filter-lb">Status</span>
            <SegmentedControl
              block
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "built", label: "Built" },
                { value: "planned", label: "Planned" },
              ]}
            />
          </div>
        </nav>

        <main className="pi-main">
          <div className="pi-tabs">
            <SegmentedControl
              label="View"
              value={tab}
              onChange={setTab}
              options={[
                { value: "screens", label: "Screens" },
                { value: "flows", label: "Flows" },
                { value: "states", label: "States" },
              ]}
            />
          </div>

          {problems.length > 0 && (
            <div className="pi-problems" role="alert">
              <strong>
                Registry check: {problems.length} problem{problems.length === 1 ? "" : "s"}
              </strong>
              <ul>
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {tab === "screens" &&
            (shown.length === 0 ? (
              <Empty q={q} />
            ) : (
              <ul className="pi-grid">
                {shown.map((s) => (
                  <li key={s.id}>
                    <ScreenCard screen={s} flows={flowCount[s.id] ?? 0} hasThumb={thumbs.includes(s.id)} />
                  </li>
                ))}
              </ul>
            ))}

          {tab === "flows" &&
            (shownFlows.length === 0 ? (
              <Empty q={q} />
            ) : (
              <ol className="pi-flows">
                {shownFlows.map((f) => (
                  <li key={f.id}>
                    <FlowCard flow={f} />
                  </li>
                ))}
              </ol>
            ))}

          {tab === "states" &&
            (stateRows.length === 0 ? (
              <Empty q={q} />
            ) : (
              <table className="pi-states">
                <thead>
                  <tr>
                    <th>Screen</th>
                    <th>State</th>
                    <th>Status</th>
                    <th>What it shows</th>
                  </tr>
                </thead>
                <tbody>
                  {stateRows.map(({ screen, state }) => (
                    <tr key={`${screen.id}:${state.id}`}>
                      <td>
                        <Link className="pi-link" href={goHref(screen.id)}>
                          {screen.title}
                        </Link>
                        <span className="pi-route">{screen.route}</span>
                      </td>
                      <td>
                        <StateChip screenId={screen.id} state={state} />
                      </td>
                      <td>
                        <StatusBadge status={state.status} />
                      </td>
                      <td className="pi-desc">{state.description ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
        </main>
      </div>
    </div>
  );
}

function Empty({ q }: { q: string }) {
  return <p className="pi-empty">{q ? `Nothing matches “${q}”.` : "Nothing here."}</p>;
}

function StatusBadge({ status }: { status: BuildStatus }) {
  return <span className={cn("ui-chip", `ui-chip--${STATUS_TONE[status]}`)}>{STATUS_LABEL[status]}</span>;
}

function Thumb({ screen, exists }: { screen: ScreenDef; exists: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className="pi-thumb" aria-hidden="true">
      {missing || !exists ? (
        <Icon name="templates" size={28} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={screen.thumb ?? `/proto-thumbs/${screen.id}.png`} alt="" loading="lazy" onError={() => setMissing(true)} />
      )}
    </div>
  );
}

/**
 * One page-state chip. A Planned state has nothing to land on, so (like the state pill and
 * Alt+1…9) a click shows the "not built yet" toast instead of navigating: the chip keeps its
 * look, reads aria-disabled, and explains.
 */
function StateChip({ screenId, state, title }: { screenId: string; state: PageState; title?: string }) {
  const toast = useToast();
  const planned = state.status === "planned";
  return (
    <Link
      className={cn("pi-chip", planned && "is-planned")}
      href={goHref(screenId, state.id)}
      title={title}
      aria-disabled={planned ? true : undefined}
      onClick={(e) => {
        if (!planned) return;
        e.preventDefault();
        plannedToast(toast, state.label);
      }}
    >
      {state.label}
    </Link>
  );
}

function ScreenCard({ screen, flows, hasThumb }: { screen: ScreenDef; flows: number; hasThumb: boolean }) {
  const [all, setAll] = useState(false);
  const toast = useToast();
  const chips: PageState[] = all ? screen.states : screen.states.slice(0, CHIPS_SHOWN);
  const more = screen.states.length - CHIPS_SHOWN;
  const copyDeep = async () => {
    try {
      await navigator.clipboard.writeText(new URL(goHref(screen.id), window.location.origin).toString());
      toast({ title: "Deep link copied", tone: "success" });
    } catch {
      toast({ title: "Could not copy the link", tone: "danger" });
    }
  };
  return (
    <article className="pi-card" data-screen={screen.id}>
      <Link href={goHref(screen.id)} className="pi-thumb-link" aria-label={`Open ${screen.title}`} tabIndex={-1}>
        <Thumb screen={screen} exists={hasThumb} />
      </Link>
      <div className="pi-card-body">
        <div className="pi-card-top">
          <h2 className="pi-card-title">
            <Link className="pi-link" href={goHref(screen.id)}>
              {screen.title}
            </Link>
          </h2>
          <ActionMenu
            tooltip={`More for ${screen.title}`}
            items={[
              { label: "Copy deep link", icon: "copy", onClick: () => void copyDeep() },
              { label: "Open in this scenario", icon: "external", onClick: () => window.location.assign(hrefForState(screen)) },
            ]}
          />
        </div>
        <p className="pi-route">{screen.route}</p>
        <div className="pi-meta">
          <StatusBadge status={screen.status} />
          {screen.audiences?.map((a) => (
            <span key={a} className="pi-aud" data-aud={a}>
              {AUDIENCE_LABEL[a]}
            </span>
          ))}
          {screen.roles?.map((r) => (
            <span key={r} className="pi-aud">
              {ROLE_LABEL[r]}
            </span>
          ))}
          {flows > 0 && (
            <span className="pi-aud">
              In {flows} {flows === 1 ? "flow" : "flows"}
            </span>
          )}
          {screen.fill && (
            <span className="pi-aud pi-wand">
              <Icon name="wand" size={13} />
              Has wand
            </span>
          )}
        </div>
        {screen.states.length > 0 && (
          <div className="pi-chips" role="group" aria-label={`States of ${screen.title}`}>
            {chips.map((st) => (
              <StateChip key={st.id} screenId={screen.id} state={st} title={st.description} />
            ))}
            {more > 0 && (
              <button type="button" className="pi-chip pi-chip--more" aria-expanded={all} onClick={() => setAll((v) => !v)}>
                {all ? "Show less" : `+${more} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function FlowCard({ flow }: { flow: FlowDef }) {
  return (
    <article className="pi-flow" data-flow={flow.id}>
      <header className="pi-flow-head">
        <h2 className="pi-card-title">{flow.title}</h2>
        {flow.audience && <span className="pi-aud">{AUDIENCE_LABEL[flow.audience]}</span>}
        <Link className="ui-btn ui-btn--outline ui-btn--sm" href={`/prototype/go?flow=${flow.id}&step=1`}>
          <Icon name="play" size={14} />
          Play
        </Link>
      </header>
      <ol className="pi-steps">
        {flow.steps.map((step, i) => {
          const sc = SCREENS.find((s) => s.id === step.screen);
          const st = sc?.states.find((x) => x.id === step.state);
          return (
            <li key={i} className="pi-step">
              <Link className="pi-link" href={`/prototype/go?flow=${flow.id}&step=${i + 1}`}>
                {sc?.title ?? step.screen}
              </Link>
              {st && <span className="pi-chip">{st.label}</span>}
              {step.note && <span className="pi-note">{step.note}</span>}
            </li>
          );
        })}
      </ol>
    </article>
  );
}
