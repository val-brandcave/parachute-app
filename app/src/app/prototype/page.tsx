import fs from "node:fs";
import path from "node:path";
import { PrototypeIndex } from "./PrototypeIndex";

/** Dev only: every `page.tsx` under src/app as a route pattern (route groups stripped). */
function pageRoutes(): string[] | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const root = path.join(process.cwd(), "src", "app");
  const out: string[] = [];
  const walk = (dir: string, segs: string[]) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const isGroup = e.name.startsWith("(") && e.name.endsWith(")");
        walk(path.join(dir, e.name), isGroup ? segs : [...segs, e.name]);
      } else if (e.name === "page.tsx") {
        out.push("/" + segs.join("/"));
      }
    }
  };
  try {
    walk(root, []);
  } catch {
    return undefined;
  }
  return out.sort();
}

/** Screen ids that have a thumbnail in public/proto-thumbs (so a missing one never 404s). */
function thumbIds(): string[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "proto-thumbs"))
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.slice(0, -4));
  } catch {
    return [];
  }
}

export const metadata = { title: "Prototype Index" };

/** PROTOTYPE ONLY. The Prototype Index: every screen, state and flow, from `lib/prototype-registry.ts`. */
export default function PrototypePage() {
  return <PrototypeIndex pageRoutes={pageRoutes()} thumbs={thumbIds()} />;
}
