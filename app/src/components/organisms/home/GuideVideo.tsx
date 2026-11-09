"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Tooltip } from "@/components/atoms";
import type { VideoGuide } from "@/lib/guides";

const clock = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export interface Pos {
  time: number;
  playing: boolean;
}

/** What passes between the card player and the expanded one. */
export interface Handoff {
  time: number;
  playing: boolean;
  /** Bumped whenever the other player hands over, so an effect can react. */
  n: number;
}

/**
 * One guide video: a poster with a big play button, then an inline player with
 * play/pause, seek, time, mute and full screen.
 */
export function GuidePlayer({
  guide,
  large = false,
  autoPlay = false,
  handoff,
  onReport,
  onExpand,
  expandRef,
}: {
  guide: VideoGuide;
  large?: boolean;
  /** Start playing as soon as it mounts or the guide changes (always follows a click). */
  autoPlay?: boolean;
  handoff?: Handoff;
  onReport: (pos: Pos) => void;
  onExpand?: () => void;
  expandRef?: React.Ref<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(autoPlay || (handoff?.time ?? 0) > 0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(handoff?.time ?? 0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  // Expand = real full screen of the player (our controls stay), Esc exits. iPhone Safari can only
  // full-screen a bare <video>, so it falls back to the system player there.
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === shell.current && !!shell.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFull = () => {
    const el = shell.current;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el?.requestFullscreen) {
      void el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    } else {
      v?.webkitEnterFullscreen?.();
    }
  };

  const play = useCallback(() => {
    setStarted(true);
    void ref.current?.play().catch(() => setPlaying(false));
  }, []);

  // A new guide (list click) restarts from zero and plays; the first mount may too.
  const lastId = useRef<string | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (lastId.current !== null && lastId.current !== guide.id) {
      v.currentTime = 0;
      setTime(0);
      play();
    }
    lastId.current = guide.id;
  }, [guide.id, play]);

  // First mount: resume from a handoff, or autoplay.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const start = () => {
      if (handoff && handoff.time > 0) v.currentTime = handoff.time;
      if (autoPlay || handoff?.playing) play();
    };
    if (v.readyState >= 1) start();
    else v.addEventListener("loadedmetadata", start, { once: true });
    return () => v.removeEventListener("loadedmetadata", start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Later handoffs (the expanded player closed): seek (it stays paused; the seeked event updates the clock).
  const lastN = useRef(handoff?.n ?? 0);
  useEffect(() => {
    const v = ref.current;
    if (!v || !handoff || handoff.n === lastN.current) return;
    lastN.current = handoff.n;
    v.currentTime = handoff.time;
  }, [handoff]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) play();
    else v.pause();
  };

  const pct = dur > 0 ? Math.min(100, (time / dur) * 100) : 0;

  return (
    <div ref={shell} className={large ? "hc-player hc-player--large" : "hc-player"}>
      <video
        ref={ref}
        className="hc-video"
        src={guide.src}
        preload="metadata"
        playsInline
        muted={muted}
        aria-label={guide.label}
        onClick={started ? toggle : undefined}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onSeeked={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          onReport({ time: e.currentTarget.currentTime, playing: !e.currentTarget.paused });
        }}
      />
      {!started && (
        <button type="button" className="hc-poster" onClick={play} aria-label={`Play ${guide.label}`}>
          <span className="hc-poster-frame" aria-hidden="true" />
          <span className="hc-dur" aria-hidden="true">
            {guide.duration}
          </span>
          <span className="hc-play" aria-hidden="true">
            <Icon name="play" size={22} />
          </span>
          <span className="hc-poster-title">{guide.label}</span>
          <span className="hc-poster-sub">Parachute guide</span>
        </button>
      )}
      {started && (
        <div className="hc-ctrls">
          <button type="button" className="hc-cbtn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            <Icon name={playing ? "pause" : "play"} size={16} />
          </button>
          <span className="hc-time" aria-hidden="true">
            {clock(time)}
          </span>
          <input
            type="range"
            className="hc-seek"
            aria-label="Seek"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(time, dur || 0)}
            style={{ "--p": `${pct}%` } as React.CSSProperties}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (ref.current) ref.current.currentTime = t;
              setTime(t);
            }}
          />
          <span className="hc-time" aria-hidden="true">
            {clock(dur)}
          </span>
          <button type="button" className="hc-cbtn" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>
            <Icon name={muted ? "volume-off" : "volume"} size={16} />
          </button>
          <Tooltip content={full ? "Exit full screen" : "Full screen"} compact>
            <button
              type="button"
              ref={expandRef}
              className="hc-cbtn"
              onClick={onExpand ?? toggleFull}
              aria-label={full ? "Exit full screen" : "Full screen"}
            >
              <Icon name={full ? "minimize" : "maximize"} size={16} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

/** The card's player. Full screen is handled by the player itself (no dialog). */
export function GuideStage({ guide, autoPlay }: { guide: VideoGuide; autoPlay: boolean }) {
  return <GuidePlayer guide={guide} autoPlay={autoPlay} onReport={() => {}} />;
}
