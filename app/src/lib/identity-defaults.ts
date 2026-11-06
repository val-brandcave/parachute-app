/**
 * The identity the app boots as when no demo persona has been applied — the
 * original single-bank demo (Val at Meridian Trust). Kept in its own leaf file
 * so `session.store`, `current-user` and the stores can all import it without
 * forming an import cycle.
 */
export const DEFAULT_USER_ID = "user-001";
export const DEFAULT_ORG_ID = "org-001";
