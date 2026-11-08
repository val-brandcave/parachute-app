"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Callout } from "@realwired/ui";
import { Avatar, Chip, Icon, Tooltip } from "@/components/atoms";
import { useOrgInvites, useReviewsStore, useUsersStore } from "@/store";
import { formatDayMonth } from "@/lib/utils";
import {
  ROLE_META,
  ROLE_ORDER,
  STATUS_META,
  relativeTime,
} from "@/lib/member-roles";
import { useCurrentUser } from "@/lib/current-user";
import "@/app/bouncer/bouncer.css";

/** Where Manage in Realwired Admin goes, and where the Back link returns. */
export const MANAGE_MEMBERS_HREF =
  "/launch/bouncer?to=members&return=/configure/organization?tab=members";

type SortKey = "member" | "role" | "status" | "reviews" | "lastActive";
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;
const STATUS_ORDER: Record<string, number> = { active: 0, invited: 1, deactivated: 2 };

/** Members mirror (decision D10): read-only. Members, roles and invites are
 *  managed in Realwired Admin (Bouncer); pending invites show as muted rows. */
export function MembersPanel() {
  const { users, fetchUsers } = useUsersStore();
  const { pending } = useOrgInvites();
  const { reviews, fetchReviews } = useReviewsStore();
  const me = useCurrentUser();

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

  // The org's first org_admin is the account holder — locked, can't be demoted or removed.
  const firstAdminId = useMemo(
    () => users.filter((u) => u.role === "org_admin").sort((a, b) => a.createdAt - b.createdAt)[0]?.id,
    [users],
  );

  const activeCount = users.filter((u) => (u.status ?? "active") !== "deactivated").length;
  // Relative times read from the freshest sign-in, not the wall clock (no Date.now in render).
  const now = useMemo(() => users.reduce((m, u) => Math.max(m, u.lastActiveAt ?? 0), 0) + 3_600_000, [users]);

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
    <div className="bx-mirror">
      <div className="mbr-head">
        <div>
          <div className="mbr-head-title">Team members</div>
          <div className="mbr-head-sub">
            {activeCount} active {activeCount === 1 ? "member" : "members"} · {users.length} total
            {pending.length > 0 && ` · ${pending.length} invited`}
          </div>
        </div>
        <Link href={MANAGE_MEMBERS_HREF} className="ui-btn ui-btn--primary">
          Manage in Realwired Admin
          <Icon name="forward" size={17} />
        </Link>
      </div>

      <div className="bx-mirror-note">
        <Callout tone="accent">
          Members and roles are managed in Realwired Admin.
        </Callout>
      </div>

      <div className="mbr-table" role="table" aria-label="Team members">
        <div className="mbr-row mbr-row--head" role="row">
          {sortHeader("member", "Member")}
          {sortHeader("role", "Role")}
          {sortHeader("status", "Status")}
          {sortHeader("reviews", "Active reviews")}
          {sortHeader("lastActive", "Last active")}
        </div>

        {rows.map((m) => {
          const status = m.status ?? "active";
          const isOwner = m.role === "org_admin" && m.id === firstAdminId;
          const isYou = m.id === me.id;

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
                {isOwner ? (
                  <Tooltip content="Account holder" side="top" compact>
                    <span>
                      <Chip tone={ROLE_META[m.role].tone} dot>
                        {ROLE_META[m.role].label}
                      </Chip>
                    </span>
                  </Tooltip>
                ) : (
                  <Chip tone={ROLE_META[m.role].tone}>{ROLE_META[m.role].label}</Chip>
                )}
              </span>

              <span role="cell">
                <Chip tone={STATUS_META[status].tone} dot={status === "active"}>
                  {STATUS_META[status].label}
                </Chip>
              </span>

              <span className="mbr-num mono" role="cell">
                {status === "invited" ? "—" : activeByUser.get(m.id) ?? 0}
              </span>

              <span className="mbr-muted" role="cell">
                {status === "invited" ? "Pending" : relativeTime(m.lastActiveAt, now)}
              </span>
            </div>
          );
        })}

        {pending.map((inv) => (
          <div className="mbr-row mbr-row--pending" role="row" key={inv.id}>
            <span className="mbr-member" role="cell">
              <span className="bx-pending-ic" aria-hidden="true">
                <Icon name="mail" size={15} />
              </span>
              <span className="mbr-member-text">
                <span className="mbr-member-name">{inv.email}</span>
                <span className="mbr-member-email">Sent {formatDayMonth(inv.sentAt)}</span>
              </span>
            </span>
            <span role="cell">
              <Chip tone={ROLE_META[inv.role].tone}>{ROLE_META[inv.role].label}</Chip>
            </span>
            <span role="cell">
              <Chip tone="flag">Invited · pending</Chip>
            </span>
            <span className="mbr-num mono" role="cell">
              —
            </span>
            <span className="mbr-muted" role="cell">
              Pending
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
