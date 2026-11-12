"""T5.4 state pill and scenario popover (spec §6, state-system-draft §3.1-§3.5).

Persona trial-admin (Dana, Harbor Community Bank = the stage org).
- pill at bottom centre (coordinator note: top centre covered the header / page bands;
  checked: overlaps no header control), z-index 210, on Get started, Billing and Dashboard (every theme/width)
- each Billing state (inline segment, or a row in the More menu) renders its state after one pick and survives a reload
- no segment selected after a popover axis change (no "Custom" label)
- scenario actions: Approve now, Complete next step, Add 5, Spend 1, Reset org,
  Reset tours and celebrations, Replay arrival
- /demo/<id> for the nine legacy persona ids still lands where it did
- Ctrl+. hides (persisted), ?controls=0 hides without persisting
- NEXT_PUBLIC_PROTOTYPE_CONTROLS=0 removes it: checked against a second server when
  PROTO_KILL_BASE is set (e.g. a dev server started with that env var), else noted as skipped.
Full checks at light/1440; the other theme/width runs check presence and take screenshots.
"""

import os
import re

PERSONAS = ["trial-admin"]

PILL = ".proto-pill"
TOURS = "parachute:tours-seen"
CELEBRATED = "parachute:celebrated"

# What each Billing state shows in the Overview hero (spec §5.8; numbers from the recipes).
BILLING_TEXT = {
    "trial": ["trial credits"],
    "healthy": ["14", "Enough for 7 full reviews"],
    "low": ["Running low"],
    "short": ["Not enough for a full review"],
    "zero": ["Out of credits"],
    "expiring": ["expire"],
    "auto-reload": ["Auto-reload on"],
    "held": ["On hold"],
    "invoiced": ["so far"],
    "fresh": ["trial credits"],
    "bonus-ending": ["left to earn your bonus reviews"],
    "bonus-closed": ["The bonus window has closed"],
    "reviewer-healthy": ["Team balance"],
    "reviewer-low": ["Team balance", "Running low"],
    "reviewer-zero": ["Team balance"],
    "reviewer-requested": ["You asked"],
}

# Every spec §5.8 row the Billing pill must reach (fix round 1, item 6).
BILLING_REQUIRED = {"fresh", "trial", "healthy", "low", "zero", "expiring", "auto-reload", "bonus-ending",
                    "bonus-closed", "held", "invoiced", "reviewer-healthy", "reviewer-low", "reviewer-zero",
                    "reviewer-requested"}

# Where each legacy alias landed before T5.4 (old entryRoute through resolveEntryRoute).
LEGACY = {
    "prospect": ["/auth/create-account"],
    "prospect-sales": ["/welcome"],
    "pending-admin": ["/get-started"],
    "trial-admin": ["/get-started"],
    "payg-admin-low": ["/launchpad"],
    "reviewer": ["/get-started", "/dashboard"],
    "approver": ["/reviews"],
    "returning": ["/launchpad"],
    "enterprise-yc": ["/youconnect"],
}


def main_text(page):
    return page.locator("main").first.inner_text() if page.locator("main").count() else page.locator("body").inner_text()


def pill_geometry(ctx, page, where):
    pill = page.locator(PILL)
    ctx.check(pill.count() == 1, f"{where}: one pill")
    if pill.count() != 1:
        return
    box = pill.bounding_box()
    vw = page.viewport_size["width"]
    centre = box["x"] + box["width"] / 2
    ctx.check(abs(centre - vw / 2) <= 2, f"{where}: pill centred (centre {centre:.0f} of {vw})")
    # Bottom centre (coordinator note: never over the header band or a page's own band).
    vh = page.viewport_size["height"]
    bottom = box["y"] + box["height"]
    ctx.check(vh - 24 <= bottom <= vh, f"{where}: pill at the bottom edge (bottom {bottom:.0f} of {vh})")
    hits = page.evaluate(
        """([sel]) => { const p = document.querySelector(sel).getBoundingClientRect();
             const hdr = [...document.querySelectorAll('header')].find(h => h.getBoundingClientRect().top <= 1);
             if (!hdr) return [];
             return [...hdr.querySelectorAll('button, a, [role=button], input')].filter(el => {
               const r = el.getBoundingClientRect();
               return r.width > 0 && r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top;
             }).map(el => el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30)); }""",
        [PILL],
    )
    ctx.check(not hits, f"{where}: pill overlaps no header control ({hits})")
    z = page.evaluate("(s) => getComputedStyle(document.querySelector(s)).zIndex", PILL)
    ctx.check(z == "210", f"{where}: pill z-index 210 (got {z!r})")
    ctx.check(page.evaluate("(s) => document.querySelector(s).parentElement === document.body", PILL), f"{where}: pill portaled to body")


