/**
 * Single source for the signed-in user in the prototype. Real auth would
 * replace this with a session/store lookup.
 */
export const CURRENT_USER = {
  name: "Val Vinnakota",
  firstName: "Val",
  email: "val@brandcave.co",
  initials: "VV",
  designation: "Chief Appraiser, MAI",
  signatureName: "Val Vinnakota",
} as const;

export const CURRENT_ORG = {
  name: "Demo Bank, N.A.",
  kind: "Organization",
  initials: "DB",
} as const;
