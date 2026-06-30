"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms";
import { useSessionStore, useRunStore, DEMO_RUN_REVIEW_ID } from "@/store";

/**
 * A faithful stand-in for the YouConnect (uConnect) appraisal-request record —
 * the dense enterprise CRM screen the user actually lives in. This is YouConnect's
 * own UI, NOT Parachute. The J1 embedded entry point is the "Run Parachute" action
 * in the record toolbar: it fires the SSO interstitial (/launch) and drops the user
 * into Parachute's live run flow (classify → review → compile) for this document,
 * with the result returning to YouConnect on sign.
 *
 * Identity (1450 Corporate Center Dr · Meridian Trust Bank · Loan #4471-20) mirrors
 * the seeded demo review so the property carries through end-to-end into Parachute.
 */

const TABS = [
  "Create a Request",
  "Assignment Complete",
  "View/Edit Properties",
  "Vendors",
  "Report Summaries",
  "Reports",
  "Import Bid",
  "Grab Bag",
  "Documents",
];

const REQUEST_FIELDS: [string, string][] = [
  ["The Number", "8084"],
  ["Request Status", "In Progress"],
  ["Reason for Request", "Vendor Complete"],
  ["Assignment Status", "Approved"],
  ["Assignment Complete Date", "04/13/2026"],
  ["Loan Officer", "System Administrator"],
  ["Last Action", "Vendor Complete"],
  ["Date of Request", "03/21/2026"],
  ["Date Needed", "04/10/2026"],
  ["Loan Amount", "$1,000,000"],
  ["Fee / Quoted", "$2,850"],
  ["Vendor Due Date", "04/08/2026"],
];

const PROJECT_FIELDS: [string, string][] = [
  ["Project Name", "1450 Corporate Center Dr"],
  ["Property Type", "Office (Medical)"],
  ["Engagement Letter", "Additional Funding"],
  ["Submitted By", "Ziona Bank"],
  ["Order By", "System Administrator"],
  ["Contact By", "System Administrator"],
  ["Lending Group", "Commercial RE"],
  ["Loan #", "4471-20"],
  ["Is Meridian Trust the Agent Bank?", "Yes"],
];

const PROPERTY_FIELDS: [string, string][] = [
  ["Property Category", "Office Buildings"],
  ["Property Type", "Medical Office"],
  ["Address", "1450 Corporate Center Dr"],
  ["City", "Mt Pleasant"],
  ["State", "SC"],
  ["Zip Code", "29464"],
  ["Subdivision", "Belle Hall"],
  ["Ownership Type", "Owner Occupied"],
];

const PAST_REQUESTS: [string, string][] = [
  ["#8084 · Commercial Appraisal", "In Progress"],
  ["#7611 · Evaluation", "Completed"],
  ["#7188 · Restricted Appraisal", "Completed"],
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="ycm-frow">
      <span className="ycm-flabel">{label}</span>
      <span className="ycm-fval">{value}</span>
    </div>
  );
}

export default function YouConnectMockPage() {
  const router = useRouter();
  const setMode = useSessionStore((s) => s.setMode);
  const openRun = useRunStore((s) => s.openRun);

  const runParachute = () => {
    // J1 embedded entry: SSO handoff into the live run flow for this document.
    setMode("embedded", { returnLabel: "YouConnect" });
    openRun(DEMO_RUN_REVIEW_ID, {
      startAt: "confirm",
      docLabel: "Commercial Appraisal Report.pdf",
      source: "yc",
    });
    router.push("/launch");
  };

  return (
    <div className="ycm">
      {/* Utility bar */}
      <header className="ycm-top">
        <div className="ycm-brand">
          <span className="ycm-brand-dot" />
          uConnect
        </div>
        <nav className="ycm-topnav">
          <span>Home</span>
          <span>Recently Viewed</span>
          <span>Reporting</span>
          <span>Admin</span>
          <span>Support</span>
        </nav>
        <div className="ycm-top-right">
          <Icon name="bell" size={15} />
          <span className="ycm-avatar" />
        </div>
      </header>

      {/* Module tab strip */}
      <div className="ycm-tabs">
        {TABS.map((t, i) => (
          <span key={t} className={`ycm-tab${i === 0 ? " active" : ""}`}>
            {t}
          </span>
        ))}
      </div>

      <motion.div
        className="ycm-scroll"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* Record header + action toolbar */}
        <div className="ycm-record-head">
          <div>
            <div className="ycm-crumb">Requests · #8084</div>
            <h1 className="ycm-record-title">1450 Corporate Center Dr</h1>
            <div className="ycm-record-sub">
              Office (Medical) · Meridian Trust Bank, N.A. · Loan #4471-20
            </div>
          </div>
          <span className="ycm-recstatus">
            <span className="ycm-recstatus-dot" />
            In Progress
          </span>
        </div>

        <div className="ycm-toolbar">
          <button className="ycm-act">
            <Icon name="edit" size={14} />
            Edit
          </button>
          <button className="ycm-act">
            <Icon name="comment" size={14} />
            Deal Notes
          </button>
          <button className="ycm-act">Accept for Review</button>
          <button className="ycm-act">Send for Review</button>
          <button className="ycm-act">Assign Internal Reviewer</button>
          <button className="ycm-act">Order Threshold Review</button>

          {/* J1 embedded entry point */}
          <button className="ycm-act ycm-act--go" onClick={runParachute}>
            <Icon name="ai" size={15} />
            Run Parachute
          </button>

          <button className="ycm-act ycm-act--menu">
            Jump to
            <Icon name="chevron-down" size={14} />
          </button>
        </div>

        {/* Three-column field grid */}
        <div className="ycm-cols">
          <section className="ycm-panel">
            <div className="ycm-panel-h">Request Info</div>
            <div className="ycm-fields">
              {REQUEST_FIELDS.map(([l, v]) => (
                <Field key={l} label={l} value={v} />
              ))}
            </div>
          </section>

          <section className="ycm-panel">
            <div className="ycm-panel-h">Project</div>
            <div className="ycm-fields">
              {PROJECT_FIELDS.map(([l, v]) => (
                <Field key={l} label={l} value={v} />
              ))}
            </div>

            <div className="ycm-panel-h">Documents</div>
            <div className="ycm-doc">
              <Icon name="pdf" size={18} />
              <span>
                <b>Commercial Appraisal Report.pdf</b>
                <small>Uploaded by vendor · 1 of 1</small>
              </span>
            </div>
          </section>

          <section className="ycm-panel">
            <div className="ycm-panel-h">
              Property Information
              <span className="ycm-panel-links">
                <a className="ycm-link">
                  <Icon name="eye" size={12} /> View more
                </a>
                <a className="ycm-link">
                  <Icon name="search" size={12} /> View map
                </a>
              </span>
            </div>
            <div className="ycm-fields">
              {PROPERTY_FIELDS.map(([l, v]) => (
                <Field key={l} label={l} value={v} />
              ))}
            </div>

            <div className="ycm-panel-h">Current &amp; Past Requests</div>
            <div className="ycm-reqlist">
              {PAST_REQUESTS.map(([r, s]) => (
                <div key={r} className="ycm-reqrow">
                  <a className="ycm-link">{r}</a>
                  <span className="ycm-reqstatus">{s}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
