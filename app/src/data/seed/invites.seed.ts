import type { Invite } from "@/types/invite.types";

/** 6 Nov 2026, 14:20 local: Dana sends the one pending Harbor invite. */
const SENT = new Date(2026, 10, 6, 14, 20).getTime();
export const INVITE_LIFE_DAYS = 7;

/** Harbor has one pending invite. Cedar Ridge and Meridian have none. */
export const seedInvites: Invite[] = [
  {
    id: "invite-hcb-1",
    createdAt: SENT,
    orgId: "org-hcb",
    email: "l.chen@harborcb.com",
    role: "reviewer",
    status: "pending",
    invitedById: "user-dr",
    sentAt: SENT,
    expiresAt: SENT + INVITE_LIFE_DAYS * 86_400_000,
    inviteeName: "Lena Chen",
  },
];
