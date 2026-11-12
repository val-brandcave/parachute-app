"use client";

import { useEffect, useRef } from "react";

/**
 * Stamps `data-tour="<id>"` on the first element matching `selector` (spec §5.13: attributes only,
 * no behaviour change) when the element lives inside a shared component this page cannot pass a
 * prop to (DS Tabs, FamilyTable, ReviewTable). `pick` narrows within the matches (kept in a ref, so
 * an inline function does not re-subscribe). A MutationObserver scoped to `main` (fallback body)
 * re-stamps when rows mount or reorder; attribute changes are not observed, so our own stamp never
 * re-triggers it. The stamp is removed on cleanup.
 * // DS-candidate: pass-through `data-*` on Tabs triggers / FamilyTable rows would replace this.
 */
export function useTourTarget(id: string, selector: string, pick?: (els: HTMLElement[]) => HTMLElement | undefined) {
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  useEffect(() => {
    const stamp = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const p = pickRef.current;
      const target = p ? p(els) : els[0];
      document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`).forEach((el) => {
        if (el !== target) el.removeAttribute("data-tour");
      });
      if (target && target.getAttribute("data-tour") !== id) target.setAttribute("data-tour", id);
    };
    stamp();
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(stamp);
    });
    mo.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`).forEach((el) => el.removeAttribute("data-tour"));
    };
  }, [id, selector]);
}
