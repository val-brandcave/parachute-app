"""T2.1 Get started v4 (spec §5.2): one column, the exact navy primaries per section per
persona, every row button visible at rest, earn pill copy, progress line, pending tracker,
locked clicks reaching the lock store, reviewer "Ask Dana", welcome-line gating, bonus
ending / closed and invoiced states, the all-done card (scenario popover "Complete next step")
and the section burst (?motion=1, light/1440 only)."""

import re

PERSONAS = ["trial-admin", "pending-admin", "reviewer", "approver"]
ROUTE = "/get-started"

# Navy primaries per section [first_review, own_rules, team], by persona seed:
#  trial-admin   Harbor 2/8: Start tour · Upload policy · Send to IT
#  pending-admin Lakeside 0/8: first section held (no primary) · Upload guidelines · Invite
#  reviewer      Harbor as Marcus: Start tour · own_rules all "Ask Dana" · team "Ask Dana"
#  approver      Cedar 5/8, no own review: tour locked ("Run a review first") · "Ask Carla" · team folded (done)
EXPECTED_PRIMARIES = {
    "trial-admin": [1, 1, 1],
    "pending-admin": [0, 1, 1],
    "reviewer": [1, 0, 0],
    "approver": [0, 0, 0],
}
LEDGER = "parachute:credit_ledger"
ORGS = "parachute:orgs"
ARRIVAL = "parachute:arrival"
DAY_MS = 86_400_000


def norm(s):
    return " ".join((s or "").split())


def land(page, ctx, route=ROUTE):
    ctx.visit(route)
    try:
        page.wait_for_selector("h1", timeout=15000)
    except Exception:
        ctx.check(False, "h1 rendered")
    ctx.settle(600)


def primaries(page):
    return page.evaluate(
        "() => [...document.querySelectorAll('.gs-sec')].map(s => s.querySelectorAll('.ui-btn--primary').length)"
    )


def lock_kind(page):
    """Dev-only probe (home/useLockProbe.ts): the lock store's current reason kind."""
    return page.evaluate("() => document.documentElement.dataset.lockKind || null")


def snapshot(page):
    return page.evaluate("([l, o]) => ({ l: localStorage.getItem(l), o: localStorage.getItem(o) })", [LEDGER, ORGS])


def restore(page, snap):
    page.evaluate(
        "([l, o, s]) => { localStorage.setItem(l, s.l); localStorage.setItem(o, s.o); }", [LEDGER, ORGS, snap]
    )


def set_grant_age(page, days):
    """Move Harbor's trial grant (the earn window's start) `days` into the past."""
    page.evaluate(
        """([key, d, dayMs]) => { const rows = JSON.parse(localStorage.getItem(key));
             rows.forEach(r => { if (r.orgId === 'org-hcb' && r.kind === 'trial_grant') r.createdAt = Date.now() - d * dayMs; });
             localStorage.setItem(key, JSON.stringify(rows)); }""",
        [LEDGER, days, DAY_MS],
    )


def make_invoiced(page):
    """Harbor as an invoiced enterprise org that came through sales (still setup-eligible)."""
    page.evaluate(
        """(key) => { const rows = JSON.parse(localStorage.getItem(key));
             rows.forEach(o => { if (o.id === 'org-hcb') { o.billing = 'invoiced'; o.profile = { ...o.profile, salesRequested: true }; } });
             localStorage.setItem(key, JSON.stringify(rows)); }""",
        ORGS,
    )


def mark_arrival(page, path):
    """The same one-shot mark the onboarding interstitial writes (lib/motion markArrival)."""
    page.evaluate(
        "([key, p]) => sessionStorage.setItem(key, JSON.stringify({ path: p, at: Date.now() }))", [ARRIVAL, path]
    )


