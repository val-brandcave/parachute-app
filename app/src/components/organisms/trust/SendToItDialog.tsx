"use client";

import { useState } from "react";
import { Callout, Dialog } from "@realwired/ui";
import { Button, Input, Label, Textarea } from "@/components/atoms";
import { SEND_DESC, SEND_EXPIRY, SEND_NOTE_PLACEHOLDER, SEND_TITLE } from "@/lib/security-pack";
import { formatDayMonth } from "@/lib/utils";
import type { SecuritySend } from "@/types";
import type { useTrustSend } from "./useTrustSend";

/** "Send to IT": one link to the Trust Center. Sending completes the `security_pack` setup step. */
export function SendToItDialog({
  open,
  onClose,
  state,
}: {
  open: boolean;
  onClose: () => void;
  state: ReturnType<typeof useTrustSend>;
}) {
  const { email, setEmail, note, setNote, sending, send } = state;
  const [sent, setSent] = useState<SecuritySend | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.includes("@")) {
      setError("Enter your IT contact's email address.");
      return;
    }
    setError(null);
    const s = await send();
    if (s) setSent(s);
  };
  const close = () => {
    onClose();
    // Reset after the exit animation so the form is fresh next time.
    window.setTimeout(() => {
      setSent(null);
      setError(null);
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
      size="sm"
      title={SEND_TITLE}
      description={SEND_DESC}
      className="tc-dlg"
      footer={
        sent ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button iconLeft="send" aria-busy={sending} onClick={() => void submit()}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <Callout tone="success">
          Sent to {sent.to} · link expires {formatDayMonth(sent.expiresAt)}. {SEND_EXPIRY}
        </Callout>
      ) : (
        <div className="tc-form">
          <div className="field">
            <Label htmlFor="tc-send-email">IT or vendor-risk contact</Label>
            <Input
              id="tc-send-email"
              type="email"
              value={email}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "tc-send-err" : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p id="tc-send-err" className="tc-err" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="field">
            <Label htmlFor="tc-send-note">Note</Label>
            <Textarea id="tc-send-note" rows={4} value={note} placeholder={SEND_NOTE_PLACEHOLDER} onChange={(e) => setNote(e.target.value)} />
          </div>
          <p className="tc-note">{SEND_EXPIRY}</p>
        </div>
      )}
    </Dialog>
  );
}
