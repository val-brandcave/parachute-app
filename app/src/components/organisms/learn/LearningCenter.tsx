"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog, useToast, SearchInput } from "@realwired/ui";
import { Button, Chip, Icon, Illustration } from "@/components/atoms";
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
import type { IllustrationName } from "@/components/atoms";

/** One distinct spot illustration per guide and per tour (the tour's art echoes the page it tours). */
const GUIDE_ART: Record<string, IllustrationName> = {
  "reviewer-guide": "04b-learning-center",
  "admin-guide": "01b-credits",
  "checklist-reference": "09b-approval-pending",
};
const TOUR_ART: Record<string, IllustrationName> = {
  "first-review": "07b-finding-citation",
  reviews: "05b-empty-reviews",
  checklists: "06b-first-upload",
  "workbook-layouts": "08b-signed-workbook",
  billing: "02b-wallet-top-up",
};
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
  // Personal, so never filtered: it sits above the search and filter, which only narrow the library.
  const resume = VIDEOS.filter((v) => (progress[v.id] ?? 0) > 0 && (progress[v.id] ?? 0) < DONE_AT);
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
      <section className="card lc-hero">
        <div className="lc-hero-text">
          <h1 className="lc-h1">Learning Center</h1>
          <p className="lc-lead">
            Short videos and printable guides for every part of Parachute. Watch one when you get stuck, or send a guide to someone new on the team.
          </p>
        </div>
        <div className="lc-hero-art">
          <Illustration name="22-scene-learning-center" size={420} />
        </div>
      </section>

      {resume.length > 0 && (
        <section className="lc-sec" aria-labelledby="lc-resume">
          <h2 id="lc-resume" className="lc-h2">
            Continue where you left off
          </h2>
          <div className="lc-grid">{resume.map(card)}</div>
        </section>
      )}

      {/* Search and filter narrow the library below; Continue stays above, unfiltered. */}
      <div className="lc-tools">
        <SearchInput
          label="Search videos and guides"
          placeholder={"Search videos and guides, for example “sign a workbook”"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          width={420}
        />
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} label="Show videos for" />
      </div>

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
                Guides
              </h2>
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
          <ul className="lc-list">
            {TOURS.map((t) => (
              <li key={t.id} className="lc-row">
                <div className="lc-row-top">
                  <div className="lc-row-body">
                    <Chip>{t.steps.length} steps</Chip>
                    <span className="lc-row-title">{t.title}</span>
                  </div>
                  <Illustration name={TOUR_ART[t.id] ?? "04b-learning-center"} size={84} className="lc-row-ill" />
                </div>
                {tourHref(t) ? (
                  <Link className="ui-btn ui-btn--outline lc-row-cta" href={tourHref(t) as string} aria-label={`Start the ${t.title} tour`}>
                    <Icon name="play" size={15} /> Start tour
                  </Link>
                ) : (
                  // Lock-then-explain: the tour runs inside your own review, so point to starting one.
                  <Link className="ui-btn ui-btn--outline lc-row-cta" href="/launchpad">
                    <Icon name="rocket" size={15} /> Start a review first
                  </Link>
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
      <div className="lc-row-top">
        <div className="lc-row-body">
          <Chip>{AUDIENCE_LABEL[guide.audience]}</Chip>
          <span className="lc-row-title">{guide.title}</span>
        </div>
        <Illustration name={GUIDE_ART[guide.id] ?? "04b-learning-center"} size={84} className="lc-row-ill" />
      </div>
      <Button
        variant="outline"
        className="lc-row-cta"
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
        Download guide
      </Button>
    </li>
  );
}