def common(page, ctx):
    p = ctx.persona
    ctx.check(page.locator(".home-grid").count() == 0, f"{p}: no .home-grid (one column)")
    ctx.check(page.locator(".gs-page .card.gs-sec").count() == 3, f"{p}: 3 sections")
    ctx.check(
        page.evaluate("() => document.activeElement && document.activeElement.tagName === 'H1'"),
        f"{p}: focus on h1 after load",
    )
    ctx.check(page.locator(".tabler-icon-coins").count() == 0, f"{p}: no coins icon")
    body = page.inner_text("body")
    ctx.check(re.search(r"sample", body, re.I) is None, f"{p}: no 'sample' text on the page")
    ctx.check(
        page.locator(".gs-page button[disabled], .gs-page a[disabled]").count() == 0, f"{p}: no disabled buttons in the page"
    )
    # Every row button shows at rest (no hover): computed opacity 1 up the tree, visible box.
    hidden = page.evaluate(
        """() => [...document.querySelectorAll('.gs-row .ui-btn')].filter(b => {
             const r = b.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return true;
             for (let el = b; el && el !== document.body; el = el.parentElement) {
               const cs = getComputedStyle(el);
               if (parseFloat(cs.opacity) < 1 || cs.visibility === 'hidden') return true;
             }
             return false; }).length"""
    )
    ctx.check(hidden == 0, f"{p}: every row button visible at rest ({hidden} hidden)")
    per = primaries(page)
    want = EXPECTED_PRIMARIES[p]
    ctx.check(per == want, f"{p}: primaries per section {per}, expected {want}")


def welcome_cases(page, ctx):
    """Welcome line gating (motion-spec §6.4)."""
    ctx.check(page.locator(".gs-welcome").count() == 0, "no welcome line without an arrival")
    mark_arrival(page, "self_serve")
    land(page, ctx)
    line = page.locator(".gs-welcome")
    ctx.check(
        line.count() == 1 and norm(line.inner_text()) == "You're in. 6 trial credits are ready.",
        "self-serve arrival shows the welcome line",
    )
    ctx.shoot("t2-1-welcome")
    land(page, ctx)
    ctx.check(page.locator(".gs-welcome").count() == 0, "reload hides the welcome line")
    mark_arrival(page, "enterprise")
    land(page, ctx)
    ctx.check(page.locator(".gs-welcome").count() == 0, "enterprise arrival shows no welcome line")
    mark_arrival(page, "self_serve")
    land(page, ctx)
    page.get_by_role("button", name="Dismiss").click()
    page.wait_for_timeout(500)
    ctx.check(page.locator(".gs-welcome").count() == 0, "Dismiss hides the welcome line")
    mark_arrival(page, "self_serve")
    land(page, ctx)
    ctx.check(page.locator(".gs-welcome").count() == 0, "dismissal persists across a later arrival")


def window_cases(page, ctx):
    """Bonus ending / closed and invoiced, by editing the mock store (restored after)."""
    snap = snapshot(page)
    set_grant_age(page, 12.5)
    land(page, ctx)
    meta = page.locator(".gs-hero-meta")
    text = norm(meta.inner_text())
    ctx.check(text == "2 of 8 done · 2 days left to earn", f"bonus ending line (got {text!r})")
    ctx.check("is-ending" in (meta.get_attribute("class") or ""), "bonus ending line turns amber")
    ctx.check(page.locator(".gs-earn").count() == 2, "bonus ending keeps the earn pills")

    set_grant_age(page, 20)
    land(page, ctx)
    text = norm(page.locator(".gs-hero-meta").inner_text())
    ctx.check(text == "2 of 8 done · Bonus window closed", f"bonus closed line (got {text!r})")
    ctx.check(page.locator(".gs-earn").count() == 0, "bonus closed hides earn pills on unpaid sections")
    ctx.check(primaries(page) == [1, 1, 1], "bonus closed: rows stay actionable")
    ctx.shoot("t2-1-bonus-closed")

    restore(page, snap)
    make_invoiced(page)
    land(page, ctx)
    ctx.check(page.locator(".gs-sec").count() == 3, "invoiced enterprise org still sees Get started")
    ctx.check(page.locator(".gs-earn").count() == 0, "invoiced: earn pills hidden")
    h1 = norm(page.locator("h1").inner_text())
    ctx.check(h1 == "Finish setting up Harbor.", f"invoiced headline (got {h1!r})")
    ctx.shoot("t2-1-invoiced")

    restore(page, snap)
    land(page, ctx)
    ctx.check(page.locator(".gs-earn").count() == 2, "restored: earn pills back")


