"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Button, Icon, Label, Modal, Textarea } from "@/components/atoms";
import { INVITE_LIFE_DAYS } from "@/data/seed/invites.seed";
import { ROLE_META } from "@/lib/member-roles";
import type { UserRole } from "@/types";
import type { BouncerAdmin } from "../useBouncerAdmin";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** What each role can do, in Realwired Admin's words. */
const ROLE_COPY: Record<UserRole, string> = {
  reviewer: "Runs reviews and works through findings.",
  approver: "Does everything a reviewer does, and signs off workbooks.",
  org_admin: "Manages members, billing and settings.",
};
const ROLE_CHOICES: UserRole[] = ["reviewer", "approver", "org_admin"];

type ChipState = "ok" | "invalid" | "member" | "pending";

/** Split pasted or typed text into addresses. */
const tokens = (text: string) => text.split(/[\s,;]+/).filter(Boolean);

export function InviteDialog({
  open,
  onClose,
  admin,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  admin: BouncerAdmin;
  onSent: () => void;
}) {
  const { domain, members, pending, sendInvites } = admin;
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<UserRole>("reviewer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const stateOf = (email: string): ChipState => {
    const e = email.toLowerCase();
    if (!EMAIL_RE.test(e)) return "invalid";
    if (members.some((m) => m.email?.toLowerCase() === e)) return "member";
    if (pending.some((p) => p.email.toLowerCase() === e)) return "pending";
    return "ok";
  };

  const commit = (text: string) => {
    const incoming = tokens(text);
    if (incoming.length === 0) return;
    setChips((cur) => {
      const have = new Set(cur.map((c) => c.toLowerCase()));
      const next = [...cur];
      for (const t of incoming) {
        if (!have.has(t.toLowerCase())) {
          have.add(t.toLowerCase());
          next.push(t);
        }
      }
      return next;
    });
    setDraft("");
  };

  const states = useMemo(() => chips.map((c) => stateOf(c)), [chips, members, pending]); // eslint-disable-line react-hooks/exhaustive-deps
  const bad = states.filter((s) => s !== "ok").length;
  const outside = domain
    ? chips.filter((c, i) => states[i] === "ok" && c.toLowerCase().split("@")[1] !== domain)
    : [];
  const draftValid = EMAIL_RE.test(draft.trim());
  const count = chips.length + (draftValid ? 1 : 0);
  const canSend = count > 0 && bad === 0 && (draft.trim() === "" || draftValid);

  const reset = () => {
    setChips([]);
    setDraft("");
    setRole("reviewer");
    setMessage("");
    setBusy(false);
  };
  const close = () => {
    onClose();
    reset();
  };

  const send = async () => {
    if (!canSend || busy) return;
    setBusy(true);
    const all = draftValid ? [...chips, draft.trim()] : chips;
    await sendInvites(all, role, message);
    reset();
    onSent();
  };

  const reasonFor = (s: ChipState) =>
    s === "invalid" ? "Not a valid e-mail" : s === "member" ? "Already a member" : s === "pending" ? "Already invited" : "";

  return (
    <Modal open={open} onClose={close} title="Invite people" size="sm">
      <div className="bx-invite">
        <div className="bx-field">
          <Label htmlFor={`${uid}-emails`}>E-mail addresses</Label>
          <div
            className="ui-input bx-chipbox"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                inputRef.current?.focus();
              }
            }}
          >
            {chips.map((c, i) => (
              <span key={c} className={`bx-chip${states[i] === "ok" ? "" : " is-bad"}`} title={reasonFor(states[i])}>
                {c}
                <button
                  type="button"
                  aria-label={`Remove ${c}`}
                  onClick={() => setChips((cur) => cur.filter((x) => x !== c))}
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
            <input
              id={`${uid}-emails`}
              ref={inputRef}
              className="bx-chipinput"
              type="text"
              value={draft}
              placeholder={chips.length === 0 ? "name@company.com" : ""}
              autoComplete="off"
              onChange={(e) => {
                const v = e.target.value;
                if (/[\s,;]$/.test(v)) commit(v);
                else setDraft(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (draft.trim()) commit(draft);
                  else void send();
                } else if (e.key === "Backspace" && !draft && chips.length) {
                  setChips((cur) => cur.slice(0, -1));
                }
              }}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                if (tokens(t).length > 1) {
                  e.preventDefault();
                  commit(t);
                }
              }}
              onBlur={() => draft.trim() && commit(draft)}
            />
          </div>
          {bad > 0 ? (
            <p className="bx-msg bx-msg--err" role="alert">
              {bad === 1 ? "1 address needs a fix or removing" : `${bad} addresses need a fix or removing`}. Hover a red
              chip to see why.
            </p>
          ) : outside.length > 0 ? (
            <p className="bx-msg bx-msg--warn">
              <Icon name="warn" size={14} />
              {outside.length === 1 ? `${outside[0]} is` : `${outside.length} addresses are`} outside {domain}. They can
              still join.
            </p>
          ) : (
            <p className="bx-msg">Press Enter or comma after each address. You can paste a list.</p>
          )}
        </div>

        <div className="bx-field">
          <span className="ui-label" id={`${uid}-role`}>
            Role
          </span>
          <div className="bx-roles" role="radiogroup" aria-labelledby={`${uid}-role`}>
            {ROLE_CHOICES.map((r) => (
              <label key={r} className={`bx-role${role === r ? " is-on" : ""}`}>
                <input type="radio" name={`${uid}-role`} checked={role === r} onChange={() => setRole(r)} />
                <span className="bx-role-dot" aria-hidden="true" />
                <span className="bx-role-text">
                  <span className="bx-role-name">{ROLE_META[r].label}</span>
                  <span className="bx-role-desc">{ROLE_COPY[r]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bx-field">
          <Label htmlFor={`${uid}-msg`}>
            Message <span className="bx-opt">(optional)</span>
          </Label>
          <Textarea
            id={`${uid}-msg`}
            rows={3}
            value={message}
            placeholder="Add a note to the invite e-mail"
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="bx-invite-foot">
          <span className="bx-faint">Invites expire after {INVITE_LIFE_DAYS} days.</span>
          <span className="bx-invite-actions">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button iconLeft="send" disabled={!canSend || busy} onClick={() => void send()}>
              Send invites
            </Button>
          </span>
        </div>
      </div>
    </Modal>
  );
}
