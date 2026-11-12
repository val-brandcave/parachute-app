"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog, useToast } from "@realwired/ui";
import { Button, Chip, Icon, Illustration, Input } from "@/components/atoms";
import { EmptyLine, SegmentedControl } from "@/components/molecules";
import { GuidePlayer } from "@/components/organisms/home/GuideVideo";
import { useCurrentUser } from "@/lib/current-user";
import {
  GUIDES,
  VIDEOS,
  VIDEO_GROUPS,
  type LearningAudience,
  type LearningGuide,
  type LearningVideo,
} from "@/lib/learning";
import { TOURS } from "@/lib/tours";
import { usePrefsStore, useReviewsStore } from "@/store";
import { VideoCard } from "./VideoCard";
import "./learn.css";

type Filter = "all" | "admin" | "reviewer";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admin" },
  { value: "reviewer", label: "Reviewer" },
];
const AUDIENCE_LABEL: Record<LearningAudience, string> = { admin: "Admin", reviewer: "Reviewer", everyone: "Everyone" };
const NO_PROGRESS: Record<string, number> = {};
const DONE_AT = 0.9;

const fits = (aud: LearningAudience, f: Filter) => f === "all" || aud === "everyone" || aud === f;

export function LearningCenter() {
  const me = useCurrentUser();
  const progress = usePrefsStore((s) => s.videoProgress[me.id]) ?? NO_PROGRESS;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [playing, setPlaying] = useState<LearningVideo | null>(null);
  const playerBox = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const groupTitle = (id: string) => VIDEO_GROUPS.find((g) => g.id === id)?.title ?? "";

  const groups = useMemo(
    () =>
      VIDEO_GROUPS.map((g) => ({
        ...g,
        videos: VIDEOS.filter(
          (v) => v.group === g.id && fits(v.audience, filter) && (!q || v.title.toLowerCase().includes(q) || g.title.toLowerCase().includes(q)),
        ),
      })).filter((g) => g.videos.length > 0),
    [filter, q],
  );
  const guides = useMemo(
    () => GUIDES.filter((g) => fits(g.audience, filter) && (!q || g.title.toLowerCase().includes(q))),
    [filter, q],
  );
  const resume = VIDEOS.filter(
    (v) => (progress[v.id] ?? 0) > 0 && (progress[v.id] ?? 0) < DONE_AT && fits(v.audience, filter) && !q,
  );
  const nothing = groups.length === 0 && guides.length === 0;
  const clear = () => {
    setQuery("");
    setFilter("all");
  };

  // Persist on pause, end and close, and at most every ~5 s while playing. Keep the furthest point so a replay never undoes "watched".
  const resumeAt = useRef(0);
  const lastSave = useRef(0);
  const save = (force = true) => {
    const el = playerBox.current?.querySelector("video");
    if (!el || !playing || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const now = Date.now();
    if (!force && now - lastSave.current < 5000) return;
    lastSave.current = now;
    const next = el.ended ? 1 : el.currentTime / el.duration;
    const prev = usePrefsStore.getState().videoProgress[me.id]?.[playing.id] ?? 0;
    if (next > prev) usePrefsStore.getState().setVideoProgress(me.id, playing.id, next);
  };
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  // Resume from the saved position, and persist on pause / end.
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let off = () => undefined as void;
    const frame = window.requestAnimationFrame(function find() {
      const el = playerBox.current?.querySelector("video");
      if (cancelled) return;
      if (!el) {
        window.requestAnimationFrame(find);
        return;
      }
      const seek = () => {
        if (resumeAt.current > 0 && el.duration > 0) el.currentTime = resumeAt.current * el.duration;
      };
      if (el.readyState >= 1) seek();
      else el.addEventListener("loadedmetadata", seek, { once: true });
      const onPause = () => saveRef.current(true);
      el.addEventListener("pause", onPause);
      el.addEventListener("ended", onPause);
      off = () => {
        el.removeEventListener("pause", onPause);
        el.removeEventListener("ended", onPause);
        el.removeEventListener("loadedmetadata", seek);
      };
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      off();
    };
  }, [playing]);

  const open = (v: LearningVideo) => {
    const p = progress[v.id] ?? 0;
    resumeAt.current = p > 0 && p < DONE_AT ? p : 0;
    lastSave.current = Date.now();
    setPlaying(v);
  };

  // A tour is a link: TourHost starts the tour named in `?tour=` once the page has mounted.
  const reviews = useReviewsStore((r) => r.reviews);
  const ownReview = reviews.find((r) => !r.sample && r.id !== "review-sample");
  const tourHref = (t: (typeof TOURS)[number]) =>
    t.route ? `${t.route}?tour=${t.id}` : ownReview ? `/reviews/${ownReview.id}?tour=${t.id}` : null;

  const card = (v: LearningVideo) => (
    <VideoCard key={v.id} video={v} progress={progress[v.id] ?? 0} groupTitle={groupTitle(v.group)} onOpen={open} />
  );

  return (
    <div className="lc">
      <section className="lc-hero">
        <div className="lc-hero-text">
          <h1 className="lc-h1">Learning Center</h1>
          <p className="lc-lead">
            Short videos and printable guides for every part of Parachute. Watch one when you get stuck, or send a guide to someone new on the team.
          </p>
          <div className="lc-tools">
            <div className="lc-search">
              <Icon name="search" size={16} />
              <Input
                type="search"
                aria-label="Search videos and guides"
                placeholder={"Search videos and guides, for example “sign a workbook”"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} label="Show videos for" />
          </div>
        </div>
        <div className="lc-hero-art">
          <Illustration name="22-scene-learning-center" size={420} />
        </div>
      </section>

      {nothing ? (
        <EmptyLine
          icon="search"
          action={
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear search
            </Button>
          }
        >
          {q ? `Nothing matches “${query.trim()}”.` : "Nothing here for this audience."}
        </EmptyLine>
      ) : (
        <>
          {resume.length > 0 && (
            <section className="lc-sec" aria-labelledby="lc-resume">
              <h2 id="lc-resume" className="lc-h2">
                Continue where you left off
              </h2>
              <div className="lc-grid">{resume.map(card)}</div>
            </section>
          )}
          {groups.map((g) => (
            <section key={g.id} className="lc-sec" aria-labelledby={`lc-g-${g.id}`}>
              <h2 id={`lc-g-${g.id}`} className="lc-h2">
                {g.title}
              </h2>
              <div className="lc-grid">{g.videos.map(card)}</div>
            </section>
          ))}
          {guides.length > 0 && (
            <section className="lc-sec" aria-labelledby="lc-guides">
              <h2 id="lc-guides" className="lc-h2">
                PDF guides
              </h2>
              <p className="lc-sub">Print them or pass them on.</p>
              <ul className="lc-list">
                {guides.map((g) => (
                  <GuideRow key={g.id} guide={g} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!q && (
        <section className="lc-sec" aria-labelledby="lc-tours">
          <h2 id="lc-tours" className="lc-h2">
            Page tours
          </h2>
          <p className="lc-sub">Run any tour again.</p>
          <ul className="lc-list">
            {TOURS.map((t) => (
              <li key={t.id} className="lc-row">
                <span className="lc-row-ic" aria-hidden="true">
                  <Icon name="rocket" size={18} />
                </span>
                <span className="lc-row-body">
                  <span className="lc-row-title">{t.title}</span>
                  <span className="lc-row-sub">{t.steps.length} steps</span>
                </span>
                {tourHref(t) ? (
                  <Link className="ui-btn ui-btn--outline ui-btn--sm" href={tourHref(t) as string} aria-label={`Run the ${t.title} tour`}>
                    <Icon name="refresh" size={15} /> Run tour
                  </Link>
                ) : (
                  <span className="lc-row-sub">Start a review to take this tour.</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog
        open={playing !== null}
        onOpenChange={(o) => {
          if (!o) {
            save(true);
            setPlaying(null);
          }
        }}
        size="md"
        title={playing?.title ?? "Video"}
        description={playing ? `${groupTitle(playing.group)} · ${playing.duration}` : undefined}
      >
        <div ref={playerBox} className="lc-player">
          {playing && (
            <GuidePlayer
              guide={{ id: playing.id, kind: "video", label: playing.title, duration: playing.duration, src: playing.src }}
              large
              autoPlay
              onReport={() => save(false)}
            />
          )}
        </div>
      </Dialog>
    </div>
  );
}

function GuideRow({ guide }: { guide: LearningGuide }) {
  const toast = useToast();
  return (
    <li className="lc-row">
      <span className="lc-row-ic" aria-hidden="true">
        <Icon name="pdf" size={18} />
      </span>
      <span className="lc-row-body">
        <span className="lc-row-title">{guide.title}</span>
        <span className="lc-row-sub">
          <Chip>{AUDIENCE_LABEL[guide.audience]}</Chip>
          {guide.placeholder && <Chip tone="flag">Placeholder</Chip>}
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        iconLeft="download"
        aria-disabled={guide.href ? undefined : "true"}
        onClick={() => {
          if (!guide.href) {
            toast({ title: guide.title, description: "This guide arrives when Realwired supplies it.", tone: "info" });
            return;
          }
          const a = document.createElement("a");
          a.href = guide.href;
          a.download = guide.fileName ?? "";
          a.click();
        }}
      >
        Download
      </Button>
    </li>
  );
}
