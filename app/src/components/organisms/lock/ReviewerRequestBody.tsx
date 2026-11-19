"use client";

import { useEffect, useId, useState } from "react";
import { Button, Icon, Illustration, Label, Textarea } from "@/components/atoms";
import { canRequest, isLive } from "@/lib/credit-requests";
import { useCurrentUser } from "@/lib/current-user";
import { formatShortDate } from "@/lib/utils";
import { useCreditRequestStore } from "@/store/credit-request.store";
import { useLockStore } from "@/store/lock.store";
import type { LockCtx } from "../LockDialog";

/**
 * A non-admin asks the org admin for credits (spec §5.5 "Credits, reviewer", §5.9).
 * Writes the same `CreditRequest` Billing does (adapter-backed, survives reload). One
 * live request per requester (`canRequest`): with one already open it says so instead
 * of offering a second ask. Spot 10b → 15-request-sent once sent.
 */
export function ReviewerRequestBody({ ctx, title }: { ctx: LockCtx; title: string }) {
  const me = useCurrentUser();
  const requests = useCreditRequestStore((s) => s.requests);
  const loaded = useCreditRequestStore((s) => s.loaded);
  // The shortfall the lock names ("You need 2 more credits") rides along as the asked amount.
  const needed = useLockStore((s) => (s.reason?.kind === "credits" ? s.reason.needed : undefined));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const noteId = useId();

  useEffect(() => {
    if (!loaded) void useCreditRequestStore.getState().fetchRequests();
  }, [loaded]);

  const mine = requests.filter((r) => r.orgId === me.orgId);
  const live = mine
    .filter((r) => r.requesterId === me.id && isLive(r))
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (sent) {
    return (
      <div className="lock-body" role="status">
        <span className="lock-art" data-spot="15-request-sent">
          <Illustration name="15-request-sent" size={100} />
        </span>
        <h2 className="lock-title">
          <span className="lock-title-ic" aria-hidden="true">
            <Icon name="check-circle" size={20} />
          </span>
          Requested · {ctx.adminFirst} will be notified
        </h2>
        <p className="lock-copy">
          {`${ctx.adminLead} gets your request by email and in Parachute. You'll see it on Billing until it's answered.`}
        </p>
        <div className="lock-acts">
          <Button onClick={ctx.close}>Done</Button>
        </div>
      </div>
    );
  }

  if (loaded && live && !canRequest(mine, me.id)) {
    return (
      <div className="lock-body">
        <span className="lock-art" data-spot="15-request-sent">
          <Illustration name="15-request-sent" size={100} />
        </span>
        <h2 className="lock-title">You already asked {ctx.adminFirst}</h2>
        <p className="lock-copy">
          {`${ctx.adminLead} has your request from ${formatShortDate(live.createdAt)}. You'll see it on Billing when credits are added.`}
        </p>
        <div className="lock-acts">
          <Button onClick={ctx.close}>Got it</Button>
        </div>
      </div>
    );
  }

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    const row = await useCreditRequestStore.getState().request({ note, credits: needed });
    setBusy(false);
    // null = a live request turned up meanwhile; the "already asked" view takes over.
    if (row) setSent(true);
  };

  return (
    <div className="lock-body">
      <span className="lock-art" data-spot="10b-locked-feature">
        <Illustration name="10b-locked-feature" size={100} />
      </span>
      <h2 className="lock-title">{title}</h2>
      <p className="lock-copy">
        Only admins can buy credits. {ctx.adminLead} gets your request by email and in Parachute.
      </p>
      <div className="lock-field">
        <Label htmlFor={noteId}>Note for {ctx.adminFirst} (optional)</Label>
        <Textarea
          id={noteId}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: 3 reports due Friday"
        />
      </div>
      <div className="lock-acts">
        <Button variant="ghost" className="lock-acts-start" onClick={ctx.close}>
          Not now
        </Button>
        <Button iconLeft="send" busy={busy || !loaded} onClick={ask}>
          Ask {ctx.adminFirst} for more credits
        </Button>
      </div>
    </div>
  );
}
