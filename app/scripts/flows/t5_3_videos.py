"""T5.3 Empty-state and setting videos (spec 5.12) and the page tour targets (spec 5.13).

  tour_targets:       every lib/tours.ts page target exists on its route in the default populated scenario
                      (trial-admin), 11 ids.
  reviews_level1:     empty org /reviews (payg-admin-low): media "How a review works 1:15" is keyboard-playable,
                      the PC-37 upload zone is there, title and footnote follow spec 5.12; no tabs, search,
                      filters or "Showing" totals.
  billing_never_used: pending-admin has no ledger, so Usage and Invoices are level 1 illustrated cards (no video)
                      (no ghost drawing).
  auto_reload_hint:   trial-admin, Settings: the first flip of the auto-reload switch shows the hint once, the
                      switch still flips, a second flip does not add a card, a reload does not bring it back.
  empty_libraries:    checklists with none -> level 1 + "Mapping a checklist 1:30"; layouts default-only -> level 1.
The libraries are emptied through localStorage last (a fresh browser context per run).
"""
import re
from pathlib import Path

PERSONAS = ["trial-admin"]
ROUTES = ["/reviews", "/configure/checklists", "/configure/workbook-layouts", "/configure/billing"]

TARGETS = {
    "/reviews": ["reviews-start", "reviews-tabs", "reviews-row-action"],
    "/configure/checklists": ["checklists-upload", "checklists-default"],
    "/configure/workbook-layouts": ["layouts-default", "layouts-open"],
    "/configure/billing": ["billing-balance", "billing-runway", "billing-usage", "billing-add"],
}


def media_ok(ctx, page, where, title, dur):
    m = page.locator(".es .es-media")
    if not ctx.check(m.count() == 1, f"{where}: one media slot"):
        return None
    txt = m.first.inner_text()
    ctx.check(title in txt and dur in txt, f"{where}: media shows '{title}' and {dur} ({txt!r})")
    ctx.check(m.first.get_attribute("aria-hidden") is None, f"{where}: media is not aria-hidden")
    ctx.check(page.locator(".es .gh-chart, .es .gh-rows, .es .gh-stats").count() == 0, f"{where}: no ghost drawing")
    return m


def keyboard_play(ctx, page, where):
    poster = page.locator(".es .es-media .hc-poster")
    if not ctx.check(poster.count() == 1, f"{where}: poster button present"):
        return
    ctx.check(poster.evaluate("e => e.tagName") == "BUTTON", f"{where}: poster is a real button")
    poster.focus()
    ctx.check(poster.evaluate("e => e === document.activeElement"), f"{where}: poster takes focus")
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    ctx.check(page.locator(".es .es-media .hc-ctrls").count() == 1, f"{where}: Enter starts the player (controls appear)")
    ctx.check(page.locator(".es .es-media .hc-ctrls button[aria-label]").count() >= 2, f"{where}: controls are labelled buttons")


def reviews_level1(page, ctx):
    ctx.enter_persona("payg-admin-low")
    ctx.visit("/reviews")
    txt = page.locator("main").first.inner_text()
    ctx.check("Every figure checked against the appraisal" in txt, "/reviews level 1: spec title")
    ctx.check(re.search(r"traces each number to its page and drafts the findings", txt) is not None, "/reviews level 1: body copy")
    ctx.check(re.search(r"see this until .+ first review is in", txt) is not None, f"/reviews level 1: footnote ({txt[-160:]!r})")
    media_ok(ctx, page, "/reviews", "How a review works", "1:15")
    ctx.check(page.locator(".rq-zone").count() == 1, "/reviews level 1: PC-37 upload zone")
    ctx.check("Upload an appraisal PDF" in txt and "300 pages" in txt.replace("Up to 300", "300"), "/reviews level 1: zone copy")
    ctx.check(page.locator('[role="tablist"]').count() == 0, "/reviews level 1: no tabs")
    ctx.check(page.locator('input[type="search"], input[placeholder*="Search"]').count() == 0, "/reviews level 1: no search")
    ctx.check(page.get_by_role("button", name=re.compile(r"filter", re.I)).count() == 0, "/reviews level 1: no filters")
    ctx.check(re.search(r"Showing \d+ of", txt) is None, "/reviews level 1: no totals")
    ctx.check(page.locator('[data-tour="reviews-start"]').count() == 1, "/reviews level 1: OrderButton still there")
    ctx.check(page.locator(".rq-sample").count() == 0 and "Open the sample" not in txt, "/reviews level 1: no sample aside")
    ctx.check(page.get_by_text("Take a 1-minute tour").count() == 0, "/reviews level 1: no tour chip (PC-38)")
    ctx.shoot("t5-3-reviews-empty")
    keyboard_play(ctx, page, "/reviews")
    ctx.shoot("t5-3-reviews-empty-playing")


