"use client";

import { useState } from "react";
import { Button, Chip, Icon } from "@/components/atoms";
import { ROLE_META } from "@/lib/member-roles";
import { formatDayMonth } from "@/lib/utils";
import type { BouncerAdmin } from "../useBouncerAdmin";

/** Pending invites with Resend, an inline-confirmed Revoke, and the prototype-only Simulate accept. */
export function PendingTable({ admin, onInvite }: { admin: BouncerAdmin; onInvite: () => void }) {
  const { pending, inviter, resend, revoke, simulateAccept, canManage } = admin;
  const [confirming, setConfirming] = useState<string | null>(null);

  if (pending.length === 0) {
    return (
      <div className="card bx-card bx-empty">
        <span className="bx-empty-ic" aria-hidden="true">
          <Icon name="mail" size={20} />
        </span>
        <h2>No pending invites</h2>
        <p>Invites you send show up here until they&rsquo;re accepted, revoked or expired.</p>
        {canManage && (
          <Button variant="outline" iconLeft="user-plus" onClick={onInvite}>
            Invite people
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="card bx-card">
      <div className="bx-table" role="table" aria-label="Pending invites">
        <div className="bx-row bx-row--head bx-row--pending" role="row">
          <span role="columnheader">E-mail</span>
          <span role="columnheader">Role</span>
          <span role="columnheader">Invited by</span>
          <span role="columnheader">Sent</span>
          <span role="columnheader">Expires</span>
          <span role="columnheader" aria-label="Actions" />
        </div>
        {pending.map((inv) => (
          <div className="bx-row bx-row--pending" role="row" key={inv.id}>
            <span className="bx-person" role="cell">
              <span className="bx-mail-ic" aria-hidden="true">
                <Icon name="mail" size={15} />
              </span>
              <span className="bx-person-name bx-ellip">{inv.email}</span>
            </span>
            <span role="cell">
              <Chip tone={ROLE_META[inv.role].tone}>{ROLE_META[inv.role].label}</Chip>
            </span>
            <span className="bx-faint" role="cell">
              {inviter(inv.invitedById)}
            </span>
            <span className="bx-faint" role="cell">
              {formatDayMonth(inv.sentAt)}
            </span>
            <span className="bx-faint" role="cell">
              {formatDayMonth(inv.expiresAt)}
            </span>
            <span className="bx-actions" role="cell">
              {!canManage ? null : confirming === inv.id ? (
                <span className="bx-confirm" role="group" aria-label={`Revoke invite for ${inv.email}`}>
                  <span>Revoke this invite?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                    Keep
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setConfirming(null);
                      void revoke(inv.id, inv.email);
                    }}
                  >
                    Revoke
                  </Button>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="bx-sim"
                    title="Prototype only: acts as the invitee clicking the link"
                    onClick={() => void simulateAccept(inv.id)}
                  >
                    Simulate accept
                  </button>
                  <Button size="sm" variant="outline" onClick={() => void resend(inv.id, inv.email)}>
                    Resend
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(inv.id)}>
                    Revoke
                  </Button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
