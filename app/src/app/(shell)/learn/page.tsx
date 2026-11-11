import { PageHeader } from "@/components/templates/PageHeader";
import { GUIDES } from "@/lib/guides";
import "@/components/organisms/credits-chrome.css";

/** Learning Center stub (T2.2). Phase 5 (T5.2) replaces it with the full page. */
export default function LearnPage() {
  return (
    <>
      <PageHeader title="Learning Center" sub="Short videos and printable guides for every part of Parachute." />
      <div className="pagebody cc-stub">
        <ul>
          {GUIDES.map((g) => (
            <li key={g.id}>
              <b>{g.label}</b>
              <small>{g.kind === "video" ? `Video · ${g.duration}` : `PDF guide · ${g.pages} pages`}</small>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
