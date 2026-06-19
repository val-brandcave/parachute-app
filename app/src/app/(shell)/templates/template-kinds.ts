import type { IconName } from "@/components/atoms";
import type { TemplateKind } from "@/types";

// Static metadata for each template kind in the library hub. The hub renders one
// card per entry and resolves live counts + the deep-link target in the hook, so
// adding a 4th kind (e.g. Bank Policy, letters) later is a single entry here.
export interface TemplateKindMeta {
  key: TemplateKind;
  icon: IconName;
  title: string;
  description: string;
  /** Fallback href; the hub hook may override (e.g. deep-link to an instance). */
  href: string;
  cta: { label: string; icon: IconName };
}

export const TEMPLATE_KINDS: TemplateKindMeta[] = [
  {
    key: "checklist",
    icon: "checklist",
    title: "Compliance Checklist",
    description:
      "The bank's administrative-review form. AI extracts items from your .docx; the reviewer attests at order time.",
    href: "/templates/checklist",
    cta: { label: "New checklist", icon: "upload" },
  },
  {
    key: "response",
    icon: "quote",
    title: "Response Templates",
    description:
      "Reusable disposition language — Concur, Requires revision, Override — with merge fields. Org library plus your personal set.",
    href: "/templates/responses",
    cta: { label: "New template", icon: "add" },
  },
  {
    key: "workbook",
    icon: "book",
    title: "Org Workbook Layout",
    description:
      "Default section layout, theme and branding for the Technical Review workbook. New reviews inherit it; reviewers tweak per review.",
    href: "/templates/workbook-layout",
    cta: { label: "Edit layout", icon: "edit" },
  },
];
