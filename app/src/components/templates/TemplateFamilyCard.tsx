"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Chip, Icon, type IconName } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { VersionHistoryTable, type VersionRow } from "./VersionHistoryTable";

// A versioned template family (checklist or workbook layout). Flat single-surface
// card: a no-icon hero (clickable title → details/view · neutral version badge ·
// accent Default badge · dotted secondary metadata · primary write action +
// secondary ⋯) over a footer disclosure that expands the version-history table.
export function TemplateFamilyCard({
  title,
  onOpenDetails,
  versionBadge,
  defaultBadge,
  sub,
  hasDraft = false,
  primaryLabel,
  primaryIcon,
  onPrimary,
  menuItems,
  versions,
  contentsHeader,
  onView,
  onPromote,
  onDuplicate,
  onDelete,
  index = 0,
}: {
  title: string;
  onOpenDetails: () => void;
  versionBadge?: string;
  defaultBadge?: string;
  sub: string;
  hasDraft?: boolean;
  primaryLabel: string;
  primaryIcon: IconName;
  onPrimary: () => void;
  menuItems?: ActionItem[];
  versions: VersionRow[];
  contentsHeader?: string;
  onView: (versionId: string) => void;
  onPromote?: (versionId: string) => void;
  onDuplicate?: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
  index?: number;
}) {
  const [open, setOpen] = useState(false);

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
            <button type="button" className="fam-title" onClick={onOpenDetails}>
              {title}
            </button>
            {versionBadge && <span className="fam-vbadge">{versionBadge}</span>}
            {defaultBadge && (
              <Chip tone="accent" dot>
                {defaultBadge}
              </Chip>
            )}
            {hasDraft && (
              <Chip tone="flag" dot>
                Draft in progress
              </Chip>
            )}
          </div>
          <div className="fam-sub">{sub}</div>
        </div>
        <div className="fam-hero-actions">
          <Button size="sm" iconLeft={primaryIcon} onClick={onPrimary}>
            {primaryLabel}
          </Button>
          {menuItems && menuItems.length > 0 && (
            <ActionMenu items={menuItems} tooltip="More actions" />
          )}
        </div>
      </div>

      <button
        type="button"
        className="fam-disclose"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Icon
          name="chevron-down"
          size={15}
          className="fam-disclose-caret"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
        <span>Version history</span>
        <span className="fam-disclose-count">{versions.length}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="fam-history"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="fam-history-inner">
              <VersionHistoryTable
                versions={versions}
                contentsHeader={contentsHeader}
                onView={onView}
                onPromote={onPromote}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
