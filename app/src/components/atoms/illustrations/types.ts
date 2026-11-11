export interface IllustrationDef {
  kind: "spot" | "scene";
  /** Root class carrying the shared fills (globals.css, "Illustrations"). */
  root: "ill-pi" | "ill-pb" | "ill-ps";
  viewBox: string;
  strokeWidth: number;
  /** Default accessible description (used only when the caller passes `title`). */
  title: string;
  /** Inner SVG markup (trusted, generated at build time from our own files). */
  body: string;
}