def seg(page, sid):
    return page.locator(f'{PILL} .proto-seg[data-state="{sid}"]')


MORE_POP = ".proto-more-pop"


def open_more(page):
    if page.locator(MORE_POP).count() == 0:
        page.locator(f"{PILL} .proto-more").click()
        page.wait_for_selector(MORE_POP, timeout=5000)


def all_state_ids(page):
    """Inline segments show only the key states; the More menu lists every state."""
    if page.locator(f"{PILL} .proto-more").count() == 0:
        segs = page.locator(f"{PILL} .proto-seg")
        return [segs.nth(i).get_attribute("data-state") for i in range(segs.count())]
    open_more(page)
    items = page.locator(f"{MORE_POP} .proto-more-item")
    ids = [items.nth(i).get_attribute("data-state") for i in range(items.count())]
    page.keyboard.press("Escape")
    page.wait_for_timeout(250)
    return ids


def is_planned(page, sid):
    s = seg(page, sid)
    if s.count():
        return "is-planned" in (s.get_attribute("class") or "")
    open_more(page)
    planned = "is-planned" in (page.locator(f'{MORE_POP} .proto-more-item[data-state="{sid}"]').get_attribute("class") or "")
    page.keyboard.press("Escape")
    page.wait_for_timeout(250)
    return planned


def pick_state(page, sid):
    """One click on the inline segment, or More -> the row when the state isn't inline."""
    s = seg(page, sid)
    if s.count():
        s.click()
        return
    open_more(page)
    page.locator(f'{MORE_POP} .proto-more-item[data-state="{sid}"]').click()


def wait_pressed(page, sid, timeout=15000):
    try:
        page.wait_for_selector(f'{PILL} .proto-seg[data-state="{sid}"][aria-pressed="true"]', timeout=timeout)
        return True
    except Exception:
        return False


def open_scenario(page):
    if page.locator(".proto-pop").count() == 0:
        page.get_by_role("button", name="Scenario", exact=True).click()
        page.wait_for_selector(".proto-pop", timeout=5000)


def close_scenario(page):
    if page.locator(".proto-pop").count():
        page.keyboard.press("Escape")
        page.wait_for_timeout(250)


def axis(page, name, label):
    page.locator(f'.proto-pop [role=tablist][aria-label="{name}"] [role=tab]', has_text=label).first.click()
    page.wait_for_timeout(1500)


def action(page, name):
    page.locator(".proto-pop .proto-act", has_text=name).first.click()
    page.wait_for_timeout(1200)
    return page.locator(".proto-pop .proto-said").inner_text() if page.locator(".proto-pop .proto-said").count() else ""


def credits(page):
    t = page.locator(".credits-pill-l").first.inner_text() if page.locator(".credits-pill-l").count() else ""
    m = re.match(r"(\d+) credit", t)
    return int(m.group(1)) if m else None


def done_count(page):
    t = page.locator(".gs-label-count").first.inner_text() if page.locator(".gs-label-count").count() else ""
    m = re.match(r"(\d+)/", t)
    return int(m.group(1)) if m else None


# ---------------------------------------------------------------------- checks

def billing_states(ctx, page):
    ctx.visit("/configure/billing")
    ids = all_state_ids(page)
    missing = BILLING_REQUIRED - set(ids)
    ctx.check(not missing, f"billing pill reaches every spec §5.8 row (missing {sorted(missing)})")
    for sid in ids:
        if is_planned(page, sid):
            continue
        pick_state(page, sid)  # one click (inline) or More -> row
        ok = wait_pressed(page, sid)
        ctx.check(ok, f"billing {sid}: segment selected after one click")
        page.wait_for_timeout(600)
        want = BILLING_TEXT.get(sid)
        txt = main_text(page)
        if want:
            ctx.check(all(w in txt for w in want), f"billing {sid}: shows {want}")
        ctx.shoot(f"t5-4-billing-{sid}")
        page.reload(wait_until="domcontentloaded")
        ctx.settle(800)
        ctx.check(wait_pressed(page, sid, 8000), f"billing {sid}: still selected after reload")
        if want:
            txt = main_text(page)
            ctx.check(all(w in txt for w in want), f"billing {sid}: state survives reload")


def custom(ctx, page):
    ctx.visit("/configure/billing")
    pick_state(page, "low")
    wait_pressed(page, "low")
    ctx.check(page.locator(f"{PILL} .proto-custom").count() == 0, "no Custom while a state matches")
    open_scenario(page)
    axis(page, "Audience", "Enterprise")
    close_scenario(page)
    ctx.check(page.locator(f'{PILL} .proto-seg[aria-pressed="true"]').count() == 0, "no segment selected under Custom")
    ctx.shoot("t5-4-custom")


