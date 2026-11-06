"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useIdentityStore, usePrefsStore, type ThemePref } from "@/store";
import { useCurrentUser } from "@/lib/current-user";
import { DEMO_ENABLED } from "@/lib/demo";
import { useDemoStore } from "@/store/demo.store";
import { demoPersonas, PERSONA_GROUP_LABEL } from "@/data/seed/demo-personas.seed";

const THEME_OPTS: { value: ThemePref; icon: IconName; label: string }[] = [
  { value: "light", icon: "sun", label: "Light" },
  { value: "dark", icon: "moon", label: "Dark" },
  { value: "system", icon: "monitor", label: "System" },
];

export function UserMenu({
  name: nameProp,
  email: emailProp,
}: {
  name?: string;
  email?: string;
}) {
  const router = useRouter();
  const me = useCurrentUser();
  const name = nameProp ?? me.name;
  const email = emailProp ?? me.email;
  const [personasOpen, setPersonasOpen] = useState(false);
  const personaId = useDemoStore((s) => s.personaId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = usePrefsStore();
  const userAvatar = useIdentityStore((s) => s.userAvatar);

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

  // Prototype-only: become a demo persona, then land on its entry route.
  const switchPersona = async (id: string) => {
    setOpen(false);
    setPersonasOpen(false);
    const persona = await useDemoStore.getState().apply(id);
    if (persona) router.push(persona.entryRoute);
  };
  const resetOrg = async () => {
    setOpen(false);
    const { removed } = await useDemoStore.getState().resetOrg();
    if (removed) router.push("/start");
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="usermenu" ref={ref}>
      <button className="usermenu-trigger" onClick={() => setOpen((o) => !o)}>
        <Avatar initials={initials} src={userAvatar} />
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
            <button className="um-item" onClick={() => go("/profile")}>
              <Icon name="user" size={17} /> Profile
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
            {DEMO_ENABLED && (
              <>
                <div className="um-sep" />
                <button
                  className="um-item"
                  aria-expanded={personasOpen}
                  onClick={() => setPersonasOpen((o) => !o)}
                >
                  <Icon name="switch" size={17} /> Switch demo persona
                  <Icon name="chevron-down" size={15} className="um-item-caret" />
                </button>
                {personasOpen && (
                  <div className="um-personas">
                    {demoPersonas.map((p) => (
                      <button
                        key={p.id}
                        className={cn("um-persona", personaId === p.id && "on")}
                        onClick={() => switchPersona(p.id)}
                      >
                        <span className="um-persona-label">{p.label}</span>
                        <span className="um-persona-group">{PERSONA_GROUP_LABEL[p.group]}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button className="um-item" onClick={resetOrg}>
                  <Icon name="restore" size={17} /> Reset this org
                </button>
              </>
            )}
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
