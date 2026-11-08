import type { BaseEntity, Timestamp, UUID } from "./common.types";
import type { UserRole } from "./domain.types";

/** Realwired Admin (Bouncer) owns members and invites; this is the mock of its invite record. */
export type InviteStatus = "pending" | "accepted" | "revoked";

export interface Invite extends BaseEntity {
  orgId: UUID;
  email: string;
  role: UserRole;
  status: InviteStatus;
  /** User id of the inviter. */
  invitedById: UUID;
  sentAt: Timestamp;
  /** 7 days after the last send. */
  expiresAt: Timestamp;
  message?: string;
  /** Prototype only: the display name the invitee "signs up" with on Simulate accept. */
  inviteeName?: string;
  acceptedAt?: Timestamp;
  /** The user row created on accept. */
  acceptedUserId?: UUID;
}
