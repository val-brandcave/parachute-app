import { ILLUSTRATIONS, type IllustrationName } from "./illustrations";

export type { IllustrationName } from "./illustrations";

// DS-candidate: Illustration atom — a shared art system across products, if Realwired adopts direction C.
/**
 * Brand illustration (spots 01–15, scenes 20–25). The one sanctioned inline-SVG
 * exception besides BrandGlyph: the markup is generated from our own files in
 * docs/plans/pattern-change/illustrations, so `currentColor` and the `--ill-*`
 * tokens theme it in light and dark. Decorative unless `title` is given.
 *
 * - `size` is the rendered width in px (height follows the viewBox).
 * - `panel` switches the oval tint panel on for spots (scenes always have one).
 */
export function Illustration({
  name,
  size,
  panel = false,
  title,
  className,
}: {
  name: IllustrationName;
  size?: number;
  panel?: boolean;
  title?: string;
  className?: string;
}) {
  const def = ILLUSTRATIONS[name];
  const width = size ?? (def.kind === "scene" ? 320 : 120);
  const cls = ["ill", def.root, panel ? "ill--panel" : "", className ?? ""].filter(Boolean).join(" ");
  const titled = Boolean(title);
  const body = titled ? `<title>${escapeXml(title!)}</title>${def.body}` : def.body;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={def.viewBox}
      width={width}
      fill="none"
      stroke="currentColor"
      strokeWidth={def.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      role={titled ? "img" : undefined}
      aria-hidden={titled ? undefined : true}
      focusable="false"
      // Trusted, build-time markup from our own SVG files (see illustrations/*.ts).
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
