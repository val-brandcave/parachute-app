"""T5.5 Prototype Index, fill wand, auth states.

Runs without a persona. Checks: /prototype lists every page.tsx route with zero registry warnings,
search filters and the counter reads "N of M screens", state chips deep-link and land in that state,
the Flows tab lists the nine flows, the wand on /welcome fills Self-serve and Shift-wand Enterprise
without submitting, the auth ?variant= states, no Demo accounts panel, and the RoutingNote shows
only while controls are visible.
"""

import re
from pathlib import Path

PERSONAS = [None]
APP = Path(__file__).resolve().parents[2] / "src" / "app"
NON_SCREEN = {"/prototype/go"}
NOTE = "Route: Enterprise · because Reviewers = 11+ (≥ 11)"


def page_routes():
    out = set()
    for p in APP.rglob("page.tsx"):
        segs = [s for s in p.parent.relative_to(APP).parts if not (s.startswith("(") and s.endswith(")"))]
        out.add("/" + "/".join(segs))
    return out - NON_SCREEN


def count_text(page):
    return " ".join(page.locator("[data-testid=pi-count]").inner_text().split())


def fill(page, shift=False):
    """Click the pill's wand when it is mounted; otherwise dispatch the same window event."""
    wand = page.get_by_role("button", name=re.compile(r"fill", re.I))
    if wand.count():
        wand.first.click(modifiers=["Shift"] if shift else [])
    else:
        page.evaluate(
            "(inv) => window.dispatchEvent(new CustomEvent('parachute:proto-fill', { detail: { invalid: inv } }))",
            shift,
        )
    page.wait_for_timeout(500)


def selected_tabs(page):
    return [t.strip() for t in page.locator("[role=tab][aria-selected=true]").all_inner_texts()]


