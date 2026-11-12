"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Button,
  Illustration,
  type IllustrationName,
} from "@/components/atoms";
import { dist, dur, ease, staggerFor, useMotionMode } from "@/lib/motion";
import { LockedAction } from "@/components/molecules";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { EmptyVideo } from "@/components/organisms/EmptyVideo";
import { useOrgStore } from "@/store";
import "./first-run-hero.css";

/** One "what this page gives you" tile under the hero. */
export interface FirstRunTile {
  title: string;
  text: string;
  ill: IllustrationName;
}

/**
 * Level-1 empty state for the review pages (Dashboard, Reviews), in the same look as Billing →
 * How credits work: one compact hero card (title, lead and the Start a review CTA on the left,
 * the how-it-works video on the right), then tiles that say what this page will hold, each with
 * its illustration on the right. No page header strip, no uploads: the CTA goes to the Start a
 * review page (/launchpad) and respects the approval gate.
 * // DS-candidate: FirstRunHero (hero card + media + value tiles).
 */
export function FirstRunHero({
  title,
  children,
  tiles,
}: {
  title: ReactNode;
  children: ReactNode;
  tiles: FirstRunTile[];
}) {
  const router = useRouter();
  const { locked, reason } = useStartGate();
  const orgName = useOrgStore((s) => s.org?.name);

  const cta =
    locked && reason ? (
      <LockedAction reason={reason} glyph="hourglass">
        <Button iconLeft="rocket">Start a review</Button>
      </LockedAction>
    ) : (
      <Button iconLeft="rocket" onClick={() => router.push("/launchpad")}>
        Start a review
      </Button>
    );

  // No shimmer: nothing is being fetched here. Just a staggered reveal (hero first, then the
  // tiles). Motion off (tests, ?motion=0): straight to the content.
  const mode = useMotionMode();
  const full = mode === "full";
  const list: Variants = {
    hidden: {},
    shown: {
      transition: {
        staggerChildren: full ? staggerFor(tiles.length + 1) * 1.5 : 0,
      },
    },
  };
  const item: Variants = full
    ? {
        hidden: { opacity: 0, y: dist.enter },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: dur.slow, ease: ease.enter },
        },
      }
    : {
        hidden: { opacity: 0 },
        shown: { opacity: 1, transition: { duration: dur.reducedFade } },
      };

  if (mode === "off") return renderContent();

  return (
    <motion.div variants={list} initial="hidden" animate="shown">
      {renderContent()}
    </motion.div>
  );

  // A render function (not a nested component), so re-renders never remount the video.
  function renderContent() {
    const Sec = mode === "off" ? "section" : motion.section;
    const Li = mode === "off" ? "li" : motion.li;
    return (
      <div className="frh">
        <Sec
          className="card frh-hero"
          aria-labelledby="frh-title"
          {...(mode === "off" ? {} : { variants: item })}
        >
          <div className="frh-hero-text">
            {locked && (
              <p className="frh-status" role="status">
                <b>{orgName ?? "Your organization"} is waiting for approval.</b>{" "}
                Start a review opens once that is done.
              </p>
            )}
            <h2 className="frh-title" id="frh-title">
              {title}
            </h2>
            <p className="frh-lead tw-pretty">{children}</p>
            <div className="frh-cta">{cta}</div>
          </div>
          <div className="frh-media">
            <EmptyVideo videoId="how-a-review-works" />
          </div>
        </Sec>

        <ul className="frh-tiles">
          {tiles.map((t) => (
            <Li
              key={t.title}
              className="card frh-tile"
              {...(mode === "off" ? {} : { variants: item })}
            >
              <div className="frh-tile-tx">
                <h3 className="frh-tile-h">{t.title}</h3>
                <p className="frh-tile-p tw-pretty">{t.text}</p>
              </div>
              <Illustration name={t.ill} size={96} className="frh-tile-ill" />
            </Li>
          ))}
        </ul>
      </div>
    );
  }
}
