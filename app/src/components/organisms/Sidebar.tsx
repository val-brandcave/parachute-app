"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Icon, Logo, Tooltip } from "@/components/atoms";
import { NavItem } from "@/components/molecules";
import { OrgCard } from "./OrgCard";
import { usePrefsStore } from "@/store";
import { cn } from "@/lib/utils";
import type { IconName } from "@/components/atoms";

const PRIMARY: { href: string; icon: IconName; label: string }[] = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/reviews", icon: "reviews", label: "Reviews" },
  { href: "/templates", icon: "templates", label: "Templates" },
];

const MotionLink = motion.create(Link);

/** Spring with a touch of overshoot — the parachute dips and settles like it caught air. */
const CTA_ICON_SPRING = { type: "spring", stiffness: 480, damping: 14, mass: 0.6 } as const;

export function Sidebar() {
  const pathname = usePathname();
  const navCollapsed = usePrefsStore((s) => s.navCollapsed);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // The docked primary action (F-127 / D4): a CTA, not a nav row — it opts out
  // of the rail's you-are-here state (the breadcrumb names the page instead).
  // Click = /launchpad, the full-page drop-file route. Motion = tactile press
  // (the button sinks, CSS) + a spring "catch-air" dip+sway on the parachute (F-133).
  const cta = (
    <MotionLink
      href="/launchpad"
      className={cn("sb-cta", navCollapsed && "collapsed")}
      aria-label="Start a review"
      initial="rest"
      animate="rest"
      whileHover="hover"
    >
      <motion.span
        className="sb-cta-ic"
        style={{ transformOrigin: "50% 15%" }}
        variants={{
          rest: { y: 0, rotate: 0 },
          hover: { y: 1.5, rotate: -5 },
        }}
        transition={CTA_ICON_SPRING}
      >
        <Icon name="parachute" size={19} />
      </motion.span>
      {!navCollapsed && <span>Start a review</span>}
    </MotionLink>
  );

  return (
    <aside className={`sidebar${navCollapsed ? " collapsed" : ""}`}>
      <div className="sb-head">
        {navCollapsed ? (
          <Logo themeAware full={false} height={26} />
        ) : (
          <Logo themeAware full height={24} />
        )}
      </div>

      <nav className="sb-nav scroll">
        {navCollapsed ? (
          <Tooltip content="Start a review" side="right" block>
            {cta}
          </Tooltip>
        ) : (
          cta
        )}
        <div className="sb-cta-sep" aria-hidden="true" />
        {PRIMARY.map((n) => (
          <NavItem
            key={n.href}
            href={n.href}
            icon={n.icon}
            label={n.label}
            active={isActive(n.href)}
            collapsed={navCollapsed}
          />
        ))}
      </nav>

      <div className="sb-foot">
        <OrgCard collapsed={navCollapsed} />
      </div>
    </aside>
  );
}
