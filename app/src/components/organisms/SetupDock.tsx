"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Popover, useToast } from "@realwired/ui";
import { Icon } from "@/components/atoms";
import { useCurrentUser } from "@/lib/current-user";
import { EARN_CAP_CREDITS } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { usePrefsStore, useOrgStage, useSetupHidden, useSetupSummary } from "@/store";
import { SetupMeta, useSetupActions } from "./home";

/** Sidebar footer: progress ring + next step. Opens a popover with what's left.
 *  Shown on every shell page except Home while setup is `new` and not hidden. */
export function SetupDock({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const me = useCurrentUser();
  const stage = useOrgStage();
  const hidden = useSetupHidden();
  const summary = useSetupSummary();
  const setHidden = usePrefsStore((s) => s.setSetupHidden);
  const { emailList } = useSetupActions();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (stage !== "new" || hidden || pathname.startsWith("/dashboard")) return null;

  const { doneCount, total, next } = summary;
  const remaining = summary.steps.filter((s) => !s.done);
  const pct = Math.round((doneCount / total) * 100);
  const isAdmin = me.role === "org_admin";

  const hide = () => {
    setOpen(false);
    setHidden(me.id, true);
    toast({
      title: "Setup guide hidden",
      description: "Reopen it from your user menu, under Setup guide.",
      tone: "neutral",
    });
  };

  const trigger = (
    <button
      type="button"
      className={cn("sb-dock", collapsed && "is-collapsed")}
      aria-label={`Getting set up, ${doneCount} of ${total}`}
    >
      <span className="sb-ring" style={{ "--p": pct } as React.CSSProperties}>
        <span>{doneCount}/{total}</span>
      </span>
      {!collapsed && (
        <>
          <span className="sb-dock-main">
            <span className="sb-dock-title">Getting set up</span>
            <span className="sb-dock-sub">{next ? `Next: ${next.label}` : "All set"}</span>
          </span>
          <Icon name="chevron-right" size={16} />
        </>
      )}
    </button>
  );

  return (
    <Popover trigger={trigger} open={open} side="right" align="end" width={380}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setMenuOpen(false);
      }}
    >
      <div className="dock-pop">
        <div className="dock-pop-head">
          <SetupMeta />
        </div>
        <div className="dock-steps">
          {remaining.map((s) => {
            const action = s.doing ? { label: s.continueLabel ?? "Continue", href: s.doing.href ?? s.action?.href } : s.action;
            const blocked = !!s.adminOnly && !isAdmin;
            return (
              <div key={s.id} className={cn("dock-step", s.doing && "is-doing")}>
                <span className="su-ico" aria-hidden="true">
                  <Icon name="check" size={11} strokeWidth={3} />
                </span>
                <div className="dock-step-body">
                  <div className="dock-step-t">
                    {s.label}
                    {s.id === next?.id && !s.doing && <span className="su-tag">Next</span>}
                  </div>
                  <div className="dock-step-s">
                    {s.doing
                      ? s.doing.note
                      : `~${s.minutes} min${s.reward > 0 && summary.earnedCredits < EARN_CAP_CREDITS ? ` · +${s.reward} credit` : s.side === "none" ? " · no credit" : ""}`}
                  </div>
                </div>
                {action?.href &&
                  (blocked ? (
                    <span className="su-ask">Ask {summary.adminFirst ?? "your admin"}</span>
                  ) : (
                    <Link href={action.href} onClick={() => setOpen(false)} className="ui-btn ui-btn--outline ui-btn--sm">
                      {action.label}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
        {menuOpen && (
          <div className="dock-menu">
            <button type="button" className="dock-menu-item" onClick={hide}>
              <Icon name="eye-off" size={16} /> Hide setup guide
            </button>
            <button
              type="button"
              className="dock-menu-item"
              onClick={() => {
                setMenuOpen(false);
                emailList();
              }}
            >
              <Icon name="mail" size={16} /> Email me this list
            </button>
            <p className="dock-menu-note">Hiding is per user; reopens from Help → Setup guide.</p>
          </div>
        )}
        <div className="dock-pop-foot">
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--icon"
            aria-label="Setup guide options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((m) => !m)}
          >
            <Icon name="more" size={18} />
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--outline ui-btn--sm"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            Open setup guide <Icon name="forward" size={15} />
          </button>
        </div>
      </div>
    </Popover>
  );
}
