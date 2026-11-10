import { SECURITY_LINK_DAYS } from "@/lib/pricing";

/**
 * Every string on /configure/security lives here so Realwired (Ed) can edit the
 * pack without touching components. Placeholder until Realwired supplies the
 * real documents.
 */
export type PackFormat = "PDF" | "XLSX";

export interface PackDoc {
  id: string;
  title: string;
  desc: string;
  format: PackFormat;
  /** "6 pages". Omitted for the XLSX. */
  pages?: string;
  /** "download" (default) or an NDA-gated request. */
  access?: "download" | "request";
  icon: "document" | "eye-off" | "info" | "checklist" | "org" | "settings" | "history";
}

export const PACK_VERSION_LABEL = "v0 · placeholder";

export const PACK_INTRO = "Your bank will review us as a vendor. Hand this to IT before you upload borrower files.";

export const PACK_LIST_DESC = "Seven documents, one link. Last updated · placeholder until Realwired supplies the content.";

export const PACK_DOCS: PackDoc[] = [
  { id: "architecture", icon: "document", title: "Architecture overview", desc: "Parachute, AI engine, Realwired ID (Keycloak), AWS hosting", format: "PDF", pages: "6 pages" },
  { id: "data-handling", icon: "eye-off", title: "Data handling and no-training statement", desc: "Your documents stay yours and are never used to train models", format: "PDF", pages: "2 pages" },
  { id: "soc2", icon: "info", title: "SOC 2 report and bridge letter", desc: "Shared under NDA after a short request · usually within 2 business days", format: "PDF", access: "request" },
  { id: "glba", icon: "checklist", title: "GLBA safeguards mapping", desc: "How we protect borrower NPI, control by control", format: "XLSX" },
  { id: "subprocessors", icon: "org", title: "Subprocessors", desc: "AI model provider, identity host, cloud hosting", format: "PDF", pages: "1 page" },
  { id: "identity", icon: "settings", title: "Identity, access and audit", desc: "Sessions, MFA per org, SSO, roles (only approvers sign), audit trail", format: "PDF", pages: "4 pages" },
  { id: "incident", icon: "history", title: "Incident response and retention", desc: "Notification windows, retention periods, deletion on request", format: "PDF", pages: "3 pages" },
];

export const SEND_TITLE = "Send to IT";
export const SEND_DESC = "One link to the whole pack, from your name.";
export const SEND_NOTE_PLACEHOLDER = "We are trialling Parachute for appraisal review…";
export const SEND_EXPIRY = `The link expires in ${SECURITY_LINK_DAYS} days. Downloads are logged for the org admin.`;

export const GAPS_TITLE = "Known gaps, stated plainly";
export const GAPS_OWNER = "Ed owns this content";
export const GAPS_INTRO = "Bank IT teams will find these anyway. Say them first.";
export const GAPS: { title: string; body: string }[] = [
  { title: "MFA rollout date", body: "placeholder until the per-org rollout is scheduled." },
  { title: "Latest scan findings", body: "placeholder for open items and their remediation dates." },
];

export const VENDOR_PORTAL = { label: "Realwired Vendor Due Diligence Portal", href: "https://example.com/vendor-due-diligence" };

/** The default IT contact for an org: it-vendor@<org domain>. */
export function defaultItEmail(adminEmail: string | undefined): string {
  const domain = adminEmail?.split("@")[1];
  return domain ? `it-vendor@${domain}` : "it-vendor@example.com";
}