def locked_zone(page, ctx):
    ctx.enter_persona("pending-admin")
    ctx.visit("/reviews")
    z = page.locator(".rq-zone")
    if not ctx.check(z.count() == 1, "pending: upload zone present"):
        return
    ctx.check(z.get_attribute("aria-disabled") == "true" and z.get_attribute("disabled") is None, "pending: zone is aria-disabled, not disabled")
    ctx.check(z.locator(".tabler-icon-hourglass-high").count() >= 1 or page.locator(".rq-zone-wrap .tabler-icon-hourglass-high").count() >= 1, "pending: hourglass glyph")
    z.click(force=True)
    page.wait_for_timeout(500)
    ctx.check(page.locator('.lock-dlg[role="dialog"], [role="dialog"].lock-dlg').count() >= 1, "pending: click opens the lock dialog")
    page.keyboard.press("Escape")


def billing_never_used(page, ctx):
    ctx.enter_persona("pending-admin")
    # Tab-level empties (12 Nov rule): illustrated card + action + "How credits work" link, no video.
    ctx.visit("/configure/billing?tab=usage")
    ctx.check(page.locator(".bec").count() == 1 and page.locator(".bec .ev").count() == 0, "Usage level 1: one illustrated card, no video")
    ctx.check(page.locator(".bec a", has_text="How credits work").count() == 1, "Usage card links to How credits work")
    ctx.check(page.locator(".ud-filter, .ud-grid").count() == 0, "Usage level 1: no filter row or cards")
    ctx.shoot("t5-3-usage-empty")
    ctx.visit("/configure/billing?tab=invoices")
    ctx.check(page.locator(".bec").count() == 1 and page.locator(".bec .ev").count() == 0, "Invoices level 1: one illustrated card, no video")
    ctx.check(page.locator(".bl-table, .bl-thead").count() == 0, "Invoices level 1: no table headers")
    ctx.shoot("t5-3-invoices-empty")


def auto_reload_hint(page, ctx):
    ctx.enter_persona("trial-admin")
    ctx.visit("/configure/billing?tab=settings")
    sw = page.get_by_role("switch", name="Auto-reload")
    if not ctx.check(sw.count() == 1, "settings: auto-reload switch"):
        return
    ctx.check(sw.get_attribute("aria-disabled") != "true" and sw.get_attribute("disabled") is None, "switch is usable (card on file)")
    ctx.check(page.locator('.svh-link[data-hint="auto-reload"]').count() == 0, "no hint before the first flip")
    before = sw.get_attribute("aria-checked")
    sw.click()
    page.wait_for_timeout(600)
    ctx.check(sw.get_attribute("aria-checked") != before, "first flip: the switch really flipped (never blocked)")
    hint = page.locator('.svh-link[data-hint="auto-reload"]')
    ctx.check(hint.count() == 1, "first flip: hint shown")
    if hint.count():
        t = hint.first.inner_text()
        ctx.check("Buying credits and auto-reload" in t and "3:40" in t, f"hint carries title and duration ({t!r})")
        ctx.check(hint.first.locator('a[href="/learn"]').count() == 1, "hint links to the Learning Center")
    ctx.shoot("t5-3-auto-reload-hint")
    # Second flip: the switch works and the hint must NOT re-fire.
    sw.click()
    page.wait_for_timeout(500)
    ctx.check(sw.get_attribute("aria-checked") == before, "second flip works too")
    ctx.check(page.locator(".svh-link").count() == 1, "second flip: still the one line, no second hint")
    # Once per user per setting: after a reload the next flip shows nothing.
    ctx.visit("/configure/billing?tab=settings")
    page.get_by_role("switch", name="Auto-reload").click()
    page.wait_for_timeout(500)
    ctx.check(page.locator('.svh-link[data-hint="auto-reload"]').count() == 0, "after reload: no hint again (seen once per user)")


