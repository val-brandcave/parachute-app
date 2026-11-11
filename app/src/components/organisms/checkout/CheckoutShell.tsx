"use client";

import { TaskFlow } from "@realwired/ui";
import { Button, Logo } from "@/components/atoms";
import { HStepper, type HStep } from "@/components/molecules";
import "./checkout.css";

/**
 * Focused checkout frame (spec §5.6, PC-8): logo · horizontal stepper · "Exit checkout",
 * then the step body with a persistent order summary on the right. No sidebar, no header.
 *
 * Body frame = DS `TaskFlow presentation="page"` (header + body + `aside`), with no rail
 * and no footer: the step's Back / Continue sit under the form and the summary carries
 * the main CTA, as the boards draw it. TaskFlow scrolls the body and the aside
 * separately, so the summary stays put while the form scrolls (the "sticky" summary).
 * Its aside is 340 px (spec allows a 336 px fixed aside); `contentMaxWidth={false}` lets
 * the content column fill the rest. Below 900 px checkout.css stacks the two columns.
 */
export function CheckoutShell({
  steps,
  current,
  done,
  onSelectStep,
  onExit,
  aside,
  children,
}: {
  steps: HStep[];
  current: string;
  done: string[];
  onSelectStep?: (id: string) => void;
  onExit: () => void;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="co-root">
      <TaskFlow
        presentation="page"
        className="co-flow"
        contentMaxWidth={false}
        header={
          <div className="co-top">
            <span className="co-top-logo">
              <Logo full height={22} themeAware />
            </span>
            <nav className="co-top-steps" aria-label="Checkout steps">
              <HStepper steps={steps} current={current} done={done} onSelect={onSelectStep} aria-label="Checkout steps" />
            </nav>
            <Button variant="ghost" size="sm" iconLeft="close" onClick={onExit} className="co-exit">
              Exit checkout
            </Button>
          </div>
        }
        aside={aside}
      >
        <main className="co-main">{children}</main>
      </TaskFlow>
    </div>
  );
}
