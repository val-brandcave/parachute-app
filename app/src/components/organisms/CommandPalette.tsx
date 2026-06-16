"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useReviewsStore, useOrderStore } from "@/store";
import { reviewHref } from "./ReviewTable";

type Cmd = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: IconName;
  run: () => void;
};

const NAV: { label: string; href: string; icon: IconName }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Reviews", href: "/reviews", icon: "reviews" },
  { label: "Templates", href: "/templates", icon: "templates" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <PaletteBody onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mounted only while open, so local state resets on every open (no effect). */
function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { reviews, fetchReviews } = useReviewsStore();
  const openOrder = useOrderStore((s) => s.openOrder);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Ensure data is loaded (external sync — fine in an effect).
  useEffect(() => {
    if (!reviews.length) fetchReviews();
  }, [reviews.length, fetchReviews]);

  const go = (fn: () => void) => {
    fn();
    onClose();
  };

  const items = useMemo<Cmd[]>(() => {
    const ql = q.trim().toLowerCase();
    const reviewItems: Cmd[] = reviews
      .filter(
        (r) =>
          !ql ||
          r.propertyAddress.toLowerCase().includes(ql) ||
          r.loanNo.toLowerCase().includes(ql) ||
          r.bank.toLowerCase().includes(ql) ||
          r.propertyType.toLowerCase().includes(ql),
      )
      .slice(0, ql ? 8 : 5)
      .map((r) => ({
        id: "r-" + r.id,
        group: "Reviews",
        label: r.propertyAddress,
        sub: `${r.propertyType} · Loan #${r.loanNo}`,
        icon: "reviews",
        run: () => go(() => router.push(reviewHref(r))),
      }));

    const navItems: Cmd[] = NAV.filter(
      (n) => !ql || n.label.toLowerCase().includes(ql),
    ).map((n) => ({
      id: "n-" + n.href,
      group: "Go to",
      label: n.label,
      icon: n.icon,
      run: () => go(() => router.push(n.href)),
    }));

    const actionItems: Cmd[] = [
      {
        id: "a-order",
        group: "Actions",
        label: "Order a review",
        icon: "add" as IconName,
        run: () => go(openOrder),
      },
    ].filter((a) => !ql || a.label.toLowerCase().includes(ql));

    return [...reviewItems, ...navItems, ...actionItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, reviews]);

  // Keep the active row scrolled into view (DOM sync, no setState).
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(".cmdk-item.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const updateQuery = (v: string) => {
    setQ(v);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) {
      if (e.key === "Escape") onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const groups: { title: string; items: { cmd: Cmd; idx: number }[] }[] = [];
  items.forEach((cmd, idx) => {
    let g = groups.find((x) => x.title === cmd.group);
    if (!g) {
      g = { title: cmd.group, items: [] };
      groups.push(g);
    }
    g.items.push({ cmd, idx });
  });

  return (
    <motion.div
      className="cmdk"
      initial={{ opacity: 0, y: -10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="cmdk-inputrow">
        <Icon name="search" size={18} />
        <input
          autoFocus
          placeholder="Search reviews, pages, actions…"
          value={q}
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="cmdk-list" ref={listRef}>
        {items.length === 0 ? (
          <div className="cmdk-empty">No matches for “{q}”.</div>
        ) : (
          groups.map((g) => (
            <div key={g.title}>
              <div className="cmdk-group-title">{g.title}</div>
              {g.items.map(({ cmd, idx }) => (
                <div
                  key={cmd.id}
                  className={cn("cmdk-item", idx === active && "active")}
                  onMouseMove={() => setActive(idx)}
                  onClick={cmd.run}
                >
                  <span className="cmdk-ic">
                    <Icon name={cmd.icon} size={16} />
                  </span>
                  <span className="cmdk-main">
                    <div className="cmdk-label">{cmd.label}</div>
                    {cmd.sub && <div className="cmdk-sub">{cmd.sub}</div>}
                  </span>
                  <Icon name="chevron-right" size={16} className="cmdk-go" />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="cmdk-foot">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate
        </span>
        <span>
          <kbd>↵</kbd> open
        </span>
        <span>
          <kbd>esc</kbd> close
        </span>
      </div>
    </motion.div>
  );
}
