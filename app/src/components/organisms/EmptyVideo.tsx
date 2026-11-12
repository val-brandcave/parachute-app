"use client";

import { useMemo } from "react";
import { videoById } from "@/lib/learning";
import type { VideoGuide } from "@/lib/guides";
import { GuidePlayer } from "./home/GuideVideo";
import "./empty-video.css";

/**
 * Level-1 empty-state media (spec §5.12): poster + title + duration ("How a review works · 1:15"),
 * plays inline via GuidePlayer (a real <button> poster and native-style controls, so it is
 * keyboard-playable). Data from lib/learning.ts. Goes in EmptyState's `media` slot.
 * Captions: the clips are placeholders until Realwired supplies the real ones; the real files ship
 * with a caption track.
 */
export function EmptyVideo({ videoId }: { videoId: string }) {
  const v = videoById(videoId);
  const guide = useMemo<VideoGuide | null>(
    () => (v ? { id: v.id, kind: "video", label: v.title, duration: v.duration, src: v.src } : null),
    [v],
  );
  if (!v || !guide) return null;
  return (
    <div className="ev" role="group" aria-label={`Video: ${v.title}, ${v.duration}`} data-video={v.id}>
      <GuidePlayer guide={guide} onReport={() => {}} />
    </div>
  );
}
