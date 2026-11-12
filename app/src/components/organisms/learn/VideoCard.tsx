"use client";

import { Icon } from "@/components/atoms";
import type { LearningVideo } from "@/lib/learning";

/** A Learning Center video: thumbnail with duration, watched state and progress. Click opens the player. */
export function VideoCard({
  video,
  progress,
  groupTitle,
  onOpen,
}: {
  video: LearningVideo;
  /** 0..1 */
  progress: number;
  groupTitle?: string;
  onOpen: (v: LearningVideo) => void;
}) {
  const done = progress >= 0.9;
  const started = progress > 0 && !done;
  return (
    <button
      type="button"
      className="lc-card"
      data-video={video.id}
      onClick={() => onOpen(video)}
      aria-label={`Play ${video.title}, ${video.duration}${done ? ", watched" : ""}`}
    >
      <span className="lc-thumb" aria-hidden="true">
        <span className="lc-play">
          <Icon name="play" size={20} />
        </span>
        <span className="lc-dur">{video.duration}</span>
        {started && (
          <span className="lc-bar">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        )}
      </span>
      <span className="lc-title">{video.title}</span>
      <span className="lc-meta">
        {done ? (
          <span className="lc-watched">
            <Icon name="check-circle" size={14} /> Watched
          </span>
        ) : started ? (
          <span>{Math.round(progress * 100)}% watched</span>
        ) : (
          <span>{groupTitle ?? "Video"}</span>
        )}
      </span>
    </button>
  );
}
