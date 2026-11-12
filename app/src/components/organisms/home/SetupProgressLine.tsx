"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { dur, ease, useMotionMode } from "@/lib/motion";
import { useSetupSummary } from "@/store";
import "./gs-hero.css";

/** Whether the Get started hero card has scrolled out from under the app header. */
const useHeroOutStore = create<{ heroOut: boolean }>(() => ({ heroOut: false }));

/**
 * Get started reports its hero card here: once the card has scrolled out from under the
 * header, the header shows the setup progress line. Returns a callback ref for the hero
 * (it mounts after the skeleton exits, so a plain ref would be read too early). Resets
 * when the hero unmounts.
 */
export function useHeroWatch(): (el: HTMLElement | null) => void {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el) return;
    // The header overlays the scroller's top edge, so the hero counts as gone once it
    // passes under it, not when it leaves the viewport.
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--rw-header-h")) || 60;
    const io = new IntersectionObserver(
      ([entry]) => useHeroOutStore.setState({ heroOut: !entry.isIntersecting }),
      { rootMargin: `-${headerH}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      useHeroOutStore.setState({ heroOut: false });
    };
  }, [el]);
  return setEl;
}

/**
 * A 3px navy line along the app header's bottom edge, its width the setup progress. It
 * appears only on Get started while the hero (which states the progress in words) is out
 * of view, so it is decorative: aria-hidden, no pointer events. Static under reduced motion.
 */
export function SetupProgressLine() {
  const pathname = usePathname();
  const heroOut = useHeroOutStore((s) => s.heroOut);
  const { doneCount, total, allDone } = useSetupSummary();
  const full = useMotionMode() === "full";
  const show = heroOut && pathname === "/get-started" && !allDone && total > 0;
  const t = full ? { duration: dur.standard, ease: ease.standard } : { duration: 0 };

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          key="gs-hline"
          className="gs-hline"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={t}
        >
          <motion.span
            className="gs-hline-fill"
            initial={false}
            animate={{ scaleX: doneCount / total }}
            transition={t}
          />
        </motion.span>
      )}
    </AnimatePresence>
  );
}
