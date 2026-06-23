"use client";

import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Review-workspace chrome. The sticky header (identity row + the control row that
 * carries the sub-view `Tabs`) is rendered ONCE by `ReviewContextBar`; each
 * sub-view (Findings / Builder / Workbook) projects its own action cluster into
 * the right side of that control row via a portal — so every view shares one
 * header skeleton (tabs left · actions right · ⋯ overflow) instead of inventing
 * its own toolbar band below the tabs. The action JSX stays co-located with the
 * view that owns its state; only the DOM host is shared.
 *
 * Contract:
 *   <ReviewChromeProvider>            ← wraps the bar + the active view (page level)
 *     <ReviewContextBar/>             ← mounts the actions outlet (`setHost` ref)
 *     <view>                          ← renders <ReviewActions>…</ReviewActions>
 *   </ReviewChromeProvider>
 */
type ChromeCtx = {
  host: HTMLElement | null;
  setHost: (el: HTMLElement | null) => void;
};

const ReviewChromeContext = createContext<ChromeCtx | null>(null);

export function ReviewChromeProvider({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <ReviewChromeContext.Provider value={{ host, setHost }}>
      {children}
    </ReviewChromeContext.Provider>
  );
}

function useReviewChrome(): ChromeCtx {
  const ctx = useContext(ReviewChromeContext);
  if (!ctx) throw new Error("useReviewChrome must be used within a ReviewChromeProvider");
  return ctx;
}

/** The control-row outlet — `ReviewContextBar` renders this; views portal into it. */
export function ReviewActionsOutlet() {
  const { setHost } = useReviewChrome();
  return <div className="revsub-actions" ref={setHost} />;
}

/** Wrap a view's action cluster; it renders into the shared control row. */
export function ReviewActions({ children }: { children: React.ReactNode }) {
  const { host } = useReviewChrome();
  if (!host) return null;
  return createPortal(children, host);
}
