"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { usePrefsStore, type ThemePref } from "@/store";
import { CURRENT_USER } from "@/lib/current-user";

const THEME_OPTS: { value: ThemePref; icon: IconName; label: string }[] = [
  { value: "light", icon: "sun", label: "Light" },
  { value: "dark", icon: "moon", label: "Dark" },
  { value: "system", icon: "monitor", label: "System" },
];

export function UserMenu({
  name = CURRENT_USER.name,
  email = CURRENT_USER.email,
}: {
  name?: string;
  email?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = usePrefsStore();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="usermenu" ref={ref}>
      <button className="usermenu-trigger" onClick={() => setOpen((o) => !o)}>
        <Avatar initials={initials} />
        <Icon name="chevron-down" size={16} className="um-caret" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="usermenu-pop"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
          >
            <div className="um-id">
              <div className="um-name">{name}</div>
              <div className="um-email">{email}</div>
            </div>
            <div className="um-sep" />
            <button className="um-item" onClick={() => go("/settings")}>
              <Icon name="user" size={17} /> Profile settings
            </button>
            <button className="um-item" onClick={() => setOpen(false)}>
              <Icon name="support" size={17} /> Support
            </button>
            <div className="um-sep" />
            <div className="um-theme">
              <div className="um-theme-lbl">Theme</div>
              <div className="um-theme-seg">
                {THEME_OPTS.map((o) => (
                  <button
                    key={o.value}
                    className={cn(theme === o.value && "on")}
                    onClick={() => setTheme(o.value)}
                    title={o.label}
                    aria-label={o.label}
                  >
                    <Icon name={o.icon} size={16} />
                  </button>
                ))}
              </div>
            </div>
            <div className="um-sep" />
            <button className="um-item danger" onClick={() => go("/login")}>
              <Icon name="logout" size={17} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
