/** The Guides card on first-run Home. Placeholder media: clicking opens a toast. */
export interface GuideItem {
  id: string;
  kind: "video" | "pdf";
  label: string;
  /** "1:15" for a video, "PDF · 12 pages" for a document. */
  meta: string;
}

export const GUIDES: GuideItem[] = [
  { id: "upload-start", kind: "video", label: "Upload and start", meta: "1:15" },
  { id: "reading-workbook", kind: "video", label: "Reading your workbook", meta: "1:30" },
  { id: "signing-off", kind: "video", label: "Signing off", meta: "0:55" },
  { id: "reviewer-guide", kind: "pdf", label: "Reviewer guide", meta: "PDF · 12 pages" },
  { id: "admin-guide", kind: "pdf", label: "Admin guide", meta: "PDF · 18 pages" },
];
