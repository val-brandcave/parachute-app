"use client";

import { useState } from "react";
import { Callout, Dialog, useToast } from "@realwired/ui";
import { Button, Chip, Icon, Illustration, Input, Label } from "@/components/atoms";
import {
  CONTACT,
  DOCS_NOTE,
  DOCS_TITLE,
  FACTS,
  GLANCE_TITLE,
  PACK_DOCS,
  PLACEHOLDER_LABEL,
  REQUEST_DESC,
  REQUEST_TITLE,
  SHARED,
  TRUST_INTRO,
  TRUST_TITLE,
  type PackDoc,
} from "@/lib/security-pack";
import { formatDayMonth, formatStamp } from "@/lib/utils";
import { SendToItDialog } from "./SendToItDialog";
import { useTrustSend } from "./useTrustSend";
import "./trust.css";

export type TrustMode = "signed-in" | "public";

const PlaceholderChip = () => <Chip tone="flag">{PLACEHOLDER_LABEL}</Chip>;

/**
 * Trust Center (spec §5.10): hero, documents, "At a glance" facts, contact line.
 * `signed-in` adds Send to IT; `public` is the no-account view IT receives (no shell).
 */
export function TrustCenter({ mode = "signed-in", expired = false }: { mode?: TrustMode; expired?: boolean }) {
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const [email, setEmail] = useState("");
  const isPublic = mode === "public";

  const copyLink = async () => {
    const url = `${window.location.origin}/shared/trust/${SHARED.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Anyone with the link can read the Trust Center.", tone: "success" });
    } catch {
      toast({ title: "Copy this link", description: url, tone: "info" });
    }
  };

  const openDoc = (d: PackDoc) => {
    if (d.access === "request") {
      setRequesting(true);
      return;
    }
    toast({ title: d.title, description: "Downloads arrive with the real documents.", tone: "info" });
  };

  if (expired) {
    return (
      <div className="tc tc--public">
        <div className="tc-expired">
          <Illustration name="09b-approval-pending" size={120} panel />
          <h1 className="tc-h1">This link has expired</h1>
          <p className="tc-lead">
            Links to the Trust Center last a limited time. Ask {SHARED.by} at {SHARED.org} to send a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isPublic ? "tc tc--public" : "tc"}>
      {isPublic && (
        <p className="tc-shared">
          <Icon name="shield" size={16} /> Shared by {SHARED.by}, {SHARED.org}
        </p>
      )}
      <section className="tc-hero">
        <div className="tc-hero-text">
          <h1 className="tc-h1">{TRUST_TITLE}</h1>
          <p className="tc-lead">{TRUST_INTRO}</p>
          {!isPublic && <SignedInActions onCopy={copyLink} />}
        </div>
        <div className="tc-hero-art">
          <Illustration name="21-scene-trust-center" size={420} />
        </div>
      </section>

      <div className="tc-grid">
        <section className="tc-card" aria-labelledby="tc-docs-h">
          <div className="tc-card-head">
            <h2 id="tc-docs-h" className="tc-h2">
              {DOCS_TITLE}
            </h2>
            <span className="tc-muted">{DOCS_NOTE}</span>
          </div>
          <ul className="tc-docs">
            {PACK_DOCS.map((d) => {
              const verb = d.access === "request" ? "Request access" : d.access === "view" ? "View" : "Download";
              return (
                <li key={d.id} className="tc-doc">
                  <span className="tc-doc-ic" aria-hidden="true">
                    <Icon name={d.icon} size={18} />
                  </span>
                  <span className="tc-doc-body">
                    <span className="tc-doc-title">
                      {d.title}
                      {d.placeholder && <PlaceholderChip />}
                    </span>
                    <span className="tc-doc-desc">
                      {d.desc} · {d.meta}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={d.access === "request" ? "key" : d.access === "view" ? "external" : "download"}
                    aria-label={`${verb}: ${d.title}`}
                    onClick={() => openDoc(d)}
                  >
                    {verb}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="tc-card" aria-labelledby="tc-glance-h">
          <h2 id="tc-glance-h" className="tc-h2">
            {GLANCE_TITLE}
          </h2>
          <dl className="tc-facts">
            {FACTS.map((f) => (
              <div key={f.id} className="tc-fact">
                <dt>{f.label}</dt>
                <dd>
                  {f.value && <span>{f.value}</span>}
                  {f.placeholder && <PlaceholderChip />}
                </dd>
              </div>
            ))}
          </dl>
          <p className="tc-contact">
            <span>
              {CONTACT.lead} <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
            </span>
            {CONTACT.placeholder && <PlaceholderChip />}
          </p>
        </aside>
      </div>

      <RequestAccessDialog open={requesting} onClose={() => setRequesting(false)} email={email} setEmail={setEmail} />
    </div>
  );
}

/** Send to IT + Copy link, and this org's latest send. Only an org admin can send; others get the reason. */
function SignedInActions({ onCopy }: { onCopy: () => void }) {
  const toast = useToast();
  const state = useTrustSend();
  const [open, setOpen] = useState(false);
  const last = state.sends[state.sends.length - 1];

  const trySend = () => {
    if (!state.canSend) {
      toast({ title: "Only an org admin can send this", description: `Ask ${state.adminFirst ?? "your admin"} to send it to IT.`, tone: "info" });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div className="tc-actions">
        <Button
          iconLeft="send"
          aria-disabled={state.canSend ? undefined : true}
          aria-describedby={state.canSend ? undefined : "tc-send-why"}
          onClick={trySend}
        >
          Send to IT
        </Button>
        <Button variant="outline" iconLeft="copy" onClick={onCopy}>
          Copy link
        </Button>
      </div>
      {!state.canSend && (
        <p id="tc-send-why" className="tc-note">
          Only an org admin can send it. Ask {state.adminFirst ?? "your admin"}.
        </p>
      )}
      {last && (
        <div className="tc-sent">
          <Callout tone="success">
            Sent to {last.to} · {formatStamp(last.sentAt)} · link expires {formatDayMonth(last.expiresAt)}
          </Callout>
        </div>
      )}
      <SendToItDialog open={open} onClose={() => setOpen(false)} state={state} />
    </>
  );
}

/** NDA-gated request: a short form, never a dead link. */
function RequestAccessDialog({
  open,
  onClose,
  email,
  setEmail,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim() || !email.includes("@")) {
      setError("Add your name and a work email so we can send the NDA.");
      return;
    }
    setError(null);
    setSent(true);
  };
  const close = () => {
    onClose();
    window.setTimeout(() => {
      setSent(false);
      setError(null);
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
      size="sm"
      title={REQUEST_TITLE}
      description={REQUEST_DESC}
      className="tc-dlg"
      footer={
        sent ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button iconLeft="send" onClick={submit}>
              Send request
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <Callout tone="success">Request sent. We will email the NDA to {email}, usually within 2 business days.</Callout>
      ) : (
        <div className="tc-form">
          <div className="field">
            <Label htmlFor="tc-req-name">Your name</Label>
            <Input id="tc-req-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <Label htmlFor="tc-req-email">Work email</Label>
            <Input id="tc-req-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <Label htmlFor="tc-req-org">Bank or organization</Label>
            <Input id="tc-req-org" value={org} onChange={(e) => setOrg(e.target.value)} />
          </div>
          {error && (
            <p className="tc-err" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
