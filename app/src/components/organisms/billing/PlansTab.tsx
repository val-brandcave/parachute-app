"use client";

import { useToast } from "@realwired/ui";
import { Callout } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import { useOrgStore } from "@/store";
import { buildPlans } from "./plans";

/** E3. Plans are prepared but not offered; the tab is behind `org.flags.plansTab`. */
export function PlansTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  if (!enabled) {
    return (
      <section className="card bl-card bl-locked">
        <Icon name="lock" size={22} />
        <h2 className="bl-h">Plans are hidden</h2>
        <p className="bl-sub">This tab is behind an org flag and off by default. Realwired decides when plans are offered.</p>
        <button type="button" className="hm-link" onClick={() => void useOrgStore.getState().setFlag("plansTab", true)}>
          Preview (demo)
        </button>
      </section>
    );
  }
  return (
    <div className="bl-stack">
      <Callout tone="info">
        <strong>Prepared, not offered.</strong> This tab is behind an org flag and hidden by default; the CRO decides.
      </Callout>
      <div className="bl-plans">
        {buildPlans().map((p) => (
          <section key={p.id} className={`card bl-card bl-plan${p.ctaKind === "current" ? " is-current" : ""}`}>
            <div className="bl-row">
              <h2 className="bl-h">{p.name}</h2>
              <span className={`su-pill su-pill--sm${p.ctaKind === "current" ? "" : " su-pill--outline"}`}>{p.tag}</span>
            </div>
            <p className="bl-plan-price">{p.price}</p>
            <p className="bl-sub">{p.priceNote}</p>
            <ul className="bl-feats">
              {p.features.map((f) => (
                <li key={f}>
                  <Icon name="check" size={15} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={p.ctaKind === "talk" ? "outline" : "ghost"}
              block
              disabled={p.ctaKind !== "talk"}
              onClick={() => p.ctaKind === "talk" && toast({ title: "We will be in touch", description: "Realwired will email you about invoicing.", tone: "info" })}
            >
              {p.cta}
            </Button>
          </section>
        ))}
      </div>
      <p className="bl-note">[var] = working number</p>
    </div>
  );
}
