"use client";

import { useEffect, useRef } from "react";
import { FileRow, Callout, useToast } from "@realwired/ui";
import { Button, Icon, Textarea, Input, Label } from "@/components/atoms";
import { PageHeader } from "@/components/templates/PageHeader";
import {
  GAPS,
  GAPS_INTRO,
  GAPS_OWNER,
  GAPS_TITLE,
  PACK_DOCS,
  PACK_INTRO,
  PACK_LIST_DESC,
  PACK_VERSION_LABEL,
  SEND_DESC,
  SEND_EXPIRY,
  SEND_NOTE_PLACEHOLDER,
  SEND_TITLE,
  VENDOR_PORTAL,
} from "@/lib/security-pack";
import { formatDayMonth, formatStamp } from "@/lib/utils";
import { useSecurityPack } from "./hooks/useSecurityPack";

export default function SecurityPackPage() {
  const toast = useToast();
  const sendRef = useRef<HTMLElement>(null);
  const { email, setEmail, note, setNote, sends, canSend, sending, send, adminFirst } = useSecurityPack();
  const last = sends[sends.length - 1];

  // `#send` deep link (Home "Email to IT") lands on the send card.
  useEffect(() => {
    if (window.location.hash === "#send") sendRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const focusSend = () => {
    sendRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    sendRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  };
  const stub = (title: string, description: string) => toast({ title, description, tone: "info" });

  return (
    <>
      <PageHeader
        title="Security pack"
        actions={
          <>
            <Button variant="ghost" iconLeft="download" onClick={() => stub("Security pack", "The zip download arrives with the real documents.")}>
              Download all
            </Button>
            <Button iconLeft="send" onClick={focusSend}>
              Send to IT
            </Button>
          </>
        }
      />
      <div className="pagebody">
        <p className="sec-intro">{PACK_INTRO}</p>
        <div className="sec-grid">
          <section className="card sec-card">
            <div className="sec-card-head">
              <div>
                <h2 className="hm-h">What’s in the pack</h2>
                <p className="hm-p">{PACK_LIST_DESC}</p>
              </div>
              <span className="su-pill su-pill--outline">{PACK_VERSION_LABEL}</span>
            </div>
            <div className="sec-files">
              {PACK_DOCS.map((d) => (
                <FileRow
                  key={d.id}
                  icon={d.icon}
                  name={d.title}
                  meta={[d.desc, d.access === "request" ? null : [d.format, d.pages].filter(Boolean).join(" · ")]
                    .filter(Boolean)
                    .join(" · ")}
                  actions={
                    d.access === "request" ? (
                      <Button variant="outline" size="sm" iconLeft="key" onClick={() => stub("Access requested", "We will send the NDA to your admin.")}>
                        Request access
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" iconLeft="download" onClick={() => stub(d.title, "Downloads arrive with the real documents.")}>
                        {d.format}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          </section>

          <div className="sec-side">
            <section className="card sec-card" id="send" ref={sendRef}>
              <h2 className="hm-h">{SEND_TITLE}</h2>
              <p className="hm-p">{SEND_DESC}</p>
              {last && (
                <div className="sec-sent">
                  <Callout tone="success">
                    Sent to {last.to} · {formatStamp(last.sentAt)} · link expires {formatDayMonth(last.expiresAt)}
                  </Callout>
                </div>
              )}
              <div className="field">
                <Label htmlFor="sec-email">IT or vendor-risk contact</Label>
                <Input id="sec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canSend} />
              </div>
              <div className="field">
                <Label htmlFor="sec-note">Note</Label>
                <Textarea id="sec-note" rows={4} value={note} placeholder={SEND_NOTE_PLACEHOLDER} onChange={(e) => setNote(e.target.value)} disabled={!canSend} />
              </div>
              <Button block iconLeft="send" disabled={!canSend || sending || !email.includes("@")} onClick={send}>
                Send pack
              </Button>
              {!canSend && <p className="hm-note">Only an org admin can send the pack. Ask {adminFirst ?? "your admin"}.</p>}
              <p className="hm-note">{SEND_EXPIRY}</p>
            </section>

            {sends.length > 0 && (
              <section className="card sec-card">
                <h2 className="hm-h">Sent log</h2>
                <ul className="sec-log">
                  {[...sends].reverse().map((s) => (
                    <li key={s.id}>
                      <span className="sec-log-to">{s.to}</span>
                      <span className="sec-log-when">
                        {formatStamp(s.sentAt)} · expires {formatDayMonth(s.expiresAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="sec-gaps">
              <div className="sec-card-head">
                <h2 className="hm-h">{GAPS_TITLE}</h2>
                <span className="su-pill su-pill--warn">{GAPS_OWNER}</span>
              </div>
              <p className="hm-p">{GAPS_INTRO}</p>
              <ul className="sec-gap-list">
                {GAPS.map((g) => (
                  <li key={g.title}>
                    <span className="sec-gap-dot" aria-hidden="true" />
                    <span>
                      <b>{g.title}</b> — {g.body}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <a className="hm-link sec-portal" href={VENDOR_PORTAL.href} target="_blank" rel="noreferrer">
              {VENDOR_PORTAL.label} <Icon name="external" size={14} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
