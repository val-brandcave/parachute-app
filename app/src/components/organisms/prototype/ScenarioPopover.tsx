"use client";

import { playConfetti } from "@/lib/celebrate";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Popover } from "@realwired/ui";
import { Icon, Switch } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { resolveEntryRoute } from "@/lib/landing";
import { PRESETS, type Preset } from "@/lib/prototype/presets";
import type { Scenario } from "@/lib/prototype/scenario";
import { cn } from "@/lib/utils";
import { setBuildNotes, useBuildNotes } from "@/store/prefs.store";
import { useProtoStore } from "@/store/prototype.store";
import { encodeScenario } from "./ProtoKeys";

type Opt<T extends string> = { value: T; label: string }[];

const AXES: { key: keyof Scenario; label: string; options: Opt<string> }[] = [
  { key: "audience", label: "Audience", options: [
    { value: "self_serve", label: "Self-serve" }, { value: "enterprise", label: "Enterprise" }, { value: "youconnect", label: "YouConnect" },
  ] },
  { key: "lifecycle", label: "Lifecycle", options: [
    { value: "prospect", label: "Prospect" }, { value: "verified", label: "Verified" }, { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" }, { value: "suspended", label: "Suspended" },
  ] },
  { key: "wallet", label: "Wallet", options: [
    { value: "held", label: "Held" }, { value: "fresh", label: "Fresh" }, { value: "trial", label: "Trial" }, { value: "healthy", label: "Healthy" },
    { value: "low", label: "Low" }, { value: "short", label: "Short" }, { value: "zero", label: "Zero" }, { value: "invoiced", label: "Invoiced" },
  ] },
  { key: "setup", label: "Setup", options: [
    { value: "fresh", label: "New" }, { value: "mid", label: "Mid" }, { value: "almost", label: "Almost" }, { value: "done", label: "Done" }, { value: "hidden", label: "Hidden" },
  ] },
  { key: "role", label: "Role", options: [
    { value: "org_admin", label: "Admin" }, { value: "approver", label: "Approver" }, { value: "reviewer", label: "Reviewer" },
  ] },
  { key: "data", label: "Data", options: [
    { value: "empty", label: "Empty" }, { value: "populated", label: "Populated" }, { value: "busy", label: "Busy" },
  ] },
];

const MODIFIERS: { key: keyof Scenario; label: string; options: Opt<string> }[] = [
  { key: "bonus", label: "Bonus", options: [{ value: "open", label: "Open" }, { value: "ending", label: "Ending" }, { value: "closed", label: "Closed" }] },
  { key: "paymentMethod", label: "Payment", options: [{ value: "none", label: "None" }, { value: "card", label: "Card" }, { value: "invoice", label: "Invoice" }] },
  { key: "request", label: "Request", options: [{ value: "none", label: "None" }, { value: "open", label: "Open" }] },
];

const ROLE_LABEL: Record<string, string> = { org_admin: "admin", approver: "approver", reviewer: "reviewer" };

/**
 * Scenario popover (spec §6, state-system-draft §3.2): the axes, modifiers, presets and
 * every action the old demo dock had. DS `Popover` for the panel (lifted to the pill's 210 tier in
 * prototype.css); the local `SegmentedControl` for each axis.
 */
export function ScenarioPopover({ screenId }: { screenId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const open = useProtoStore((s) => s.popoverOpen);
  const setOpen = useProtoStore((s) => s.setPopoverOpen);
  const scenario = useProtoStore((s) => s.scenario);
  const notes = useProtoStore((s) => s.notes);
  const busy = useProtoStore((s) => s.busy);
  const legacy = useProtoStore((s) => s.legacy);
  const me = useCurrentUser();
  const { name: orgName } = useCurrentOrg();
  const buildNotes = useBuildNotes();
  const [said, setSaid] = useState("");

  // Radix does not close on scroll / resize; the house floating-layer rule does.
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(".proto-pop")) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, setOpen]);

  const store = useProtoStore.getState;
  const run = async (fn: () => Promise<string> | string) => setSaid(await fn());
  const setAxis = (key: keyof Scenario, value: string | boolean) => {
    setSaid("");
    void store().apply({ [key]: value } as Partial<Scenario>);
  };
  const pickPreset = async (p: Preset) => {
    if (p.status === "planned") {
      setSaid(`${p.label} is not built yet.`);
      return;
    }
    await store().apply(p.scenario);
    setOpen(false);
    router.push(resolveEntryRoute(p.entry));
  };
  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", encodeScenario(scenario));
    try {
      await navigator.clipboard.writeText(url.toString());
      setSaid("Scenario link copied.");
    } catch {
      setSaid(url.toString());
    }
  };
  const replay = () => {
    setSaid(store().replayArrival());
    setOpen(false);
    if (pathname === "/get-started") window.location.reload();
    else router.push("/get-started");
  };

  // "Setup is finished" only helps where the setup checklist is the subject.
  const shown = notes.filter((n) => !n.startsWith("Setup is finished") || screenId === "get-started");

  const trigger = (
    <button type="button" className="proto-btn proto-btn--scenario" aria-label="Scenario" aria-expanded={open}>
      <Icon name="switch-horizontal" size={15} />
      <span className="proto-hide-narrow">Scenario</span>
      <Icon name="chevron-down" size={13} />
    </button>
  );

  return (
    <Popover
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      title="Scenario"
      side="top"
      align="center"
      width={460}
      className="proto-pop"
    >
      <div className="proto-sc" role="group" aria-label="Scenario controls" aria-busy={busy || undefined}>
        {shown.length > 0 && (
          <ul className="proto-notes" aria-label="Why the scenario changed">
            {shown.map((n) => (
              <li key={n}>
                <Icon name="info" size={14} /> {n}
              </li>
            ))}
          </ul>
        )}

        <section className="proto-sec" aria-label="Axes">
          {AXES.map((a) => (
            <div className="proto-axis" key={a.key}>
              <span className="proto-axis-lb">{a.label}</span>
              <SegmentedControl
                label={a.label}
                options={a.options}
                value={String(scenario[a.key])}
                onChange={(v) => setAxis(a.key, v)}
              />
            </div>
          ))}
        </section>

        <section className="proto-sec" aria-label="Modifiers">
          <h3 className="proto-h">Modifiers</h3>
          {MODIFIERS.map((a) => (
            <div className="proto-axis" key={a.key}>
              <span className="proto-axis-lb">{a.label}</span>
              <SegmentedControl
                label={a.label}
                options={a.options}
                value={String(scenario[a.key])}
                onChange={(v) => setAxis(a.key, v)}
              />
            </div>
          ))}
          <div className="proto-switches">
            <label className="proto-switch">
              <Switch size="sm" label="Auto-reload" checked={scenario.autoReload} onChange={(v) => setAxis("autoReload", v)} />
              <span>Auto-reload</span>
            </label>
            <label className="proto-switch">
              <Switch size="sm" label="Credits expiring" checked={scenario.expiring} onChange={(v) => setAxis("expiring", v)} />
              <span>Credits expiring</span>
            </label>
          </div>
        </section>

        <section className="proto-sec" aria-label="Actions">
          <h3 className="proto-h">Actions</h3>
          <div className="proto-actions">
            <button type="button" className="proto-act" onClick={() => run(() => store().approveNow())}>
              <Icon name="check-circle" size={14} /> Approve now
            </button>
            <button type="button" className="proto-act" onClick={() => run(() => store().completeNextStep())}>
              <Icon name="checklist" size={14} /> Complete next step
            </button>
            <button type="button" className="proto-act" onClick={() => run(() => store().addCredits(5))}>
              <Icon name="add" size={14} /> Add 5 credits
            </button>
            <button type="button" className="proto-act" onClick={() => run(() => store().spendCredit())}>
              <Icon name="minus" size={14} /> Spend 1 credit
            </button>
            <button
              type="button"
              className="proto-act"
              onClick={() =>
                run(async () => {
                  await store().reset();
                  return legacy ? "Organization reset to its seed." : "Organization rebuilt from the scenario.";
                })
              }
            >
              <Icon name="restore" size={14} /> Reset org
            </button>
            <button type="button" className="proto-act" onClick={() => run(() => store().resetToursAndCelebrations())}>
              <Icon name="refresh" size={14} /> Reset tours and celebrations
            </button>
            <button type="button" className="proto-act" onClick={replay}>
              <Icon name="play" size={14} /> Replay arrival
            </button>
            <button type="button" className="proto-act" onClick={() => void playConfetti()}>
              <Icon name="confetti" size={14} /> Play confetti
            </button>
            <button type="button" className="proto-act" onClick={() => window.open("/emails", "_blank", "noopener")}>
              <Icon name="mail" size={14} /> Open e-mails
            </button>
            <button type="button" className="proto-act" onClick={copyLink}>
              <Icon name="copy" size={14} /> Copy link
            </button>
          </div>
          <label className="proto-switch">
            <Switch size="sm" label="Show build notes" checked={buildNotes} onChange={setBuildNotes} />
            <span>Show build notes</span>
          </label>
          <p className="proto-said" role="status" aria-live="polite">
            {said}
          </p>
        </section>

        <section className="proto-sec" aria-label="Presets">
          <h3 className="proto-h">Presets</h3>
          <div className="proto-presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn("proto-preset", p.status === "planned" && "is-planned")}
                onClick={() => pickPreset(p)}
              >
                <span className="proto-preset-lb">{p.label}</span>
                <span className="proto-preset-sub">{p.description}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="proto-foot">
          {me.auth === "signed_in" ? (
            <>
              Stage org: {orgName} · {me.name} ({ROLE_LABEL[me.role] ?? me.role})
            </>
          ) : (
            "No organization: signed out."
          )}
          {legacy && <span className="proto-legacy"> · legacy persona “{legacy}”</span>}
        </footer>
      </div>
    </Popover>
  );
}
