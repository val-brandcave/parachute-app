import type { ResponseTemplate } from "@/types";

// Reviewer disposition boilerplate. Org library = the firm's shared set; "mine"
// = the signed-in reviewer's personal canned language. Bodies use {{merge}}
// tokens that fill from the finding at apply time: {{topic}} {{page}} {{detail}}
// {{action}} {{condition}} {{property}}.
const NOW = 1781827200000;

export const seedResponseTemplates: ResponseTemplate[] = [
  /* ---- Org library ---- */
  {
    id: "rt-concur-supported",
    scope: "org",
    group: "Concur",
    name: "Concur — adequately supported",
    body: "We concur with the appraiser's treatment of {{topic}}. The analysis (p. {{page}}) is adequately supported and consistent with USPAP/FIRREA. No further action is required.",
    createdAt: NOW,
  },
  {
    id: "rt-concur-observation",
    scope: "org",
    group: "Concur",
    name: "Concur — with observation",
    body: "We concur with the appraiser's conclusion regarding {{topic}}. We note {{detail}} (p. {{page}}); this does not change the value conclusion but is recorded for the file.",
    createdAt: NOW,
  },
  {
    id: "rt-concur-condition",
    scope: "org",
    group: "Concur with condition",
    name: "Concur subject to condition",
    body: "We concur with the value conclusion subject to the following condition: {{condition}}. Please confirm resolution prior to funding.",
    createdAt: NOW,
  },
  {
    id: "rt-revise-unsupported",
    scope: "org",
    group: "Requires revision",
    name: "Requires revision — unsupported",
    body: "{{topic}} is not adequately supported. Specifically, {{detail}} (p. {{page}}). Please {{action}} and resubmit.",
    createdAt: NOW,
  },
  {
    id: "rt-revise-recon",
    scope: "org",
    group: "Requires revision",
    name: "Requires revision — reconciliation",
    body: "{{topic}} diverges from the supporting data and is not reconciled (p. {{page}}). Please {{action}} so the conclusion ties to the evidence.",
    createdAt: NOW,
  },
  {
    id: "rt-override",
    scope: "org",
    group: "Reviewer override",
    name: "Reviewer override",
    body: "After review of {{topic}}, the reviewer overrides the automated finding. Basis: {{detail}} (p. {{page}}). The appraiser's treatment is accepted as presented.",
    createdAt: NOW,
  },
  {
    id: "rt-na",
    scope: "org",
    group: "Not applicable",
    name: "Not applicable",
    body: "This item is not applicable to {{property}} and has been marked N/A.",
    createdAt: NOW,
  },
  /* ---- My templates (personal — "My voice") ---- */
  {
    id: "rt-mine-concur",
    scope: "mine",
    group: "My voice",
    name: "Concur — short form",
    body: "Reviewed {{topic}} (p. {{page}}) — well supported. Agree, no changes.",
    createdAt: NOW,
  },
  {
    id: "rt-mine-needswork",
    scope: "mine",
    group: "My voice",
    name: "Needs work — direct",
    body: "{{topic}} needs work: {{detail}}. Please {{action}} before this goes any further (p. {{page}}).",
    createdAt: NOW,
  },
  {
    id: "rt-mine-underwriter",
    scope: "mine",
    group: "My voice",
    name: "Note to underwriter",
    body: "For underwriting: {{topic}} carries a condition — {{condition}}. Flagging so it's tracked against {{property}}.",
    createdAt: NOW,
  },
];
