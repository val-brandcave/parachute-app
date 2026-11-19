"use client";

import { forwardRef, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Icon, Input } from "@/components/atoms";
import { RoleSelect } from "@/components/molecules";
import { dist, dur, ease, useMotionMode } from "@/lib/motion";
import type { UserRole } from "@/types";

export interface InviteRowModel {
  id: string;
  email: string;
  role: UserRole;
}

/** Field shake on a blocked click: ±6 px twice over 300 ms (motion-spec §4). */
const SHAKE_X = [0, -dist.shake, dist.shake, -dist.shake, dist.shake, 0];

/** One person: email, role listbox, remove. The row's error sits underneath. */
export const InviteRow = forwardRef<
  HTMLInputElement,
  {
    row: InviteRowModel;
    index: number;
    placeholder: string;
    error?: string;
    /** Bumped by the parent each time this row should shake. */
    shakeKey: number;
    onEmail: (email: string) => void;
    onRole: (role: UserRole) => void;
    onRemove: () => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    onEnter: () => void;
  }
>(function InviteRow({ row, index, placeholder, error, shakeKey, onEmail, onRole, onRemove, onPaste, onEnter }, ref) {
  const mode = useMotionMode();
  const shake = useAnimationControls();
  const full = mode === "full";
  const n = index + 1;
  const errId = `${row.id}-err`;

  useEffect(() => {
    if (shakeKey > 0 && full) void shake.start({ x: SHAKE_X, transition: { duration: dur.shake, ease: ease.standard } });
  }, [shakeKey, full, shake]);

  return (
    <motion.li
      className="invite-row"
      layout={full ? "position" : false}
      initial={mode === "off" ? false : { opacity: 0, y: full ? dist.lift : 0 }}
      animate={{ opacity: 1, y: 0, transition: { duration: full ? dur.standard : dur.reducedFade, ease: ease.enter } }}
      exit={{ opacity: 0, transition: { duration: mode === "off" ? 0 : dur.quick, ease: ease.exit } }}
    >
      <div className="invite-line">
        <motion.div
          className="invite-field"
          animate={shake}
        >
          <Input
            ref={ref}
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            value={row.email}
            placeholder={placeholder}
            aria-label={`Work email ${n}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            className={error ? "invite-input is-error" : "invite-input"}
            onChange={(e) => onEmail(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
          />
        </motion.div>
        <RoleSelect id={`${row.id}-role`} label={`Role for row ${n}`} value={row.role} onChange={onRole} />
        <button type="button" className="invite-remove" aria-label={`Remove row ${n}`} onClick={onRemove}>
          <Icon name="close" size={16} />
        </button>
      </div>
      {error && (
        <p id={errId} className="invite-err" role="alert">
          {error}
        </p>
      )}
    </motion.li>
  );
});
