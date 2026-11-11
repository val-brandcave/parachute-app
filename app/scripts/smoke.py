"""Smoke harness for the Parachute prototype (pattern-change build).

Usage (from app/ or the repo root; paths are relative to the cwd):
  python scripts/smoke.py --flow t0_baseline --base http://localhost:3000 --out .smoke/baseline
  python scripts/smoke.py --all --base http://localhost:3000 --out .smoke/phase-0
  python scripts/smoke.py --persona trial-admin --routes /get-started /dashboard --out .smoke/adhoc

Each flow module in scripts/flows/ exposes ROUTES, PERSONAS and run(page, ctx).
The run fails (exit 1) on a non-2xx/3xx document response, console.error,
pageerror, or a failed ctx.check() inside a flow. Screenshots are saved as
<slug>-<persona>-<theme>-<width>.png in --out.
"""

from __future__ import annotations

import argparse
import importlib
import pkgutil
import re
import sys
import traceback
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

HEIGHT = {1440: 900, 390: 844, 1280: 820}
THEME_KEY = "parachute:theme"
# Dev-only noise that is not an app error.
IGNORED_CONSOLE = [
    re.compile(r"Download the React DevTools"),
    re.compile(r"\[HMR\]"),
    re.compile(r"\[Fast Refresh\]"),
]


def slugify(route: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", route).strip("-")
    return s or "root"


class Ctx:
    """Handed to flows. Wraps navigation, screenshots and assertions."""

    def __init__(self, page, base, out, persona, theme, width, errors):
        self.page = page
        self.base = base.rstrip("/")
        self.out = out
        self.persona = persona or "none"
        self.theme = theme
        self.width = width
        self.errors = errors

    def url(self, route: str) -> str:
        return route if route.startswith("http") else self.base + route

    def visit(self, route: str, wait: str = "domcontentloaded"):
        resp = self.page.goto(self.url(route), wait_until=wait)
        if resp is not None and resp.status >= 400:
            self.errors.append(f"{route}: HTTP {resp.status}")
        self.settle()
        return resp

    def settle(self, ms: int = 1200):
        try:
            self.page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass
        self.page.wait_for_timeout(ms)

    def shoot(self, name: str, full_page: bool = False):
        fname = f"{slugify(name)}-{self.persona}-{self.theme}-{self.width}.png"
        self.page.screenshot(path=str(self.out / fname), full_page=full_page)
        return self.out / fname

    def check(self, cond, msg: str) -> bool:
        if not cond:
            self.errors.append(f"assert: {msg}")
        return bool(cond)

    def enter_persona(self, persona: str):
        self.persona = persona
        self.page.goto(self.url(f"/demo/{persona}"), wait_until="domcontentloaded")
        # /demo/<id> applies the persona, then router.replace()s to its entry route.
        try:
            self.page.wait_for_url(lambda u: "/demo/" not in u, timeout=30000)
        except Exception:
            self.errors.append(f"persona {persona}: never left /demo/")
        self.settle()


def apply_theme(context, theme: str):
    context.add_init_script(
        f"try {{ localStorage.setItem('{THEME_KEY}', '{theme}'); }} catch (e) {{}}"
    )


def attach_listeners(page, errors, label):
    def on_console(msg):
        if msg.type != "error":
            return
        text = msg.text
        if any(p.search(text) for p in IGNORED_CONSOLE):
            return
        errors.append(f"[{label}] console.error: {text[:300]}")

    def on_pageerror(exc):
        errors.append(f"[{label}] pageerror: {str(exc)[:300]}")

    def on_response(resp):
        if resp.request.resource_type == "document" and resp.status >= 400:
            errors.append(f"[{label}] {resp.status} {resp.url}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    page.on("response", on_response)


class AdhocFlow:
    def __init__(self, routes, personas):
        self.ROUTES = routes
        self.PERSONAS = personas

    def run(self, page, ctx):
        for r in self.ROUTES:
            ctx.visit(r)
            ctx.shoot(r)


def load_flows(args):
    if args.all:
        names = sorted(
            m.name for m in pkgutil.iter_modules([str(HERE / "flows")]) if not m.name.startswith("_")
        )
        return [(n, importlib.import_module(f"flows.{n}")) for n in names]
    if args.flow:
        return [(f, importlib.import_module(f"flows.{f}")) for f in args.flow]
    return [("adhoc", AdhocFlow(args.routes or ["/"], [args.persona] if args.persona else [None]))]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--persona", help="enter via /demo/<id> (ad-hoc mode, or override a flow's PERSONAS)")
    ap.add_argument("--routes", nargs="*", help="ad-hoc routes to visit")
    ap.add_argument("--flow", action="append", help="flow module in scripts/flows/ (repeatable)")
    ap.add_argument("--all", action="store_true", help="run every flow module")
    ap.add_argument("--out", default=".smoke/adhoc")
    ap.add_argument("--theme", choices=["light", "dark", "both"], default="both")
    ap.add_argument("--widths", default="1440,390")
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    themes = ["light", "dark"] if args.theme == "both" else [args.theme]
    widths = [int(w) for w in args.widths.split(",") if w.strip()]
    flows = load_flows(args)

    failures: list[str] = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=not args.headed)
        for name, flow in flows:
            personas = [args.persona] if args.persona else (getattr(flow, "PERSONAS", None) or [None])
            for persona in personas:
                for theme in themes:
                    for width in widths:
                        label = f"{name}/{persona or 'none'}/{theme}/{width}"
                        errors: list[str] = []
                        context = browser.new_context(
                            viewport={"width": width, "height": HEIGHT.get(width, 900)},
                            color_scheme=theme,
                        )
                        apply_theme(context, theme)
                        page = context.new_page()
                        attach_listeners(page, errors, label)
                        ctx = Ctx(page, args.base, out, persona, theme, width, errors)
                        try:
                            if persona:
                                ctx.enter_persona(persona)
                            flow.run(page, ctx)
                        except Exception as exc:  # noqa: BLE001
                            errors.append(f"exception: {exc!r}\n{traceback.format_exc(limit=3)}")
                        finally:
                            context.close()
                        print(f"{label}: {'ok' if not errors else f'FAIL ({len(errors)})'}", flush=True)
                        for e in errors:
                            print(f"    {e}", flush=True)
                        failures.extend(f"{label}: {e}" for e in errors)
        browser.close()

    print(f"\n{'PASS' if not failures else 'FAIL'}: {len(failures)} problem(s); screenshots in {out}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