def actions(ctx, page):
    # Back to the Mid-setup trial state on Get started.
    ctx.visit("/get-started")
    pick_state(page, "mid")
    wait_pressed(page, "mid")
    ctx.settle(600)

    open_scenario(page)
    before = done_count(page)
    said = action(page, "Complete next step")
    after = done_count(page)
    ctx.check(before is not None and after == before + 1, f"Complete next step: {before} -> {after} ({said!r})")

    c0 = credits(page)
    said = action(page, "Add 5 credits")
    c1 = credits(page)
    ctx.check(c0 is not None and c1 == c0 + 5, f"Add 5: {c0} -> {c1} ({said!r})")
    ctx.check(page.locator(f'{PILL} .proto-seg[aria-pressed="true"]').count() == 0, "after Add 5 no state is selected (rows edited)")
    said = action(page, "Spend 1 credit")
    c2 = credits(page)
    ctx.check(c1 is not None and c2 == c1 - 1, f"Spend 1: {c1} -> {c2} ({said!r})")

    said = action(page, "Reset org")
    page.wait_for_timeout(1000)
    c3 = credits(page)
    ctx.check(c3 == c0, f"Reset org rebuilds the scenario's wallet: {c3} == {c0} ({said!r})")
    ctx.check(done_count(page) == before, f"Reset org rebuilds setup progress ({done_count(page)} == {before})")

    # Reset tours and celebrations clears this user's prefs.
    page.evaluate(
        "([t, c]) => { localStorage.setItem(t, JSON.stringify({'user-dr': {'get-started': true}}));"
        " localStorage.setItem(c, JSON.stringify({'user-dr': {onboarding: true}})); }",
        [TOURS, CELEBRATED],
    )
    page.reload(wait_until="domcontentloaded")
    ctx.settle(800)
    open_scenario(page)
    said = action(page, "Reset tours and celebrations")
    seen = page.evaluate("([t, c]) => [localStorage.getItem(t), localStorage.getItem(c)]", [TOURS, CELEBRATED])
    ctx.check("user-dr" not in (seen[0] or "") and "user-dr" not in (seen[1] or ""), f"Reset tours and celebrations clears prefs ({seen}, {said!r})")

    # Approve now: pending -> approved, trial credits granted.
    open_scenario(page)
    axis(page, "Lifecycle", "Pending")
    page.wait_for_timeout(800)
    held = page.locator(".credits-pill-l").first.inner_text() if page.locator(".credits-pill-l").count() else ""
    ctx.check("after your call" in held, f"pending: credits held ({held!r})")
    said = action(page, "Approve now")
    page.wait_for_timeout(800)
    ctx.check("approved" in said, f"Approve now reports ({said!r})")
    ctx.check(credits(page) is not None, f"approved: credits pill shows a balance ({credits(page)})")
    orgs = page.evaluate("() => JSON.parse(localStorage.getItem('parachute:orgs'))")
    hcb = next((o for o in orgs if o["id"] == "org-hcb"), {})
    ctx.check(hcb.get("approval") == "approved", f"Approve now writes approval ({hcb.get('approval')})")
    ctx.shoot("t5-4-popover")

    # Replay arrival: back to self-serve, then the welcome line plays on Get started.
    axis(page, "Audience", "Self-serve")
    page.wait_for_timeout(600)
    action(page, "Replay arrival")
    try:
        page.wait_for_url(lambda u: "/get-started" in u, timeout=10000)
    except Exception:
        pass
    ctx.settle(1500)
    ctx.check(page.locator(".gs-welcome").count() == 1, "Replay arrival shows the welcome line again")
    ctx.shoot("t5-4-replay-arrival")


def hide(ctx, page):
    ctx.visit("/dashboard")
    ctx.check(page.locator(PILL).count() == 1, "pill shown before hiding")
    page.locator("body").click(position={"x": 5, "y": 400})
    page.keyboard.press("Control+Period")
    page.wait_for_timeout(500)
    ctx.check(page.locator(PILL).count() == 0, "Ctrl+. hides the pill")
    ctx.check(page.get_by_text("Prototype controls hidden").count() >= 1, "hide toast names the shortcut")
    page.reload(wait_until="domcontentloaded")
    ctx.settle(800)
    ctx.check(page.locator(PILL).count() == 0, "hidden survives reload (persisted)")
    page.keyboard.press("Control+Period")
    page.wait_for_timeout(500)
    ctx.check(page.locator(PILL).count() == 1, "Ctrl+. shows it again")

    # Hard loads (page.goto), in the shell and in the checkout frame; smoke fails on any console error.
    ctx.visit("/checkout/credits?controls=0")
    ctx.check(page.locator(PILL).count() == 0, "?controls=0 (hard load) hides the pill in checkout")
    ctx.visit("/dashboard?controls=0")
    ctx.check(page.locator(PILL).count() == 0, "?controls=0 (hard load) hides the pill")
    stored = page.evaluate("() => localStorage.getItem('parachute:proto:hidden')")
    ctx.check(stored in (None, "false"), f"?controls=0 does not persist ({stored!r})")
    ctx.visit("/dashboard")
    ctx.check(page.locator(PILL).count() == 1, "pill back on the next load without the param")


