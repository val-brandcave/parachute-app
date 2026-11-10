"use client";

import { Avatar, Chip, Icon, Tooltip } from "@/components/atoms";
import { ASSIGNABLE_ROLES, ROLE_META, STATUS_META, relativeTime } from "@/lib/member-roles";
import type { UserRole } from "@/types";
import type { BouncerAdmin } from "../useBouncerAdmin";

/** Members of this org. Roles are edited here; Parachute only mirrors the list. */
export function MembersTable({ admin }: { admin: BouncerAdmin }) {
  const { members, ownerId, me, anchor, changeRole, canManage } = admin;
  return (
    <>
      <div className="card bx-card">
        <div className="bx-table" role="table" aria-label="Members">
          <div className="bx-row bx-row--head bx-row--members" role="row">
            <span role="columnheader">Member</span>
            <span role="columnheader">E-mail</span>
            <span role="columnheader">Role</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Last active</span>
          </div>
          {members.map((m) => {
            const status = m.status ?? "active";
            const isOwner = m.id === ownerId;
            const isYou = m.id === me.id;
            return (
              <div className="bx-row bx-row--members" role="row" key={m.id}>
                <span className="bx-person" role="cell">
                  <Avatar initials={m.initials} size={32} tone="soft" />
                  <span className="bx-person-name">
                    {m.name}
                    {isYou && <span className="bx-you">You</span>}
                  </span>
                </span>
                <span className="bx-faint bx-ellip" role="cell">
                  {m.email ?? "—"}
                </span>
                <span role="cell">
                  {isOwner || isYou || !canManage ? (
                    <Tooltip
                      content={
                        !canManage
                          ? "Only an org admin can change roles."
                          : isOwner
                            ? "Account holder. Role can't be changed."
                            : "You can't change your own role."
                      }
                      side="top"
                      compact
                    >
                      <span className="bx-locked">
                        <Chip tone={ROLE_META[m.role].tone}>{ROLE_META[m.role].label}</Chip>
                        <Icon name="lock" size={13} />
                      </span>
                    </Tooltip>
                  ) : (
                    <select
                      className="ui-input bx-select"
                      aria-label={`Role for ${m.name}`}
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value as UserRole)}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_META[r].label}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
                <span role="cell">
                  <Chip tone={STATUS_META[status].tone} dot={status === "active"}>
                    {STATUS_META[status].label}
                  </Chip>
                </span>
                <span className="bx-faint" role="cell">
                  {relativeTime(m.lastActiveAt, anchor)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="bx-hint">
        Approvers can also review, so an approver never needs a second role. Org admins manage members, billing and
        settings.
      </p>
    </>
  );
}
