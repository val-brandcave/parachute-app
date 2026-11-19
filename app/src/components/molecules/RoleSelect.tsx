"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@realwired/ui";
import { Icon } from "@/components/atoms";
import { ROLE_META } from "@/lib/member-roles";
import type { UserRole } from "@/types";
import "./RoleSelect.css";

/** Reviewer first: it is the default for an invite. */
const CHOICES: UserRole[] = ["reviewer", "approver", "org_admin"];

/** One-line role descriptions (same copy as the Bouncer InviteDialog). */
const ROLE_COPY: Record<UserRole, string> = {
  reviewer: "Runs reviews and works through findings.",
  approver: "Does everything a reviewer does, and signs off workbooks.",
  org_admin: "Manages members, billing and settings.",
};

/**
 * Role picker for one invite row: a button that opens a listbox on the DS Popover.
 * Enter / Space / ArrowDown open it; arrows, Home and End move; Enter or Space
 * picks; Esc closes and returns focus to the button.
 *
 * DS-candidate: RoleSelect — listbox on @realwired/ui Popover (a select that
 * shows a one-line description per option; the DS has no such picker).
 */
export function RoleSelect({
  value,
  onChange,
  id,
  label,
}: {
  value: UserRole;
  onChange: (r: UserRole) => void;
  id: string;
  /** Accessible name prefix, e.g. "Role for row 2". Defaults to "Role". */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = `${id}-list`;

  const pick = (r: UserRole) => {
    onChange(r);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      align="start"
      width="max(var(--radix-popover-trigger-width), 19rem)"
      className="rolesel-pop"
      trigger={
        <button
          type="button"
          id={id}
          className="rolesel"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={`${label ?? "Role"}: ${ROLE_META[value].label}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className="rolesel-val">{ROLE_META[value].label}</span>
          <Icon name="chevron-down" size={15} />
        </button>
      }
    >
      {open && <RoleList id={listId} value={value} onPick={pick} />}
    </Popover>
  );
}

function RoleList({ id, value, onPick }: { id: string; value: UserRole; onPick: (r: UserRole) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(Math.max(0, CHOICES.indexOf(value)));

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const move = (to: number) => setActive((to + CHOICES.length) % CHOICES.length);

  return (
    <ul
      ref={ref}
      id={id}
      role="listbox"
      tabIndex={0}
      className="rolesel-list"
      aria-label="Role"
      aria-activedescendant={`${id}-${CHOICES[active]}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          move(active + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          move(active - 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          setActive(0);
        } else if (e.key === "End") {
          e.preventDefault();
          setActive(CHOICES.length - 1);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick(CHOICES[active]);
        }
      }}
    >
      {CHOICES.map((r, i) => (
        <li
          key={r}
          id={`${id}-${r}`}
          role="option"
          aria-selected={r === value}
          className={`rolesel-opt${i === active ? " is-active" : ""}`}
          onMouseMove={() => setActive(i)}
          onClick={() => onPick(r)}
        >
          <span className="rolesel-text">
            <span className="rolesel-name">{ROLE_META[r].label}</span>
            <span className="rolesel-desc">{ROLE_COPY[r]}</span>
          </span>
          {r === value && <Icon name="check" size={16} />}
        </li>
      ))}
    </ul>
  );
}
