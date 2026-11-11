import { PageHeader } from "@/components/templates/PageHeader";
import { PACK_DOCS } from "@/lib/security-pack";
import "@/components/organisms/credits-chrome.css";

/** Trust Center stub (T2.2). Phase 5 (T5.2) replaces it with the full page. */
export default function TrustPage() {
  return (
    <>
      <PageHeader title="Trust Center" sub="Everything your IT and vendor-management team needs to approve Parachute." />
      <div className="pagebody cc-stub">
        <ul>
          {PACK_DOCS.map((d) => (
            <li key={d.id}>
              <b>{d.title}</b>
              <small>{d.desc}</small>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