def no_card_reason(page, ctx):
    ctx.enter_persona("trial-admin")
    ctx.visit("/configure/billing?tab=settings")
    page.evaluate(
        "() => { const k='parachute:wallet_settings'; const a=JSON.parse(localStorage.getItem(k)||'[]'); "
        "localStorage.setItem(k, JSON.stringify(a.map(x => ({...x, paymentMethod: null, cardLast4: undefined, autoReload: false})))); }"
    )
    ctx.visit("/configure/billing?tab=settings")
    sw = page.get_by_role("switch", name="Auto-reload")
    if not ctx.check(sw.count() == 1, "no-card: switch present"):
        return
    ctx.check(sw.get_attribute("disabled") is None, "no-card: no disabled attribute")
    ctx.check(sw.get_attribute("aria-disabled") == "true", "no-card: aria-disabled=true")
    desc = sw.get_attribute("aria-describedby")
    ctx.check(bool(desc) and page.locator('[id="' + str(desc) + '"]').count() == 1, f"no-card: reason reachable ({desc!r})")
    ctx.check(page.locator('[data-testid="ar-need-card"]').count() == 0, "no-card: no status before the click")
    sw.click(force=True)  # Playwright treats aria-disabled as not enabled
    page.wait_for_timeout(400)
    st = page.locator('[data-testid="ar-need-card"]')
    ctx.check(st.count() == 1 and st.first.get_attribute("role") == "status", "no-card: click shows the reason (role=status)")
    ctx.check(sw.get_attribute("aria-checked") == "false", "no-card: switch stays off")
    ctx.check(page.locator(".svh").count() == 0, "no-card: no video hint for a blocked flip")
    ctx.shoot("t5-3-auto-reload-no-card")


def other_hints(page, ctx):
    ctx.enter_persona("trial-admin")
    ctx.visit("/configure/defaults")
    ctx.check(page.locator('.svh-link[data-hint="review-defaults"]').count() == 0, "defaults: no hint before a change")
    page.get_by_role("switch", name="Enable auto-accept").click()
    page.wait_for_timeout(400)
    h = page.locator('.svh-link[data-hint="review-defaults"]')
    ctx.check(h.count() == 1 and "Choose review defaults" in h.first.inner_text() and "5:10" in h.first.inner_text(), "defaults: first change shows the 5:10 hint")
    page.get_by_role("switch", name="Enable auto-accept").click()
    page.wait_for_timeout(300)
    ctx.check(page.locator('.svh-link[data-hint="review-defaults"]').count() == 1, "defaults: second change: still one card")

    ctx.visit("/configure/checklists")
    rows = page.locator(".cktable .ckrow")
    n = rows.count()
    done = False
    for i in range(n):
        rows.nth(i).locator(".ckrow-actions button").click()
        item = page.get_by_role("menuitem", name="Set as default")
        if item.count():
            item.first.click()
            done = True
            break
        page.keyboard.press("Escape")
    ctx.check(done, "checklists: found a row with Set as default")
    page.wait_for_timeout(500)
    h = page.locator('.svh-link[data-hint="checklist-default"]')
    ctx.check(h.count() == 1 and "Mapping a checklist" in h.first.inner_text(), "checklists: Set as default shows the hint")

    ctx.visit("/configure/workbook-layouts/view?v=wv-commercial-1")
    ctx.check(page.locator(".svh").count() == 0, "layout view: merely visiting shows no hint")
    btn = page.get_by_role("button", name="Promote to published")
    if ctx.check(btn.count() == 1, "layout view: archived version offers Promote"):
        btn.click()
        page.wait_for_timeout(700)
        h = page.locator('.svh-link[data-hint="layout-publish"]')
        ctx.check(h.count() == 1 and "Custom workbook layouts" in h.first.inner_text(), "layout view: Promote shows the hint")
        ctx.check("/workbook-layouts/view" in page.url, "layout view: first time stays on the page")
        ctx.shoot("t5-3-layout-hint")


