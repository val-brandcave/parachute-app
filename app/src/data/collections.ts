/** localStorage key prefix */
export const STORAGE_PREFIX = "parachute";

/** Collection name constants — used as localStorage suffixes and API path segments. */
export const Collections = {
  USERS: "users",
  ORGS: "orgs",
  REVIEWS: "reviews",
  FINDINGS: "findings",
  YC_DELIVERIES: "yc_deliveries",
  RESPONSE_TEMPLATES: "responseTemplates",
  CHECKLIST_TEMPLATES: "checklistTemplates",
  WORKBOOK_LAYOUTS: "workbookLayouts",
  WORKBOOK_EXHIBITS: "workbookExhibits",
} as const;

export type CollectionName = (typeof Collections)[keyof typeof Collections];
