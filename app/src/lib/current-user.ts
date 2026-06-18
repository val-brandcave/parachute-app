/**
 * Single source for the signed-in user in the prototype. Real auth would
 * replace this with a session/store lookup.
 */
export const CURRENT_USER = {
  id: "user-001", // matches seedUsers — drives "Mine only" in the review queue
  name: "Val Vinnakota",
  firstName: "Val",
  email: "val@brandcave.co",
  initials: "VV",
  designation: "Chief Appraiser, MAI",
  signatureName: "Val Vinnakota",
} as const;

export const CURRENT_ORG = {
  name: "Meridian Trust Bank, N.A.",
  kind: "Organization",
  initials: "MT",
} as const;
