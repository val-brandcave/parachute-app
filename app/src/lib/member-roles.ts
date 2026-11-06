import type { ChipTone } from "@/components/atoms";
import type { MemberStatus, UserRole } from "@/types";

/** Roles most→least privileged, for sorting and select order. */
export const ROLE_ORDER: UserRole[] = ["org_admin", "approver", "reviewer"];

/** Roles an org admin can assign via invite / change-role. */
export const ASSIGNABLE_ROLES: UserRole[] = ["org_admin", "approver", "reviewer"];

export const ROLE_META: Record<UserRole, { label: string; desc: string; tone: ChipTone }> = {
  org_admin: { label: "Org admin", desc: "Manages the workspace and billing", tone: "accent" },
  approver: { label: "Approver", desc: "Reviews and signs off", tone: "info" },
  reviewer: { label: "Reviewer", desc: "Performs reviews", tone: "neutral" },
};

export const STATUS_META: Record<MemberStatus, { label: string; tone: ChipTone }> = {
  active: { label: "Active", tone: "pass" },
  invited: { label: "Invited", tone: "flag" },
  deactivated: { label: "Deactivated", tone: "neutral" },
};

/** "2 hours ago" / "3 days ago" style, relative to a passed-in `now` (render
 *  must not call Date.now()). Returns "—" when there's no timestamp. */
export function relativeTime(ts: number | undefined, now: number): string {
  if (!ts) return "—";
  const diff = Math.max(0, now - ts);
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diff < hour) return "just now";
  if (diff < day) {
    const h = Math.round(diff / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.round(diff / day);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.round(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}
