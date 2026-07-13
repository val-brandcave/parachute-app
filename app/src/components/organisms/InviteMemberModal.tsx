"use client";

import { useState } from "react";
import { Modal, Button, Input, Label } from "@/components/atoms";
import { ASSIGNABLE_ROLES, ROLE_META } from "@/lib/member-roles";
import type { UserRole } from "@/types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Focused task: invite one teammate by email at a chosen role. Centered Modal
 *  (short form) per the surface taxonomy — not a route or a stepper. */
export function InviteMemberModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("reviewer");
  const valid = EMAIL_RE.test(email.trim());

  const submit = () => {
    if (!valid) return;
    onInvite(email.trim(), role);
    setEmail("");
    setRole("reviewer");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a member" size="sm">
      <div className="inv-form">
        <div className="field">
          <Label htmlFor="inv-email">Email address</Label>
          <Input
            id="inv-email"
            type="email"
            autoFocus
            placeholder="name@meridiantrust.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        <div className="field">
          <Label>Role</Label>
          <div className="inv-roles" role="radiogroup" aria-label="Role">
            {ASSIGNABLE_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                role="radio"
                aria-checked={role === r}
                className={`inv-role${role === r ? " is-on" : ""}`}
                onClick={() => setRole(r)}
              >
                <span className="inv-role-radio" aria-hidden="true" />
                <span className="inv-role-text">
                  <span className="inv-role-label">{ROLE_META[r].label}</span>
                  <span className="inv-role-desc">{ROLE_META[r].desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="inv-foot">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button iconLeft="forward" disabled={!valid} onClick={submit}>
            Send invite
          </Button>
        </div>
      </div>
    </Modal>
  );
}
