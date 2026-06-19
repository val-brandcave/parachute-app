"use client";

import { motion } from "framer-motion";
import { Button, Icon, type IconName } from "@/components/atoms";

// One tile in the Templates library hub. The whole card opens the kind's
// management surface; the CTA is a distinct primary action (e.g. create). The
// card staggers in on load (index-delayed) for a composed page reveal.
export function TemplateHubCard({
  icon,
  title,
  description,
  meta,
  ctaLabel,
  ctaIcon,
  index = 0,
  onOpen,
  onCta,
}: {
  icon: IconName;
  title: string;
  description: string;
  meta: string[];
  ctaLabel: string;
  ctaIcon: IconName;
  index?: number;
  onOpen: () => void;
  onCta: () => void;
}) {
  return (
    <motion.div
      className="tpl-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay: index * 0.06 }}
    >
      <div className="tpl-card-icon">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="tpl-card-title">{title}</h3>
      <p className="tpl-card-desc">{description}</p>
      <div className="tpl-card-meta">
        {meta.map((m, i) => (
          <span key={i} className="tpl-meta-chip">
            {m}
          </span>
        ))}
      </div>
      <div className="tpl-card-foot">
        <Button
          variant="outline"
          size="sm"
          iconLeft={ctaIcon}
          onClick={(e) => {
            e.stopPropagation();
            onCta();
          }}
        >
          {ctaLabel}
        </Button>
        <span className="tpl-card-open" aria-hidden>
          <Icon name="chevron-right" size={18} />
        </span>
      </div>
    </motion.div>
  );
}