def legacy_aliases(ctx, page):
    for pid, routes in LEGACY.items():
        ctx.enter_persona(pid)
        path = page.url.split(ctx.base, 1)[-1].split("?")[0]
        ctx.check(path in routes, f"/demo/{pid} lands on {routes} (got {path})")
    ctx.enter_persona("trial-admin")


def stage_rows(page):
    return page.evaluate(
        """() => { const led = JSON.parse(localStorage.getItem('parachute:credit_ledger') || '[]').filter(r => r.orgId === 'org-hcb');
             const orgs = JSON.parse(localStorage.getItem('parachute:orgs') || '[]').filter(o => o.id === 'org-hcb');
             return { ids: led.map(r => r.id), orgs: orgs.length }; }"""
    )


def new_presets(ctx, page):
    """Fix round 1, item 1: a hard load of a non-legacy preset applies once (no doubled rows)."""
    ctx.page.goto(ctx.url("/demo/self-serve-low"), wait_until="domcontentloaded")
    try:
        page.wait_for_url(lambda u: "/demo/" not in u, timeout=30000)
    except Exception:
        ctx.check(False, "/demo/self-serve-low never left /demo/")
    ctx.settle(1500)
    rows = stage_rows(page)
    ctx.check(len(rows["ids"]) > 0 and len(rows["ids"]) == len(set(rows["ids"])), f"self-serve-low: ledger ids unique ({len(rows['ids'])} rows, {len(set(rows['ids']))} unique)")
    ctx.check(rows["orgs"] == 1, f"self-serve-low: one org-hcb row (got {rows['orgs']})")
    ctx.check(credits(page) == 3, f"self-serve-low: header pill shows 3 credits (got {credits(page)})")
    ctx.shoot("t5-4-preset-self-serve-low")

    # A Planned preset explains itself instead of applying.
    ctx.page.goto(ctx.url("/demo/suspended"), wait_until="domcontentloaded")
    ctx.settle(800)
    ctx.check("/demo/suspended" in page.url and page.get_by_text("is not built yet").count() == 1, "/demo/suspended explains Planned, applies nothing")
    ctx.check(stage_rows(page)["ids"] == rows["ids"], "/demo/suspended left the rows alone")


def kill_switch(ctx, page):
    base = os.environ.get("PROTO_KILL_BASE")
    if not base:
        print("    note: PROTO_KILL_BASE not set; kill-switch check skipped")
        return
    page.goto(base.rstrip("/") + "/demo/trial-admin", wait_until="domcontentloaded")
    try:
        page.wait_for_url(lambda u: "/demo/" not in u, timeout=60000)
    except Exception:
        pass
    ctx.settle(1500)
    ctx.check(page.locator(PILL).count() == 0, "NEXT_PUBLIC_PROTOTYPE_CONTROLS=0: no pill")
    page.keyboard.press("Control+Period")
    page.wait_for_timeout(400)
    ctx.check(page.locator(PILL).count() == 0, "NEXT_PUBLIC_PROTOTYPE_CONTROLS=0: shortcut does nothing")
    ctx.check(page.locator(".demo-dock").count() == 0, "no DemoDock either")


def run(page, ctx):
    page.set_default_timeout(10000)
    for route in ("/get-started", "/configure/billing", "/dashboard"):
        ctx.visit(route)
        pill_geometry(ctx, page, route)
        ctx.check(page.locator(".demo-dock").count() == 0, f"{route}: DemoDock is gone")
        if ctx.width < 900:
            ctx.check(page.locator(f"{PILL} .proto-select").is_visible(), f"{route}: narrow pill collapses to a select")
        ctx.shoot(f"t5-4-pill{route}")

    # The checkout frame mounts the pill too (outside the shell).
    ctx.visit("/checkout/credits")
    ctx.check(page.locator(PILL).count() == 1, "/checkout/credits: pill mounted in the checkout frame")

    if ctx.theme != "light" or ctx.width != 1440:
        return
    billing_states(ctx, page)
    custom(ctx, page)
    actions(ctx, page)
    hide(ctx, page)
    legacy_aliases(ctx, page)
    new_presets(ctx, page)
    kill_switch(ctx, page)
