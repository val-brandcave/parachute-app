"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@realwired/ui";
import { Button, Chip, CreditChip, Icon, IconButton, Tooltip } from "@/components/atoms";
import { DOC_GUIDES, VIDEO_GUIDES, type DocGuide } from "@/lib/guides";
import { PACK_DOCS } from "@/lib/security-pack";
import { useReviewsStore } from "@/store";
import type { Review } from "@/types";
import { useSetupActions } from "./useSetupActions";
import { HcCard } from "./HcFrame";
import { GuideStage } from "./GuideVideo";

const SAMPLE_FINDINGS = 14;

/** "See a finished review": the sample, offered without using credits. */
export function SampleCard() {
  const router = useRouter();
  const sample = useReviewsStore((s) => s.reviews.find((r) => r.id === "review-sample"));
  const flagged = sample?.flaggedCount ?? 2;
  const open = () => router.push("/reviews/review-sample");
  return (
    <HcCard
      title="See a finished review"
      right={<CreditChip tone="free" size="sm">Free</CreditChip>}
      raw
      actions={
        <Button variant="outline" size="sm" onClick={open}>
          Open sample
        </Button>
      }
      meta="Uses no credits"
    >
      <button type="button" className="hc-inset hc-inset--link" onClick={open} aria-label="Open the sample review">
        <span className="hc-page" aria-hidden="true">
          <span className="hc-page-band" />
          <i />
          <i />
          <i className="is-fail" />
          <i />
          <i className="is-flag" />
          <i />
          <span className="hc-seal">
            <Icon name="check" size={12} strokeWidth={2.5} />
          </span>
        </span>
        <span className="hc-sample-main">
          <span className="hc-addr">
            4410 Bayside Office Park
            <small>Norfolk, VA</small>
          </span>
          <span className="hc-legend">
            <span>
              <i className="hc-dot hc-dot--flag" />
              {flagged} flagged
            </span>
            <span>
              <i className="hc-dot" />
              {SAMPLE_FINDINGS} findings in all
            </span>
            <span>
              <i className="hc-dot hc-dot--ok" />
              Signed workbook
            </span>
          </span>
        </span>
      </button>
    </HcCard>
  );
}

/** "For your IT team": the pack's files, the download and the send shortcut. */
export function SecurityPackCard() {
  const router = useRouter();
  const { downloadPack } = useSetupActions();
  const shown = PACK_DOCS.slice(0, 4);
  return (
    <HcCard
      title="For your IT team"
      right={`${PACK_DOCS.length} documents`}
      actions={
        <>
          <Button variant="outline" size="sm" iconLeft="download" onClick={downloadPack}>
            Download pack
          </Button>
          <Button variant="ghost" size="sm" iconLeft="mail" onClick={() => router.push("/configure/security#send")}>
            Email to IT
          </Button>
        </>
      }
    >
      <ul className="hc-files">
        {shown.map((d) => (
          <li key={d.id}>
            <Icon name="pdf" size={16} className="hc-file-ico" />
            <span className="hc-file-name">{d.title}</span>
            <span className="hc-file-fmt">{d.format}</span>
          </li>
        ))}
        <li className="is-more">and {PACK_DOCS.length - shown.length} more</li>
      </ul>
    </HcCard>
  );
}

/** Three videos and the two PDF guides. Videos are a placeholder clip; PDFs are placeholder files. */
export function GuidesCard() {
  const toast = useToast();
  const [currentId, setCurrentId] = useState(VIDEO_GUIDES[0].id);
  const [autoPlay, setAutoPlay] = useState(false);
  const current = VIDEO_GUIDES.find((g) => g.id === currentId) ?? VIDEO_GUIDES[0];

  const download = (g: DocGuide) => {
    const a = document.createElement("a");
    a.href = g.href;
    a.download = g.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: "Downloaded", description: g.fileName, tone: "success" });
  };

  return (
    <HcCard
      title="Guides"
      right={`${VIDEO_GUIDES.length} videos · ${DOC_GUIDES.length} PDFs`}
      insetClassName="hc-guides"
    >
      <GuideStage guide={current} autoPlay={autoPlay} />
      <ul className="hc-group" aria-label="Videos">
        {VIDEO_GUIDES.map((g) => {
          const on = g.id === current.id;
          return (
            <li key={g.id}>
              <button
                type="button"
                className={on ? "hc-row is-current" : "hc-row"}
                aria-current={on ? "true" : undefined}
                onClick={() => {
                  setAutoPlay(true);
                  setCurrentId(g.id);
                }}
              >
                <span className="hc-thumb" aria-hidden="true">
                  <Icon name="play" size={12} />
                </span>
                <span className="hc-row-main">
                  <span>{g.label}</span>
                  <span className="hc-row-sub">{on ? <span className="hc-row-now">Now playing · </span> : null}{g.duration}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        <div className="hc-group-label">Documents</div>
        <ul className="hc-group">
          {DOC_GUIDES.map((g) => (
            <li key={g.id} className="hc-row">
              <Icon name="pdf" size={18} className="hc-pdf" />
              <span className="hc-row-main">
                <span>{g.label}</span>
                <span className="hc-row-sub">
                  {g.pages} pages · {g.size}
                </span>
              </span>
              <Tooltip content="Download" compact>
                <IconButton name="download" size={16} aria-label={`Download ${g.label}`} onClick={() => download(g)} />
              </Tooltip>
            </li>
          ))}
        </ul>
      </div>
    </HcCard>
  );
}

function pillFor(r: Review): { tone: "info" | "pass" | "accent" | "neutral"; label: string } {
  if (r.status === "completed") return { tone: "pass", label: "Completed" };
  if (r.status === "in_review") return { tone: "info", label: "Awaiting signature" };
  if (r.status === "running") return { tone: "accent", label: "In pipeline" };
  return { tone: "neutral", label: "Intake" };
}

/** The org's own recent reviews (never the sample). Shown once there are some. */
export function RecentReviews() {
  const reviews = useReviewsStore((s) => s.reviews);
  const rows = reviews
    .filter((r) => !r.sample)
    .sort((a, b) => b.orderedAt - a.orderedAt)
    .slice(0, 3);
  if (rows.length === 0) return null;
  return (
    <section className="card hm-recent">
      <div className="hm-recent-head">
        <h2 className="hm-h">Recent reviews</h2>
        <Link href="/reviews" className="hm-link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      {rows.map((r) => {
        const p = pillFor(r);
        const [, ...rest] = r.propertyAddress.split(", ");
        return (
          <Link key={r.id} href={`/reviews/${r.id}`} className="hm-recent-row">
            <span className="hm-recent-main">
              <span className="hm-recent-addr">{r.propertyAddress.split(", ")[0]}</span>
              <span className="hm-recent-meta">
                {rest.join(", ")} · {r.propertyType.replace(/\s*\((.*)\)/, (_m, a: string) => ` ${a.toLowerCase()}`)} · Loan {r.loanNo}
              </span>
            </span>
            <Chip tone={p.tone === "neutral" ? "neutral" : p.tone}>{p.label}</Chip>
          </Link>
        );
      })}
    </section>
  );
}
