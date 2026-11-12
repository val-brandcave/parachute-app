"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms";
import { useCurrentUser } from "@/lib/current-user";
import { videoById } from "@/lib/learning";
import { usePrefsStore } from "@/store";
import "./empty-video.css";

/**
 * One quiet line beside a setting the first time it is changed (spec §5.12): a link to the
 * related video in the Learning Center. Once per user per setting (prefs `hintsSeen`); never
 * blocks the control, takes no focus. (Was an inline video card with Watch / Dismiss — too heavy.)
 */
export function SettingVideoHint({ hintId, videoId, show }: { hintId: string; videoId: string; show: boolean }) {
  const me = useCurrentUser();
  const seen = usePrefsStore((s) => !!s.hintsSeen[me.id]?.[hintId]);
  const [open, setOpen] = useState(false);

  // Latch open on the first trigger (React's "adjust state while rendering" pattern, guarded).
  if (show && !seen && !open) setOpen(true);

  useEffect(() => {
    if (open && !seen) usePrefsStore.getState().markHintSeen(me.id, hintId);
  }, [open, seen, me.id, hintId]);

  const v = videoById(videoId);
  if (!open || !v) return null;

  return (
    <p className="svh-link" data-hint={hintId}>
      <Icon name="play" size={14} />
      <Link href="/learn">Learn how it works: {v.title}</Link>
      <span className="text-tertiary"> · {v.duration}</span>
    </p>
  );
}
