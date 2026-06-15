"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon, Tooltip, type IconName } from "@/components/atoms";

export function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: IconName;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn("ui-navitem", active && "active", collapsed && "collapsed")}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="ui-navitem-pill"
          transition={{ type: "spring", stiffness: 520, damping: 42 }}
        />
      )}
      <span className="ui-navitem-ic">
        <Icon name={icon} size={19} strokeWidth={active ? 2.4 : 2} />
      </span>
      {!collapsed && <span className="ui-navitem-lb">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" block>
        {link}
      </Tooltip>
    );
  }
  return link;
}
