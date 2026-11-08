"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip, Icon } from "@/components/atoms";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { GUIDES } from "@/lib/guides";
import { approxValue, costFor } from "@/lib/pricing";
import { useReviewsStore, useWalletStore } from "@/store";
import { remainingFromLedger } from "@/store/wallet.store";
import { expiryLine } from "@/components/organisms/billing/billing-data";
import type { Review } from "@/types";
import { useSetupActions } from "./useSetupActions";

/** "See a finished review": the sample, offered without using credits. */
export function SampleCard() {
  const router = useRouter();
  return (
    <section className="card hm-card">
      <div className="hm-sample">
        <span className="hm-docthumb" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <div>
          <h2 className="hm-h">See a finished review</h2>
          <p className="hm-p">
            Sample report: 4410 Bayside Office Park, Norfolk, VA. 14 findings, 22 attestations, a signed workbook.
          </p>
        </div>
      </div>
      <div className="hm-row-between">
        <span className="su-pill su-pill--outline">Free · uses no credits</span>
        <Button variant="outline" size="sm" iconRight="forward" onClick={() => router.push("/reviews/review-sample")}>
          Open sample
        </Button>
      </div>
    </section>
  );
}

/** Big balance, what it buys, and a trial / earned / purchased meter. */
export function WalletCard() {
  const ledger = useWalletStore((s) => s.ledger);
  const { billing } = useSetupActions();
  const r = remainingFromLedger(ledger);
  const balance = r.trial + r.earned + r.purchased;
  const mixed = r.earned + r.purchased > 0;
  const fullReviews = Math.floor(balance / costFor(FULL_REVIEW_TYPES));
  const seg = (n: number) => (balance > 0 ? (n / balance) * 100 : 0);

  return (
    <section className="card hm-card">
      <div className="hm-row-between">
        <h2 className="hm-h">Wallet</h2>
        <button type="button" className="hm-link" onClick={billing}>
          Billing
        </button>
      </div>
      <div className="hm-big">
        <span className="hm-big-n">{balance}</span>
        <span className="hm-big-u">{mixed ? (balance === 1 ? "credit" : "credits") : balance === 1 ? "trial credit" : "trial credits"}</span>
      </div>
      <p className="hm-p">
        About {fullReviews} full review{fullReviews === 1 ? "" : "s"} · {approxValue(balance)} value
      </p>
      <div className="meter" role="img" aria-label={`Trial ${r.trial}, earned ${r.earned}, purchased ${r.purchased}`}>
        {r.trial > 0 && <i className="meter-trial" style={{ width: `${seg(r.trial)}%` }} />}
        {r.earned > 0 && <i className="meter-earn" style={{ width: `${seg(r.earned)}%` }} />}
        {r.purchased > 0 && <i className="meter-buy" style={{ width: `${seg(r.purchased)}%` }} />}
      </div>
      <div className="meter-legend">
        <span>
          <i className="meter-trial" />
          Trial {r.trial}
        </span>
        <span>
          <i className="meter-earn" />
          Earned {r.earned}
        </span>
        <span>
          <i className="meter-buy" />
          Purchased {r.purchased}
        </span>
      </div>
      {mixed && <p className="hm-note">{expiryLine(ledger, r)}.</p>}
    </section>
  );
}

/** "For your IT team": the pack download and the send shortcut. */
export function SecurityPackCard() {
  const router = useRouter();
  const { downloadPack } = useSetupActions();
  return (
    <section className="card hm-card">
      <div className="hm-sample">
        <span className="hm-ico" aria-hidden="true">
          <Icon name="shield" size={18} />
        </span>
        <h2 className="hm-h hm-h--center">For your IT team</h2>
      </div>
      <p className="hm-p">
        Your bank will review us as a vendor. The pack covers architecture, data handling, our no-training commitment and
        SOC 2.
      </p>
      <div className="hm-actions">
        <Button variant="outline" size="sm" iconLeft="download" onClick={downloadPack}>
          Download pack
        </Button>
        <Button variant="ghost" size="sm" iconLeft="mail" onClick={() => router.push("/configure/security#send")}>
          Email to IT
        </Button>
      </div>
    </section>
  );
}

/** Three videos and the two PDF guides. Media is a placeholder. */
export function GuidesCard() {
  const { playVideo, openDoc } = useSetupActions();
  return (
    <section className="card hm-card">
      <h2 className="hm-h">Guides</h2>
      <ul className="hm-guides">
        {GUIDES.map((g) => (
          <li key={g.id}>
            <button type="button" className="hm-guide" onClick={() => (g.kind === "video" ? playVideo(g.label) : openDoc(g.label))}>
              <Icon name={g.kind === "video" ? "play" : "pdf"} size={15} className={g.kind === "video" ? "hm-guide-v" : "hm-guide-d"} />
              <span>{g.label}</span>
              <span className="hm-guide-len">{g.meta}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
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