def tour_targets(page, ctx):
    ctx.enter_persona("trial-admin")
    src = (Path(__file__).resolve().parents[2] / "src" / "lib" / "tours.ts").read_text(encoding="utf8")
    ids = [i for v in TARGETS.values() for i in v]
    ctx.check(len(ids) == 11, "11 page tour ids")
    for i in ids:
        ctx.check(f'tourTarget("{i}")' in src, f"lib/tours.ts still names {i}")
    for route, want in TARGETS.items():
        ctx.visit(route)
        ctx.settle(800)
        for i in want:
            n = page.locator(f'[data-tour="{i}"]').count()
            ctx.check(n == 1, f"{route}: [data-tour={i}] present exactly once ({n})")
        if route == "/configure/checklists":
            ctx.check(page.locator('[data-tour="checklists-upload"]').evaluate("e => e.matches('button.cfg-uploadzone')"), "checklists-upload is button.cfg-uploadzone")
        if route == "/configure/billing":
            ctx.check(page.locator('[data-tour="billing-balance"]').evaluate("e => e.matches('section.ov-hero')"), "billing-balance is section.ov-hero")
            ctx.check(page.locator('[data-tour="billing-usage"]').get_attribute("role") == "tab", "billing-usage is the Usage tab")
        if route == "/configure/workbook-layouts":
            ok = page.evaluate(
                "() => { const r=document.querySelector('[data-tour=\"layouts-default\"]'), o=document.querySelector('[data-tour=\"layouts-open\"]');"
                " return !!r && !!o && r.classList.contains('ckrow') && !!r.querySelector('.fam-default') && r.contains(o) && o.classList.contains('fam-title'); }"
            )
            ctx.check(ok, "layouts-default is the default row and layouts-open is its open action")
        if route == "/reviews":
            ctx.check(page.locator('.qrow [data-tour="reviews-row-action"]').count() == 1, "reviews-row-action sits inside a row")
        ctx.shoot("t5-3-targets-" + route.strip("/").replace("/", "-"))


def empty_libraries(page, ctx):
    ctx.enter_persona("trial-admin")
    ctx.visit("/configure/checklists")
    page.evaluate("() => localStorage.setItem('parachute:checklistTemplates', '[]')")
    ctx.visit("/configure/checklists")
    txt = page.locator("main").first.inner_text()
    ctx.check("Your compliance checklist lives here" in txt, "checklists: level-1 title")
    media_ok(ctx, page, "checklists", "Mapping a checklist", "1:30")
    ctx.check(page.locator(".cktable, .ckcols").count() == 0, "checklists level 1: no table or headers")
    ctx.check(page.locator("button.cfg-uploadzone").count() == 0, "checklists level 1: no second upload zone")
    ctx.check(page.get_by_role("button", name="Upload a checklist").count() == 1, "checklists level 1: Upload a checklist action")
    ctx.shoot("t5-3-checklists-empty")
    keyboard_play(ctx, page, "checklists")

    ctx.visit("/configure/workbook-layouts")
    page.evaluate(
        "() => { const k='parachute:workbookLayouts'; const a=JSON.parse(localStorage.getItem(k)||'[]'); localStorage.setItem(k, JSON.stringify(a.slice(0,1))); }"
    )
    ctx.visit("/configure/workbook-layouts")
    txt = page.locator("main").first.inner_text()
    ctx.check("Make the workbook yours" in txt, "layouts default-only: level-1 title")
    media_ok(ctx, page, "layouts", "Custom workbook layouts", "6:10")
    ctx.check(page.locator(".cktable, .ckcols").count() == 0, "layouts level 1: no table or headers")
    ctx.check(page.get_by_role("button", name="Start from a built-in layout").count() == 1, "layouts level 1: Start from a built-in layout")
    ctx.shoot("t5-3-layouts-empty")


def run(page, ctx):
    # Order matters: tour targets need the populated scenario; the library step empties it last.
    tour_targets(page, ctx)
    reviews_level1(page, ctx)
    locked_zone(page, ctx)
    billing_never_used(page, ctx)
    auto_reload_hint(page, ctx)
    other_hints(page, ctx)
    no_card_reason(page, ctx)
    empty_libraries(page, ctx)
