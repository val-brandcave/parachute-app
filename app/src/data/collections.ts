/** localStorage key prefix */
export const STORAGE_PREFIX = "parachute";

/** Collection name constants — used as localStorage suffixes and API path segments. */
export const Collections = {
  USERS: "users",
  ORGS: "orgs",
  REVIEWS: "reviews",
  FINDINGS: "findings",
  ATTESTATIONS: "attestations",
  YC_DELIVERIES: "yc_deliveries",
  RESPONSE_TEMPLATES: "responseTemplates",
  CHECKLIST_TEMPLATES: "checklistTemplates",
  WORKBOOK_LAYOUTS: "workbookLayouts",
  WORKBOOK_EXHIBITS: "workbookExhibits",
  CREDIT_LEDGER: "credit_ledger",
  WALLET_SETTINGS: "wallet_settings",
  SETUP_PROGRESS: "setup_progress",
  INVITES: "invites",
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
