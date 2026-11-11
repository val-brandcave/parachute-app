"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Callout, CalloutAction, useToast } from "@realwired/ui";
import { Button, Icon, Textarea } from "@/components/atoms";
import { RoleSelect } from "@/components/molecules";
import { parseInviteList, validateInvite } from "@/lib/invites";
import { dist, dur, ease, useMotionMode } from "@/lib/motion";
import { useBouncerStore } from "@/store";
import type { UserRole } from "@/types";
import { useStepNav } from "./useStepNav";
import { InviteRow, type InviteRowModel } from "./InviteRow";
import "./invite.css";

const START_ROWS = 3;
const SCROLL_FROM_ROWS = 6; // inner scroll after about 5.5 rows
const NUDGE_PAST_ROWS = 10;
const DEFAULT_ROLE: UserRole = "reviewer";
const MOCK_LATENCY_MS = 600;

type RowError = { kind: "empty" | "invalid" | "wrong_domain" | "already_member" | "already_invited"; msg: string };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const isFixable = (e: RowError) => e.kind !== "already_member" && e.kind !== "already_invited";

/** Invite rows step (PC-29): one row per person, per-row role, paste a list, partial-success summary. */
export function InviteStep({
  orgName,
  domain,
  onDone,
}: {
  orgName: string;
  domain?: string;
  onDone: (result: { sent: number; skipped: boolean }) => void;
}) {
  const uid = useId();
  const nav = useStepNav();
  const toast = useToast();
  const mode = useMotionMode();
  const full = mode === "full";

  const counter = useRef(START_ROWS);
  const makeRow = (): InviteRowModel => {
    counter.current += 1;
    return { id: `${uid}-r${counter.current}`, email: "", role: DEFAULT_ROLE };
  };
  const [rows, setRows] = useState<InviteRowModel[]>(() =>
    Array.from({ length: START_ROWS }, (_, i) => ({ id: `${uid}-r${i + 1}`, email: "", role: DEFAULT_ROLE })),
  );
  const [errors, setErrors] = useState<Record<string, RowError>>({});
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const [bulkRole, setBulkRole] = useState<UserRole>(DEFAULT_ROLE);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [totalSent, setTotalSent] = useState(0);
  const [busy, setBusy] = useState(false);

  const inputs = useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = useRef<string | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    inputs.current.get(id)?.focus();
  });
  // First email focused on arrival.
  useEffect(() => {
    inputs.current.get(`${uid}-r1`)?.focus();
  }, [uid]);
  useEffect(() => {
    if (pasteOpen) pasteRef.current?.focus();
  }, [pasteOpen]);

  const bumpShake = (id: string) => setShakes((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
  const clearError = (id: string) =>
    setErrors((e) => {
      if (!e[id]) return e;
      const rest = { ...e };
      delete rest[id];
      return rest;
    });
  const failRow = (id: string) => {
    bumpShake(id);
    pendingFocus.current = id;
  };

  const filled = rows.filter((r) => r.email.trim());
  const count = filled.length;
  const hasFixable = Object.values(errors).some(isFixable);
  const isSummary = summary !== null && count > 0 && !hasFixable && filled.every((r) => errors[r.id]);

  const setEmail = (id: string, email: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, email } : r)));
    clearError(id);
  };
  const setRole = (id: string, role: UserRole) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, role } : r)));
  const removeRow = (id: string) => {
    clearError(id);
    if (rows.length <= 1) {
      // Never leave zero rows: removing the last one clears it.
      setRows((rs) => rs.map((r) => ({ ...r, email: "" })));
      pendingFocus.current = id;
      return;
    }
    const at = rows.findIndex((r) => r.id === id);
    const next = rows[at + 1] ?? rows[at - 1];
    setRows((rs) => rs.filter((r) => r.id !== id));
    pendingFocus.current = next.id;
  };
  const addRow = () => {
    const row = makeRow();
    setRows((rs) => [...rs, row]);
    pendingFocus.current = row.id;
  };

  /** Fills empty rows first (the pasted-into row before the others), then appends. */
  const addEmails = (list: string[], duplicates: number, startId?: string) => {
    const have = new Set(rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean));
    const fresh = list.filter((e) => !have.has(e));
    const skipped = duplicates + (list.length - fresh.length);
    if (fresh.length) {
      const next = rows.map((r) => ({ ...r }));
      const order = [...next.keys()];
      const startAt = next.findIndex((r) => r.id === startId);
      if (startAt > 0) order.unshift(...order.splice(startAt, 1));
      let i = 0;
      for (const idx of order) {
        if (i >= fresh.length) break;
        if (!next[idx].email.trim()) next[idx].email = fresh[i++];
      }
      while (i < fresh.length) next.push({ ...makeRow(), email: fresh[i++] });
      setRows(next);
      setErrors({});
      setSummary(null);
    }
    setNote(skipped ? `${plural(skipped, "duplicate", "duplicates")} skipped.` : null);
  };

  const onPasteInto = (id: string) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parsed = parseInviteList(e.clipboardData.getData("text"));
    if (parsed.emails.length + parsed.duplicates < 2) return; // a single address pastes normally
    e.preventDefault();
    addEmails(parsed.emails, parsed.duplicates, id);
  };

  const addPasted = () => {
    const parsed = parseInviteList(pasteText);
    if (!parsed.emails.length) return;
    addEmails(parsed.emails, parsed.duplicates);
    setPasteText("");
    setPasteOpen(false);
  };

  const setAll = (role: UserRole) => {
    setBulkRole(role);
    setRows((rs) => rs.map((r) => ({ ...r, role })));
  };

  const send = async () => {
    if (busy || finished.current) return;
    if (count === 0) {
      setErrors({ [rows[0].id]: { kind: "empty", msg: "Add at least one work email, or skip for now" } });
      failRow(rows[0].id);
      return;
    }
    const nextErrors: Record<string, RowError> = {};
    const valid: InviteRowModel[] = [];
    for (const r of filled) {
      const v = validateInvite(r.email, domain);
      if (v === "invalid") nextErrors[r.id] = { kind: "invalid", msg: "Enter a work email" };
      else if (v === "wrong_domain") nextErrors[r.id] = { kind: "wrong_domain", msg: `Use a ${domain} address` };
      else valid.push(r);
    }
    if (!valid.length) {
      setErrors(nextErrors);
      failRow(filled.find((r) => nextErrors[r.id])!.id);
      return;
    }

    setErrors({});
    setSummary(null);
    setBusy(true);
    await new Promise((res) => setTimeout(res, MOCK_LATENCY_MS));
    const results = await useBouncerStore.getState().sendInvites(
      valid.map((r) => ({ email: r.email.trim(), role: r.role })),
      undefined,
      { domain },
    );
    setBusy(false);

    const sentIds = new Set<string>();
    let already = 0;
    let invited = 0;
    valid.forEach((r, i) => {
      const status = results[i]?.status ?? "invalid";
      if (status === "sent") sentIds.add(r.id);
      else if (status === "already_member") {
        already += 1;
        nextErrors[r.id] = { kind: "already_member", msg: `Already in ${orgName}` };
      } else if (status === "already_invited") {
        invited += 1;
        nextErrors[r.id] = { kind: "already_invited", msg: "Already invited" };
      } else if (status === "wrong_domain") {
        nextErrors[r.id] = { kind: "wrong_domain", msg: `Use a ${domain} address` };
      } else {
        nextErrors[r.id] = { kind: "invalid", msg: "Enter a work email" };
      }
    });
    const toFix = Object.values(nextErrors).filter(isFixable).length;

    const sent = sentIds.size;
    const total = totalSent + sent;
    setTotalSent(total);
    if (sent) toast({ title: `${plural(sent, "invite", "invites")} sent`, tone: "success" });

    const remaining = filled.filter((r) => !sentIds.has(r.id));
    if (!remaining.length) {
      finished.current = true;
      onDone({ sent: total, skipped: false });
      return;
    }
    const parts = [sent ? `${plural(sent, "invite", "invites")} sent` : "No invites sent"];
    if (already) parts.push(`${already} already ${already === 1 ? "a member" : "members"}`);
    if (invited) parts.push(`${invited} already invited`);
    if (toFix) parts.push(`${toFix} to fix`);
    setSummary(parts.join(" · "));
    setRows(remaining);
    setErrors(nextErrors);
    const firstFix = remaining.find((r) => nextErrors[r.id] && isFixable(nextErrors[r.id]));
    if (firstFix) failRow(firstFix.id);
  };

  const leave = (skipped: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone({ sent: totalSent, skipped: skipped && totalSent === 0 });
  };

  const setRef = useCallback(
    (id: string) => (el: HTMLInputElement | null) => {
      if (el) inputs.current.set(id, el);
      else inputs.current.delete(id);
    },
    [],
  );

  const placeholder = `name@${domain ?? "yourbank.com"}`;
  const reveal = full
    ? {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1, transition: { duration: dur.standard, ease: ease.standard } },
        exit: { height: 0, opacity: 0, transition: { duration: dur.quick, ease: ease.exit } },
      }
    : {
        initial: mode === "off" ? false : { opacity: 0 },
        animate: { opacity: 1, transition: { duration: mode === "off" ? 0 : dur.reducedFade } },
        exit: { opacity: 0, transition: { duration: 0 } },
      };

  /** Cross-fades `node` when `n` changes (motion-spec §4); a plain span with motion off. */
  const swap = (n: number, node: React.ReactNode) =>
    mode === "off" ? (
      <span className="invite-num">{node}</span>
    ) : (
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={n}
          className="invite-num"
          initial={{ opacity: 0, y: full ? dist.icon : 0 }}
          animate={{ opacity: 1, y: 0, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.enter } }}
          exit={{ opacity: 0, transition: { duration: full ? dur.quick : dur.reducedFade, ease: ease.exit } }}
        >
          {node}
        </motion.span>
      </AnimatePresence>
    );

  return (
    <div className="invite-step">
      <h1 className="wel-title">Who else reviews reports?</h1>
      <p className="wel-sub">We&rsquo;ll invite them to {orgName}. They can start once you&rsquo;re in.</p>

      <div role="group" aria-labelledby={`${uid}-lb`}>
        <span className="invite-label" id={`${uid}-lb`}>
          Work emails
        </span>

        {rows.length > START_ROWS && (
          <div className="invite-bar">
            <span className="invite-setall">
              <span>Set all to</span>
              <RoleSelect id={`${uid}-bulk`} label="Set all roles to" value={bulkRole} onChange={setAll} />
            </span>
            <span className="invite-count" aria-live="polite">
              {swap(count, plural(count, "person", "people"))}
            </span>
          </div>
        )}

        <ul className={`invite-list${rows.length >= SCROLL_FROM_ROWS ? " is-scroll" : ""}`}>
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <InviteRow
                key={r.id}
                ref={setRef(r.id)}
                row={r}
                index={i}
                placeholder={placeholder}
                error={errors[r.id]?.msg}
                shakeKey={shakes[r.id] ?? 0}
                onEmail={(v) => setEmail(r.id, v)}
                onRole={(role) => setRole(r.id, role)}
                onRemove={() => removeRow(r.id)}
                onPaste={onPasteInto(r.id)}
                onEnter={i === rows.length - 1 ? addRow : () => inputs.current.get(rows[i + 1].id)?.focus()}
              />
            ))}
          </AnimatePresence>
        </ul>

        <div className="invite-tools">
          <button type="button" className="invite-link" onClick={addRow}>
            <Icon name="add" size={15} />
            Add another
          </button>
          <button type="button" className="invite-link" aria-expanded={pasteOpen} onClick={() => setPasteOpen((o) => !o)}>
            Paste a list
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {pasteOpen && (
          <motion.div key="paste" className="invite-paste" {...reveal}>
            <Textarea
              ref={pasteRef}
              aria-label="Paste a list of emails"
              placeholder="Paste emails separated by commas, spaces or new lines"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={addPasted}>
              Add to list
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {note && (
        <p className="invite-note" role="status">
          {note}
        </p>
      )}

      <AnimatePresence initial={false}>
        {rows.length > NUDGE_PAST_ROWS && (
          <motion.div key="nudge" className="invite-callout" {...reveal}>
            <Callout tone="info" icon="calendar">
              <strong>Inviting a bigger team?</strong> We can import a list or connect your sign-in system on a short
              call. <CalloutAction onClick={() => void nav.go("/welcome/call", 1)}>Book a call &rarr;</CalloutAction>
            </Callout>
          </motion.div>
        )}
      </AnimatePresence>

      {summary && (
        <p className="invite-summary" role="status">
          {summary}
        </p>
      )}

      <div className="invite-actions">
        {!isSummary && (
          <Button variant="ghost" onClick={() => leave(true)}>
            Skip for now
          </Button>
        )}
        <Button busy={busy} onClick={isSummary ? () => leave(false) : send}>
          {isSummary ? (
            "Continue"
          ) : count === 0 ? (
            "Send invites"
          ) : (
            <span>
              Send {swap(count, count)} {count === 1 ? "invite" : "invites"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