def run(page, ctx):
    p = ctx.persona
    land(page, ctx)
    common(page, ctx)
    full = ctx.theme == "light" and ctx.width == 1440

    if p == "trial-admin":
        pill = norm(page.locator(".gs-earn").first.inner_text())
        ctx.check(pill == "Earn 1 free review · 2 credits", f"earn pill text (got {pill!r})")
        ctx.check(page.locator(".gs-earn").count() == 2, "earn pills on both reward sections")
        meta = norm(page.locator(".gs-hero-meta").inner_text())
        ctx.check(meta == "2 of 8 done · 12 days left to earn", f"progress line (got {meta!r})")
        h1 = norm(page.locator("h1").inner_text())
        ctx.check(h1 == "Your trial includes 3 full reviews. Earn 2 more in your first 14 days.", f"headline (got {h1!r})")
        ctx.check(page.get_by_text("220 Commerce Way").count() >= 1, "done first_review row shows the own review address")
        ctx.check(
            page.locator('.gs-row a[href^="/reviews/review-hcb"]').count() >= 2,
            "Open review / Start tour / Sign derive the own review",
        )
        ctx.check(page.locator('a[href*="review-sample"]').count() == 0, "nothing links the walkthrough review")
        ctx.check(page.get_by_text("Recommended", exact=True).count() == 1, "team section 'Recommended'")
        ctx.check(page.locator(".gs-res-card").count() == 3, "three resource cards")
        ctx.shoot("t2-1-mid", full_page=True)

        if ctx.width == 1440:
            welcome_cases(page, ctx)
            window_cases(page, ctx)

        # All done via the scenario popover; the section burst checked with motion on (light/1440).
        if full:
            land(page, ctx, ROUTE + "?motion=1")
        page.evaluate(
            """() => { window.__bursts = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
                 if (n.tagName === 'CANVAS') window.__bursts++; }))).observe(document.body, { childList: true }); }"""
        )
        page.get_by_role("button", name="Scenario", exact=True).click()
        nxt = page.get_by_role("button", name="Complete next step")
        for i in range(6):
            nxt.click()
            page.wait_for_timeout(700)
            if i == 1:
                ctx.check(
                    page.get_by_text("1 free review earned · 2 credits added").count() >= 1,
                    "section toast after first_review section",
                )
                earned = page.locator(".gs-earn.is-earned")
                ctx.check(
                    earned.count() >= 1 and norm(earned.first.inner_text()) == "1 free review earned",
                    "pill flips to '1 free review earned'",
                )
                ctx.shoot("t2-1-earned")
        page.wait_for_timeout(1200)
        if full:
            bursts = page.evaluate("() => window.__bursts")
            ctx.check(bursts == 2, f"one burst per earned section (got {bursts})")
        ctx.check(page.get_by_text("All 8 done").count() == 1, "'All 8 done' card")
        ctx.check(page.locator(".gs-alldone svg.ill").count() == 1, "all-done spot illustration (08b)")
        ctx.check(page.locator(".gs-alldone .ui-btn--primary").count() == 1, "Go to Dashboard is the one primary")
        h1 = norm(page.locator("h1").inner_text())
        ctx.check(h1 == "You earned 2 free reviews. Harbor is set up.", f"all-done title (got {h1!r})")
        ctx.check(page.locator(".gs-folded-row").count() == 3, "three folded section summaries")
        ctx.shoot("t2-1-all-done", full_page=True)

    elif p == "pending-admin":
        ctx.check(page.locator(".gs-pending .gs-track-step").count() == 3, "tracker with 3 steps")
        first = page.locator(".gs-sec").nth(0)
        ctx.check(first.get_by_text("Unlocks after your call").count() == 1, "first section reads 'Unlocks after your call'")
        rows = first.locator(".gs-row")
        locked = first.locator('.gs-row .ui-btn[aria-disabled="true"] .tabler-icon-hourglass-high')
        ctx.check(
            rows.count() == 3 and locked.count() == 3,
            f"first section rows carry an hourglass ({locked.count()}/{rows.count()})",
        )
        ctx.check(
            first.get_by_text("until Lakeside is confirmed", exact=False).count() == 1,
            "held sub names the org",
        )
        meta = norm(page.locator(".gs-hero-meta").inner_text())
        ctx.check(
            re.match(r"^\d of 8 done · your 14 days to earn start when Lakeside is confirmed$", meta),
            f"pending progress line (got {meta!r})",
        )
        ctx.check(page.locator(".gs-earn").count() == 1, "own-rules earn pill still shown while pending")
        ctx.check(lock_kind(page) is None, "no lock open before the click")
        # aria-disabled: Playwright treats it as not enabled, so force the click.
        first.locator(".gs-row .ui-btn").first.click(force=True)
        page.wait_for_timeout(300)
        ctx.check(page.url.endswith(ROUTE), "locked row click stays put")
        kind = lock_kind(page)
        ctx.check(kind == "approval", f"locked click opens the lock with an approval reason (got {kind!r})")
        desc = page.evaluate(
            """() => { const b = document.querySelector('.gs-sec .gs-row .ui-btn[aria-disabled=true]');
                 const d = b && document.getElementById(b.getAttribute('aria-describedby')); return d ? d.textContent : null; }"""
        )
        ctx.check(desc == "Opens when Lakeside Valuation is confirmed", f"locked button describes its reason (got {desc!r})")
        ctx.shoot("t2-1-pending", full_page=True)

    elif p == "reviewer":
        asks = page.locator(".gs-row .ui-btn", has_text="Ask Dana")
        ctx.check(asks.count() == 4, f"admin-only open rows show 'Ask Dana' ({asks.count()})")
        asks.first.click()
        page.wait_for_timeout(500)
        ctx.check(page.get_by_text("Dana gets your note").count() >= 1, "Ask toast 'Dana gets your note'")
        ctx.shoot("t2-1-reviewer", full_page=True)

    elif p == "approver":
        asks = page.locator(".gs-row .ui-btn", has_text=re.compile(r"^Ask "))
        ctx.check(asks.count() == 2, f"approver: open admin-only rows ask the admin ({asks.count()})")
        meta = norm(page.locator(".gs-hero-meta").inner_text())
        ctx.check(meta == "5 of 8 done", f"approver progress line (got {meta!r})")
        ctx.check(page.locator(".gs-earn").count() == 0, "approver (no trial grant): earn pills hidden")
        page.locator(".gs-row .ui-btn", has_text="Start tour").click(force=True)
        page.wait_for_timeout(300)
        kind = lock_kind(page)
        ctx.check(kind == "needs-review", f"tour with no own review opens the needs-review lock (got {kind!r})")
        dlg = page.locator(".lock-dlg")
        dlg_text = norm(dlg.inner_text()) if dlg.count() else ""
        ctx.check("Run a review first" in dlg_text, f"needs-review dialog reads 'Run a review first' (got {dlg_text[:80]!r})")
        ctx.check("Only admins can buy credits" not in dlg_text, "needs-review dialog is not the buy-credits role lock")
        ctx.check(
            dlg.get_by_role("button", name="Upload appraisal").count() == 1 and dlg.get_by_role("button", name="Close").count() >= 1,
            "needs-review dialog offers Upload appraisal + Close",
        )
        ctx.shoot("t2-1-approver", full_page=True)
