"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/atoms";

// A response-template library scope (Org / Personal). Reuses the same `.fam-*`
// hero chrome as the versioned family cards — clickable title → the library, one
// primary "Open" action. No versioning and no "New template" here: a response
// card is an entry to a collection; new snippets are created inside the library.
export function ResponseScopeCard({
  title,
  sub,
  onOpen,
  index = 0,
}: {
  title: string;
  sub: string;
  onOpen: () => void;
  index?: number;
}) {
  return (
    <motion.section
      className="fam-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
    >
      <div className="fam-hero">
        <div className="fam-hero-main">
          <div className="fam-hero-titles">
            <button type="button" className="fam-title" onClick={onOpen}>
              {title}
            </button>
          </div>
          <div className="fam-sub">{sub}</div>
        </div>
        <div className="fam-hero-actions">
          <Button size="sm" iconLeft="edit" onClick={onOpen}>
            Open
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
