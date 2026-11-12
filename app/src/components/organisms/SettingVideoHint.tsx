"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useCurrentUser } from "@/lib/current-user";
import { videoById } from "@/lib/learning";
import type { VideoGuide } from "@/lib/guides";
import { usePrefsStore } from "@/store";
import { GuidePlayer } from "./home/GuideVideo";
import "./empty-video.css";

/**
 * Small card beside a setting the first time it is changed (spec §5.12): title, duration,
 * "Watch" · "Dismiss"; once per user per setting (prefs `hintsSeen`); never blocks the control.
 *
 * `show` is the trigger ("the user just changed it"). The first time it goes true for a user who
 * has not seen `hintId`, the card opens and the id is marked seen at once, so a reload or a second
 * change never shows it again. The card then stays until dismissed. It is inert content next to
 * the control: it never intercepts the control's click and takes no focus.
 */
export function SettingVideoHint({ hintId, videoId, show }: { hintId: string; videoId: string; show: boolean }) {
  const me = useCurrentUser();
  const seen = usePrefsStore((s) => !!s.hintsSeen[me.id]?.[hintId]);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Latch open on the first trigger (React's "adjust state while rendering" pattern, guarded).
  if (show && !seen && !open) setOpen(true);

  useEffect(() => {
    if (open && !seen) usePrefsStore.getState().markHintSeen(me.id, hintId);
  }, [open, seen, me.id, hintId]);

  const v = videoById(videoId);
  const guide = useMemo<VideoGuide | null>(
    () => (v ? { id: v.id, kind: "video", label: v.title, duration: v.duration, src: v.src } : null),
    [v],
  );
  if (!open || !v || !guide) return null;

  return (
    <aside className="svh" aria-label={`Video: ${v.title}`} data-hint={hintId}>
      <div className="svh-row">
        <span className="svh-ic" aria-hidden="true">
          <Icon name="play" size={16} />
        </span>
        <div className="svh-main">
          <span className="svh-title">{v.title}</span>
          <span className="svh-sub">{v.duration} video</span>
        </div>
        <div className="svh-acts">
          {!playing && (
            <Button variant="outline" size="sm" onClick={() => setPlaying(true)}>
              Watch
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
        </div>
      </div>
      {playing && (
        <div className="svh-player">
          <GuidePlayer guide={guide} autoPlay onReport={() => {}} />
        </div>
      )}
    </aside>
  );
}
