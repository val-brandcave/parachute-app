"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Chip, Icon, Tooltip } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { InviteMemberModal } from "./InviteMemberModal";
import { useReviewsStore, useUsersStore } from "@/store";
import {
  ASSIGNABLE_ROLES,
  ROLE_META,
  ROLE_ORDER,
  STATUS_META,
  relativeTime,
} from "@/lib/member-roles";
import { CURRENT_USER } from "@/lib/current-user";

// Fixed "now" for relative times — render must not call Date.now(); matches the
// seed's NOW anchor so "2 hours ago" reads correctly in the prototype.
const NOW = 1_752_000_000_000;

type SortKey = "member" | "role" | "status" | "reviews" | "lastActive";
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;
const STATUS_ORDER: Record<string, number> = { active: 0, invited: 1, deactivated: 2 };

export function MembersPanel() {
  const { users, fetchUsers, inviteMember, changeRole, setStatus, removeMember } =
    useUsersStore();
  const { reviews, fetchReviews } = useReviewsStore();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [resent, setResent] = useState<Set<string>>(new Set());
  // null = the smart default (role-grouped). Headers cycle asc → desc → default.
  const [sort, setSort] = useState<Sort>(null);

  useEffect(() => {
    fetchUsers();
    fetchReviews();
  }, [fetchUsers, fetchReviews]);

  // Active reviews assigned to each member (in-flight only), derived from the
  // queue — a real signal before deactivating or removing someone.
  const activeByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reviews) {
      if (r.status === "completed" || r.status === "autorejected") continue;
      map.set(r.assigneeId, (map.get(r.assigneeId) ?? 0) + 1);
    }
    return map;
  }, [reviews]);

  const activeReviews = (id: string, status: string) =>
    status === "invited" ? -1 : activeByUser.get(id) ?? 0;

  const rows = useMemo(() => {
    const base = [...users];
    const byRoleThenName = (a: (typeof base)[number], b: (typeof base)[number]) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      a.name.localeCompare(b.name);

    if (!sort) return base.sort(byRoleThenName);

    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (u: (typeof base)[number]): number | string => {
      switch (sort.key) {
        case "member":
          return u.name.toLowerCase();
        case "role":
          return ROLE_ORDER.indexOf(u.role);
        case "status":
          return STATUS_ORDER[u.status ?? "active"];
        case "reviews":
          return activeReviews(u.id, u.status ?? "active");
        case "lastActive":
          return u.lastActiveAt ?? 0;
      }
    };
    return base.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp * dir || a.name.localeCompare(b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, sort, activeByUser]);

  const cycleSort = (key: SortKey) =>
    setSort((s) =>
      !s || s.key !== key
        ? { key, dir: "asc" }
        : s.dir === "asc"
          ? { key, dir: "desc" }
          : null,
    );

  const activeCount = users.filter((u) => (u.status ?? "active") !== "deactivated").length;
  const resendInvite = (id: string) => setResent((s) => new Set(s).add(id));

  // A render helper (not a component) so header state stays put across renders.
  const sortHeader = (k: SortKey, label: string) => {
    const active = sort?.key === k;
    return (
      <button
        type="button"
        className={`mbr-th${active ? " is-sorted" : ""}`}
        onClick={() => cycleSort(k)}
        role="columnheader"
        aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        <Icon
          name={active ? (sort!.dir === "asc" ? "arrow-up" : "arrow-down") : "sort"}
          size={13}
          className="mbr-th-ic"
        />
      </button>
    );
  };

  return (
    <>
      <div className="mbr-head">
        <div>
          <div className="mbr-head-title">Team members</div>
          <div className="mbr-head-sub">
            {activeCount} active {activeCount === 1 ? "member" : "members"} · {users.length} total
          </div>
        </div>
        <Button iconLeft="add" onClick={() => setInviteOpen(true)}>
          Invite member
        </Button>
      </div>

      <div className="mbr-table" role="table" aria-label="Team members">
        <div className="mbr-row mbr-row--head" role="row">
          {sortHeader("member", "Member")}
          {sortHeader("role", "Role")}
          {sortHeader("status", "Status")}
          {sortHeader("reviews", "Active reviews")}
          {sortHeader("lastActive", "Last active")}
          <span role="columnheader" aria-label="Actions" />
        </div>

        {rows.map((m) => {
          const status = m.status ?? "active";
          const isOwner = m.role === "owner";
          const isYou = m.id === CURRENT_USER.id;
          const wasResent = resent.has(m.id);

          const items: ActionItem[] = [
            { header: true, label: "Change role" },
            ...ASSIGNABLE_ROLES.map((r) => ({
              label: ROLE_META[r].label,
              selected: m.role === r,
              onClick: () => changeRole(m.id, r),
            })),
            { divider: true },
            ...(status === "invited"
              ? [
                  {
                    label: "Resend invite",
                    icon: "refresh" as const,
                    onClick: () => resendInvite(m.id),
                  },
                ]
              : []),
            status === "deactivated"
              ? {
                  label: "Reactivate",
                  icon: "check-circle" as const,
                  onClick: () => setStatus(m.id, "active"),
                }
              : {
                  label: "Deactivate",
                  icon: "eye-off" as const,
                  onClick: () => setStatus(m.id, "deactivated"),
                },
            { divider: true },
            {
              label: "Remove from org",
              icon: "trash" as const,
              danger: true,
              onClick: () => removeMember(m.id),
            },
          ];

          return (
            <div className={`mbr-row${status === "deactivated" ? " is-off" : ""}`} role="row" key={m.id}>
              <span className="mbr-member" role="cell">
                <Avatar initials={m.initials} size={34} tone="soft" />
                <span className="mbr-member-text">
                  <span className="mbr-member-name">
                    {m.name}
                    {isYou && <span className="mbr-you">You</span>}
                  </span>
                  <span className="mbr-member-email">{m.email ?? m.designation}</span>
                </span>
              </span>

              <span role="cell">
                <Chip tone={ROLE_META[m.role].tone} dot={isOwner}>
                  {ROLE_META[m.role].label}
                </Chip>
              </span>

              <span role="cell">
                {wasResent && status === "invited" ? (
                  <Chip tone="info" dot>
                    Invite resent
                  </Chip>
                ) : (
                  <Chip tone={STATUS_META[status].tone} dot={status === "active"}>
                    {STATUS_META[status].label}
                  </Chip>
                )}
              </span>

              <span className="mbr-num mono" role="cell">
                {status === "invited" ? "—" : activeByUser.get(m.id) ?? 0}
              </span>

              <span className="mbr-muted" role="cell">
                {status === "invited" ? "Pending" : relativeTime(m.lastActiveAt, NOW)}
              </span>

              <span className="mbr-actions" role="cell">
                {isOwner ? (
                  <Tooltip content="Account owner — can't be changed" side="top" compact>
                    <span className="mbr-lock" aria-label="Account owner">
                      <Icon name="sso" size={16} />
                    </span>
                  </Tooltip>
                ) : (
                  <ActionMenu items={items} tooltip="Member actions" />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={inviteMember}
      />
    </>
  );
}
