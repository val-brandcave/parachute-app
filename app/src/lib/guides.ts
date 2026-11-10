/** The Guides card on first-run Home. Media is placeholder: swap `src` / `href` for the real files. */
export interface VideoGuide {
  id: string;
  kind: "video";
  label: string;
  /** "1:15". Shown on the poster and in the list. */
  duration: string;
  /** Placeholder clip (CC0). Real videos drop in here. */
  src: string;
}

export interface DocGuide {
  id: string;
  kind: "pdf";
  label: string;
  pages: number;
  /** "1.4 MB" */
  size: string;
  /** File under /public served as the download. */
  href: string;
  /** Suggested file name for the browser download. */
  fileName: string;
}

export type GuideItem = VideoGuide | DocGuide;

export const PLACEHOLDER_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export const GUIDES: GuideItem[] = [
  { id: "upload-start", kind: "video", label: "Upload and start", duration: "1:15", src: PLACEHOLDER_VIDEO },
  { id: "reading-workbook", kind: "video", label: "Reading your workbook", duration: "1:30", src: PLACEHOLDER_VIDEO },
  { id: "signing-off", kind: "video", label: "Signing off", duration: "0:55", src: PLACEHOLDER_VIDEO },
  {
    id: "reviewer-guide",
    kind: "pdf",
    label: "Reviewer guide",
    pages: 12,
    size: "1.4 MB",
    href: "/guides/parachute-reviewer-guide.pdf",
    fileName: "parachute-reviewer-guide.pdf",
  },
  {
    id: "admin-guide",
    kind: "pdf",
    label: "Admin guide",
    pages: 18,
    size: "2.1 MB",
    href: "/guides/parachute-admin-guide.pdf",
    fileName: "parachute-admin-guide.pdf",
  },
];

export const VIDEO_GUIDES = GUIDES.filter((g): g is VideoGuide => g.kind === "video");
export const DOC_GUIDES = GUIDES.filter((g): g is DocGuide => g.kind === "pdf");

/** A setup step's short video as a playable guide (same player as the Guides card). */
export function stepVideo(stepId: string, video: { label: string; length: string }): VideoGuide {
  return { id: `step-${stepId}`, kind: "video", label: video.label, duration: video.length, src: PLACEHOLDER_VIDEO };
}
