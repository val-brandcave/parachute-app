import { SECURITY_LINK_DAYS } from "@/lib/pricing";
import type { IconName } from "@/components/atoms";

/**
 * Trust Center data (spec §5.10). Every string on /trust and /shared/trust lives here so
 * Realwired (Ed) can edit it without touching components. Anything Realwired has not yet
 * confirmed carries `placeholder: true` and renders a "Placeholder" chip.
 */
export type DocAccess = "download" | "view" | "request";

export interface PackDoc {
  id: string;
  title: string;
  /** One line under the title; the format and date live in `meta`. */
  desc: string;
  /** "PDF, updated Sep 2026" */
  meta: string;
  /** "download" (default), "view" for a web page, or an NDA-gated request. */
  access?: DocAccess;
  icon: IconName;
  /** Dates, page counts and the file itself are not supplied yet: the row shows a Placeholder chip. */
  placeholder?: boolean;
}

export interface TrustFact {
  id: string;
  label: string;
  /** null = nothing confirmed yet: the row shows only the Placeholder chip. */
  value: string | null;
  placeholder?: boolean;
}

export const TRUST_TITLE = "Trust Center";
export const TRUST_INTRO =
  "Everything your IT and vendor-management team needs to approve Parachute. Send them one link; they don't need an account.";

/** Board's six documents first, then the two the old pack carried (kept unless Realwired says otherwise). */
export const PACK_DOCS: PackDoc[] = [
  { id: "soc2", placeholder: true, icon: "shield", title: "SOC 2 Type II report", desc: "Independent audit of our security controls", meta: "PDF, updated Sep 2026", access: "request" },
  { id: "security-overview", placeholder: true, icon: "document", title: "Security overview", desc: "Hosting, encryption, access control and monitoring", meta: "PDF, 12 pages" },
  { id: "dpa", placeholder: true, icon: "gavel", title: "Data processing agreement", desc: "How we handle borrower and property data", meta: "PDF, ready to sign" },
  { id: "pentest", placeholder: true, icon: "file-search", title: "Penetration test summary", desc: "Third-party test, findings and fixes", meta: "PDF, Jul 2026" },
  { id: "subprocessors", placeholder: true, icon: "org", title: "Subprocessors", desc: "Every vendor that touches your data, and why", meta: "Web page, updated monthly", access: "view" },
  { id: "questionnaire", placeholder: true, icon: "sheet", title: "Vendor questionnaire", desc: "SIG Lite, pre-filled", meta: "Spreadsheet" },
  { id: "data-handling", placeholder: true, icon: "eye-off", title: "Data handling and no-training statement", desc: "Your documents stay yours and are never used to train models", meta: "PDF, 2 pages" },
  { id: "glba", placeholder: true, icon: "checklist", title: "GLBA safeguards mapping", desc: "How we protect borrower NPI, control by control", meta: "Spreadsheet" },
];

export const DOCS_TITLE = "Documents";
export const DOCS_NOTE = "Placeholder files until Realwired supplies the real documents.";

export const GLANCE_TITLE = "At a glance";
export const FACTS: TrustFact[] = [
  { id: "hosting", label: "Hosting", value: null, placeholder: true },
  { id: "encryption", label: "Encryption", value: "At rest and in transit" },
  { id: "signin", label: "Sign-in", value: "Realwired ID, SSO" },
  { id: "retention", label: "Data retention", value: "Set by your bank" },
  { id: "uptime", label: "Uptime, 90 days", value: "99.98%", placeholder: true },
];

export const CONTACT = { lead: "Questions from IT go to", email: "security@realwired.com", placeholder: true };

export const PLACEHOLDER_LABEL = "Placeholder";

/** Public view for IT (no account). */
export const SHARED = { by: "Dana Reyes", org: "Harbor Community Bank", token: "harbor-it-review" };

export const SEND_TITLE = "Send to IT";
export const SEND_DESC = "One link to the whole Trust Center, from your name. Your IT team needs no account.";
export const SEND_NOTE_PLACEHOLDER = "We are trialling Parachute for appraisal review…";
export const SEND_EXPIRY = `The link expires in ${SECURITY_LINK_DAYS} days. Downloads are logged for the org admin.`;

export const REQUEST_TITLE = "Request access";
export const REQUEST_DESC = "The SOC 2 report is shared under NDA. We will send the NDA first, usually within 2 business days.";

export const VENDOR_PORTAL = { label: "Realwired Vendor Due Diligence Portal", href: "https://example.com/vendor-due-diligence" };

/** The default IT contact for an org: it-vendor@<org domain>. */
export function defaultItEmail(adminEmail: string | undefined): string {
  const domain = adminEmail?.split("@")[1];
  return domain ? `it-vendor@${domain}` : "it-vendor@example.com";
}
