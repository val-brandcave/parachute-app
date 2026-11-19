import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Data-layer boundary guard (docs/plans/data-adapter-pattern-guide.md, "Allowed exceptions").
 *
 *   Page → page hook → Zustand store → adapter → mock (localStorage) | api (stub)
 *
 * 1. Only stores (`src/store/**`) and the data layer (`src/data/**`) may import the
 *    adapter, plus the documented exceptions below.
 * 2. Nothing under `src/components/**` or `src/app/**` touches `localStorage` directly:
 *    domain data goes through a store + the adapter, per-browser UI state goes through
 *    `store/prefs.store.ts`.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ADAPTERS_DIR = join(SRC, "data", "adapters");

/** Files outside store/ and data/ allowed to import the adapter. Paths relative to src/. */
const ADAPTER_IMPORT_EXCEPTIONS: Record<string, string> = {
  // Bootstrap infrastructure: runs adapter.seed() before any store loads and checks a
  // remembered session's rows still exist.
  "components/providers/SeedProvider.tsx": "seeding bootstrap",
  // PROTOTYPE ONLY: persona / scenario resets rewrite whole seeded rows beneath every
  // store; callers re-load the stores afterwards. Removed with the prototype controls.
  "lib/demo.ts": "prototype scenario plumbing",
};

/** Files under components/ or app/ allowed to use localStorage directly. Keep empty:
 *  per-browser UI state belongs in store/prefs.store.ts. */
const LOCAL_STORAGE_EXCEPTIONS: Record<string, string> = {};

const rel = (abs: string) => relative(SRC, abs).split(sep).join("/");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(abs);
  }
  return out;
}

/** Drop block and line comments so prose mentioning localStorage doesn't count. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

function importsAdapter(file: string, code: string): boolean {
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1];
    let target: string | null = null;
    if (spec.startsWith("@/")) target = join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) target = resolve(dirname(file), spec);
    if (!target) continue;
    if (target === ADAPTERS_DIR || target.startsWith(ADAPTERS_DIR + sep)) return true;
  }
  return false;
}

const files = walk(SRC);

describe("data-layer boundary", () => {
  it("documented exceptions still exist (no stale allowlist entries)", () => {
    for (const p of [...Object.keys(ADAPTER_IMPORT_EXCEPTIONS), ...Object.keys(LOCAL_STORAGE_EXCEPTIONS)]) {
      expect(existsSync(join(SRC, p)), `allowlisted file missing: src/${p}`).toBe(true);
    }
  });

  it("only stores and the data layer import the adapter", () => {
    const offenders = files
      .map((f) => ({ f, r: rel(f) }))
      .filter(({ r }) => !r.startsWith("store/") && !r.startsWith("data/") && !(r in ADAPTER_IMPORT_EXCEPTIONS))
      .filter(({ f }) => importsAdapter(f, stripComments(readFileSync(f, "utf8"))))
      .map(({ r }) => `src/${r}`);
    expect(offenders, "route these through a store (see data-adapter-pattern-guide.md)").toEqual([]);
  });

  it("components and app routes never use localStorage directly", () => {
    const offenders = files
      .map((f) => ({ f, r: rel(f) }))
      .filter(({ r }) => (r.startsWith("components/") || r.startsWith("app/")) && !(r in LOCAL_STORAGE_EXCEPTIONS))
      .filter(({ f }) => /\blocalStorage\b/.test(stripComments(readFileSync(f, "utf8"))))
      .map(({ r }) => `src/${r}`);
    expect(offenders, "domain data → store + adapter; per-browser UI state → store/prefs.store.ts").toEqual([]);
  });
});