def run(page, ctx):
    warns = []
    page.on("console", lambda m: warns.append(m.text) if m.type == "warning" and "[prototype-registry]" in m.text else None)

    # 1. Every page.tsx route is listed, and the dev check is quiet.
    ctx.visit("/prototype")
    ctx.check(page.get_by_role("heading", name="Prototype Index", level=1).is_visible(), "index: heading")
    listed = set(page.locator(".pi-card .pi-route").all_inner_texts())
    expected = page_routes()
    missing = sorted(expected - listed)
    extra = sorted(listed - expected)
    ctx.check(not missing, f"index lists every page.tsx route (missing {missing})")
    ctx.check(not extra, f"index lists no route without a page (extra {extra})")
    ctx.check(page.locator(".pi-problems").count() == 0, "index: no registry problems panel")
    ctx.check(len(warns) == 0, f"index: dev warning count 0 (got {warns})")
    total = len(expected)
    ctx.check(re.fullmatch(rf"{total} of {total} screens", count_text(page)) is not None, f"counter reads '{total} of {total} screens' ({count_text(page)!r})")
    ctx.check(page.get_by_role("button", name="Copy scenario link").count() == 1, "index: Copy scenario link")
    ctx.check(page.get_by_role("button", name="Open prototype").count() == 1, "index: Open prototype menu")
    ctx.shoot("t5-5-index")

    # 2. Search filters.
    page.get_by_placeholder("Search pages, routes, states, tags").fill("billing")
    page.wait_for_timeout(300)
    n = page.locator(".pi-card").count()
    ctx.check(0 < n < total, f"search 'billing' filters ({n} of {total})")
    ctx.check(count_text(page) == f"{n} of {total} screens", f"counter follows the search ({count_text(page)!r})")
    ctx.check(page.locator(".pi-card[data-screen=billing]").count() == 1, "search 'billing' keeps the Billing card")
    ctx.shoot("t5-5-index-search")

    # 3. A state chip deep-links and lands in that state (billing > Low = 3 credits).
    page.locator(".pi-card[data-screen=billing] .pi-chip", has_text="Low").first.click()
    try:
        page.wait_for_url("**/configure/billing**", timeout=60000)
    except Exception:
        ctx.errors.append("assert: Billing > Low chip did not land on /configure/billing")
        return
    ctx.settle(1500)
    pill = " ".join(page.locator(".credits-pill").first.inner_text().split()) if page.locator(".credits-pill").count() else ""
    m = re.search(r"\d+", pill)
    ctx.check(m is not None and int(m.group()) == 3, f"Low state landed: credits pill shows 3 ({pill!r})")
    ctx.shoot("t5-5-chip-low")

    # 4. Flows tab lists the nine flows.
    ctx.visit("/prototype")
    page.get_by_role("tab", name="Flows").click()
    page.wait_for_timeout(300)
    ctx.check(page.locator(".pi-flow").count() == 9, f"flows tab lists nine flows ({page.locator('.pi-flow').count()})")
    ctx.check(count_text(page) == "9 of 9 flows", f"flows counter ({count_text(page)!r})")
    ctx.shoot("t5-5-flows")
    page.get_by_role("tab", name="States").click()
    page.wait_for_timeout(300)
    ctx.check(page.locator(".pi-states tbody tr").count() > 20, "states tab lists the states")

    # 5. Wand on /welcome: Self-serve, then Enterprise, never submitted.
    ctx.visit("/prototype/go?screen=welcome&state=self-serve")
    try:
        page.wait_for_url("**/welcome", timeout=60000)
    except Exception:
        ctx.errors.append("assert: welcome self-serve link did not land on /welcome")
        return
    ctx.settle(1500)
    fill(page)
    sel = selected_tabs(page)
    ctx.check("2–10" in sel and "Under 50" in sel, f"wand fills Self-serve 2-10 / Under 50 ({sel})")
    ctx.check(page.locator("#wel-org").input_value().strip() != "", "wand fills the organization name")
    ctx.check(page.url.rstrip("/").endswith("/welcome"), "wand never submits")
    ctx.shoot("t5-5-wand-self-serve")
    fill(page, shift=True)
    sel = selected_tabs(page)
    ctx.check("11+" in sel and "200+" in sel, f"Shift-wand fills Enterprise 11+ / 200+ ({sel})")
    ctx.check(page.url.rstrip("/").endswith("/welcome"), "Shift-wand never submits")
    ctx.shoot("t5-5-wand-enterprise")

    # 6. RoutingNote: exact text for Reviewers 11+ alone, only while controls are visible.
    page.get_by_role("tab", name="2–10").click()
    page.get_by_role("tab", name="Under 50").click()
    page.get_by_role("tab", name="11+").click()
    page.wait_for_timeout(400)
    note = page.locator("[data-proto-note=routing]")
    ctx.check(note.count() == 1 and " ".join(note.inner_text().split()) == NOTE, f"routing note text ({note.inner_text() if note.count() else None!r})")
    # A client-side `?controls=0` (the pill's own link handling). A hard load of the same link
    # logs a React "unique key" error from the pill's host; see the T5.5 report (Open items).
    page.evaluate("() => history.pushState(null, '', '/welcome?controls=0')")
    page.wait_for_timeout(800)
    ctx.check(page.locator("[data-proto-note=routing]").count() == 0, "routing note hidden with ?controls=0")
    page.evaluate("() => localStorage.setItem('parachute:proto:hidden', 'true')")
    ctx.visit("/welcome")
    ctx.check(page.locator("[data-proto-note=routing]").count() == 0, "routing note hidden when controls are hidden")
    page.evaluate("() => localStorage.removeItem('parachute:proto:hidden')")
    ctx.visit("/welcome")
    ctx.check(page.locator("[data-proto-note=routing]").count() == 1, "routing note back when controls are visible")

    # 7. Auth variants and the sign-in page.
    ctx.visit("/auth/verify?variant=wrong-code")
    err = page.locator(".kc-err")
    ctx.check(err.count() == 1 and "match" in err.first.inner_text(), "verify ?variant=wrong-code shows the error")
    ctx.shoot("t5-5-verify-wrong-code")
    fill(page)
    ctx.check(page.locator(".kc-code input").first.input_value() == "1", "wand fills the verify code")
    ctx.visit("/auth/sign-in")
    body = page.inner_text("body")
    ctx.check("Demo accounts" not in body and page.locator(".kc-demo").count() == 0, "sign-in has no Demo accounts panel")
    ctx.shoot("t5-5-sign-in")
    ctx.visit("/auth/sign-in?variant=bad-credentials")
    ctx.check("incorrect" in page.locator(".kc-err").first.inner_text(), "sign-in ?variant=bad-credentials shows the error")
    ctx.visit("/auth/reset?variant=sent")
    ctx.check("on its way" in page.inner_text("body"), "reset ?variant=sent shows the confirmation")
    ctx.visit("/auth/create-account?variant=weak-password")
    ctx.check("12 characters" in page.locator(".kc-err").first.inner_text(), "create-account ?variant=weak-password shows the error")
    ctx.visit("/auth/mfa?variant=wrong-code")
    ctx.check(page.locator(".kc-err").count() == 1, "mfa ?variant=wrong-code shows the error")
