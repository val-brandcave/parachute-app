"""T5.1 Tours (spec §5.13, PC-14 / PC-31 / PC-38).

first_review_tooltip_visible (RF1): trial-admin's own review (review-hcb-1, in_review, two
  types) on spoke `workbook`, motion off (webdriver). The chip "Take a 1-minute tour" sits
  in `.run-head` -> click -> the tour card is visible over the workbook: elementFromPoint at
  its centre lands inside the card (not `.run`), overlay z 126 / card z 128. The 4 steps
  anchor on the four wb-* targets (wb-cite, wb-decision, wb-viewmode, wb-sign); `.run-head`
  reads "Tour, 2 of 4" on step 2. Skip -> `tutorial` not completed. `?tour=first-review`
  starts it (and is stripped); openLock (dev hook `window.__parachuteLock`) mid-tour and a
  real pointer click on the spotlit Sign & finalize at step 4 both remove the card BEFORE
  the dialog root is added (DOM order recorded); neither completes tutorial. The sample
  review never runs it, not even via ?tour.
  `?tour=first-review` again -> all 4 steps -> Done -> `tutorial` completed; Get started
  shows the row done. No chip (and no deep-link start) on `confirm` / `progress`.
page_chips: header-slot chips on /reviews (only with rows), /configure/checklists,
  /configure/workbook-layouts, /configure/billing; every listed target exists (T5.3 adds the
  page targets: missing ones are reported, the rest asserted); nothing auto-starts; a
  removed target is skipped without an error; reduced motion = 120 ms card fade.
"""

import re

PERSONAS = ["trial-admin"]

SEEN_KEY = "parachute:tours-seen"
REVIEWS_KEY = "parachute:reviews"
SETUP_KEY = "parachute:setup_progress"
OWN = "review-hcb-1"
TIP = "[data-tour-tip]"
CHIP = ".tour-chip"

RUN_STEPS = [
    ("wb-cite", "Every figure, traced"),
    ("wb-decision", "Concur or reject"),
    ("wb-viewmode", "This is the workbook"),
    ("wb-sign", "Sign when it's right"),
]

# Mirrors lib/tours.ts page tours (route -> ordered targets).
PAGE_TOURS = {
    "/reviews": ["reviews-start", "reviews-tabs", "reviews-row-action"],
    "/configure/checklists": ["checklists-upload", "checklists-default"],
    "/configure/workbook-layouts": ["layouts-default", "layouts-open"],
    "/configure/billing": ["billing-balance", "billing-runway", "billing-usage", "billing-add"],
}

INTAKE = {
    "id": "review-t51-intake",
    "orgId": "org-hcb",
    "propertyAddress": "9 Tour Test Ave, Norfolk, VA",
    "propertyType": "Office (Suburban)",
    "bank": "Harbor Community Bank",
    "appraisalFirm": "Tidewater Valuation Group",
    "loanNo": "HCB-T51",
    "status": "intake",
    "reviewTypes": ["technical"],
    "assigneeId": "user-dr",
    "source": "manual",
    "riskRating": None,
    "openFindings": 0,
    "flaggedCount": 0,
    "worstSeverity": None,
    "pipelineStage": 0,
}


# ---------------------------------------------------------------- helpers


def clear_seen(page):
    page.evaluate("(k) => localStorage.removeItem(k)", SEEN_KEY)


def tutorial_done(page):
    return page.evaluate(
        """(k) => { const rows = JSON.parse(localStorage.getItem(k) || '[]');
             const r = rows.find(x => x.orgId === 'org-hcb' || x.id === 'org-hcb');
             return !!(r && r.completed && r.completed.tutorial); }""",
        SETUP_KEY,
    )


def tip_visible(page, timeout=6000):
    try:
        page.wait_for_selector(TIP, state="visible", timeout=timeout)
        page.wait_for_timeout(450)  # floating position + before-hook scroll
        return True
    except Exception:
        return False


def tip_gone(page, timeout=4000):
    try:
        page.wait_for_selector(TIP, state="detached", timeout=timeout)
        return True
    except Exception:
        return page.locator(TIP).count() == 0


def tip_title(page):
    loc = page.locator(".tour-tip-title")
    return loc.first.inner_text().strip() if loc.count() else None


def hit_test(page):
    """elementFromPoint at the card centre + the layer z-indexes."""
    return page.evaluate(
        """(sel) => { const t = document.querySelector(sel); if (!t) return { ok: false, why: 'no card' };
             const r = t.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
             const el = document.elementFromPoint(x, y);
             const fl = t.closest('.react-joyride__floater'); const ov = document.querySelector('.react-joyride__overlay');
             return { ok: !!el && t.contains(el), inRun: !!el && !!el.closest('.run'),
                      el: el ? el.tagName + '.' + (typeof el.className === 'string' ? el.className : '') : null,
                      zTip: fl ? getComputedStyle(fl).zIndex : null, zOverlay: ov ? getComputedStyle(ov).zIndex : null,
                      w: r.width, h: r.height }; }""",
        TIP,
    )


def anchor_gap(page, target):
    """Gap in px between the card's floater box and the target's rect (0 = touching/overlap)."""
    return page.evaluate(
        """(id) => { const fl = document.querySelector('.react-joyride__floater');
             const els = [...document.querySelectorAll(`[data-tour="${id}"]`)].filter(e => e.getClientRects().length);
             if (!fl || !els.length) return null;
             const f = fl.getBoundingClientRect(), t = els[0].getBoundingClientRect();
             return Math.round(Math.max(0, t.left - f.right, f.left - t.right, t.top - f.bottom, f.top - t.bottom)); }""",
        target,
    )


def head_text(page):
    return page.locator(".run-head").first.inner_text() if page.locator(".run-head").count() else ""


LOCK_SEL = '.lock-dlg[role="dialog"], .lock-dlg [role="dialog"], [role="dialog"]:has(.lock-body)'


def record_order(page):
    """Record, in DOM order, when the tour card leaves and when a dialog root arrives."""
    page.evaluate(
        """() => { window.__tourOrder = []; if (window.__tourMO) window.__tourMO.disconnect();
             const isTip = (n) => n.nodeType === 1 && (n.matches('[data-tour-tip], .react-joyride__floater') || !!n.querySelector('[data-tour-tip]'));
             const isDlg = (n) => n.nodeType === 1 && !n.closest('#react-joyride-portal') && !n.matches('.run') &&
               (n.matches('[role="dialog"], [role="alertdialog"]') || !!n.querySelector('[role="dialog"]:not(.run), [role="alertdialog"]'));
             window.__tourMO = new MutationObserver((rs) => { for (const r of rs) {
               for (const n of r.removedNodes) if (isTip(n)) window.__tourOrder.push('tip-removed');
               for (const n of r.addedNodes) if (isDlg(n)) window.__tourOrder.push('dialog-added'); } });
             window.__tourMO.observe(document.body, { childList: true, subtree: true }); }"""
    )


def stopped_first(order):
    return "tip-removed" in order and (
        "dialog-added" not in order or order.index("tip-removed") < order.index("dialog-added")
    )


def open_own_review(page, ctx, query=""):
    ctx.visit(f"/reviews/{OWN}{query}")
    try:
        page.wait_for_selector('.run [data-tour="wb-cite"]', timeout=20000)
    except Exception:
        pass
    ctx.settle(900)
    return ctx.check(page.locator('.run [data-tour="wb-cite"]').count() >= 1, f"own review lands on the workbook ({page.url})")


def click_next(page):
    page.locator(f"{TIP} button:has-text('Next'), {TIP} button:has-text('Done')").last.click()
    page.wait_for_timeout(700)


# ---------------------------------------------------------------- RF1


def first_review_tooltip_visible(page, ctx):
    clear_seen(page)
    if not open_own_review(page, ctx):
        ctx.shoot("t5-1-no-workbook")
        return
    ctx.check(not tutorial_done(page), "precondition: tutorial not done for Harbor")
    ctx.check(page.locator(TIP).count() == 0, "nothing auto-starts on a review without ?tour")
    chip = page.locator(f".run-head {CHIP}")
    if not ctx.check(chip.count() == 1 and chip.first.is_visible(), "chip in .run-head on the workbook spoke"):
        ctx.shoot("t5-1-no-chip")
        return
    ctx.check("Take a 1-minute tour" in chip.first.inner_text(), f"chip copy ({chip.first.inner_text()!r})")
    ctx.check(chip.locator("button[disabled]").count() == 0, "chip buttons are never disabled")
    ctx.shoot("t5-1-run-chip")

    chip.locator("button", has_text="Take a 1-minute tour").click()
    if not ctx.check(tip_visible(page), "chip starts the tour: card visible"):
        ctx.shoot("t5-1-no-tip")
        return
    hit = hit_test(page)
    ctx.check(hit["ok"] and not hit["inRun"], f"RF1: elementFromPoint(card centre) is inside the card, not .run ({hit})")
    ctx.check(hit["zTip"] == "128" and hit["zOverlay"] == "126", f"PC-31: card z 128, overlay z 126 ({hit['zTip']}/{hit['zOverlay']})")
    sel = page.evaluate("() => { const t = document.querySelector('.run-types [role=\"tab\"][aria-selected=\"true\"]'); return t ? t.textContent : null; }")
    ctx.check(sel is None or "Technical" in sel, f"tour runs on the Technical track ({sel!r})")
    ctx.check("Tour, 1 of 4" in head_text(page), f"'.run-head' reads 'Tour, 1 of 4' ({head_text(page)[:120]!r})")
    ctx.check(page.locator(f".run-head {CHIP}").count() == 0, "chip gives way to the status while touring")
    focus_in = page.evaluate("(s) => !!document.activeElement && !!document.activeElement.closest(s)", TIP)
    ctx.check(focus_in, "focus moves into the tour card (focusable over the aria-modal .run)")
    ctx.shoot("t5-1-step1-over-workbook")

    # Walk 1 -> 2, checking anchors.
    ctx.check(tip_title(page) == RUN_STEPS[0][1], f"step 1 title ({tip_title(page)!r})")
    g = anchor_gap(page, RUN_STEPS[0][0])
    ctx.check(g is not None and g <= 48, f"step 1 anchors on wb-cite (gap {g}px)")
    click_next(page)
    ctx.check(tip_title(page) == RUN_STEPS[1][1], f"step 2 title ({tip_title(page)!r})")
    g = anchor_gap(page, RUN_STEPS[1][0])
    ctx.check(g is not None and g <= 48, f"step 2 anchors on wb-decision (gap {g}px)")
    ctx.check("Tour, 2 of 4" in head_text(page), f"'.run-head' reads 'Tour, 2 of 4' ({head_text(page)[:120]!r})")
    ctx.shoot("t5-1-step2")

    # Skip: tutorial stays open.
    page.locator(TIP).get_by_role("button", name="Skip tour").last.click()
    ctx.check(tip_gone(page), "Skip tour closes the card")
    page.wait_for_timeout(600)
    ctx.check(not tutorial_done(page), "skipping does not complete tutorial")
    ctx.check(page.locator(".run").count() >= 1, "skipping leaves the review open")
    ctx.check(page.locator(f".run-head {CHIP}").count() == 0 and "Tour," not in head_text(page),
              "after the skip, no chip and no status in .run-head")

    # Deep link + LockDialog interruption (openLock via the dev hook).
    if not open_own_review(page, ctx, "?tour=first-review"):
        return
    ctx.check(tip_visible(page), "?tour=first-review starts the tour on the workbook")
    ctx.check("tour=" not in page.url, f"?tour param is stripped after starting ({page.url})")
    click_next(page)
    ctx.check("Tour, 2 of 4" in head_text(page), "deep-linked tour on step 2")
    record_order(page)
    opened = page.evaluate("() => typeof window.__parachuteLock === 'function' && window.__parachuteLock('approval')")
    ctx.check(opened, "dev hook window.__parachuteLock('approval') opens the lock dialog")
    try:
        page.wait_for_selector(LOCK_SEL, state="visible", timeout=6000)
    except Exception:
        pass
    page.wait_for_timeout(400)
    ctx.check(page.locator(LOCK_SEL).count() >= 1, "LockDialog is open over the review")
    ctx.check(page.locator(TIP).count() == 0 and page.locator(".react-joyride__overlay").count() == 0,
              "openLock mid-tour: the card and overlay are gone")
    order = page.evaluate("() => window.__tourOrder || []")
    ctx.check(stopped_first(order), f"openLock: the tour stops before the dialog is added ({order})")
    ctx.check(not tutorial_done(page), "an interrupted tour does not complete tutorial")
    ctx.shoot("t5-1-lock-interrupts")
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)

    # Deep link + a real pointer click on the spotlit Sign & finalize at step 4.
    if not open_own_review(page, ctx, "?tour=first-review"):
        return
    ctx.check(tip_visible(page), "?tour=first-review starts the tour (Sign run)")
    for _ in range(3):
        click_next(page)
    ctx.check("Tour, 4 of 4" in head_text(page), f"on step 4 ({head_text(page)[:80]!r})")
    record_order(page)
    page.locator('[data-tour="wb-sign"]').first.click()  # pointer click through the spotlight
    try:
        page.wait_for_selector('[role="dialog"]:not(.run):not([data-tour-tip])', state="visible", timeout=6000)
    except Exception:
        pass
    page.wait_for_timeout(300)
    sign_open = page.evaluate(
        "() => [...document.querySelectorAll('[role=\"dialog\"]')].some(d => !d.classList.contains('run') && !d.hasAttribute('data-tour-tip') && d.getClientRects().length)"
    )
    ctx.check(sign_open, "clicking the spotlit Sign & finalize opens the Sign modal")
    ctx.check(page.locator(TIP).count() == 0 and page.locator(".react-joyride__overlay").count() == 0,
              "the Sign modal opens with no tour card or overlay")
    order = page.evaluate("() => window.__tourOrder || []")
    ctx.check(stopped_first(order), f"Sign: the tour stops before the Sign modal is added ({order})")
    ctx.check("Tour," not in head_text(page), "status cleared when the Sign modal opens")
    ctx.check(not tutorial_done(page), "an interrupted tour (even on step 4) does not complete tutorial")
    ctx.shoot("t5-1-sign-interrupts")
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)

    # Deep link again: finish all 4 -> tutorial done.
    if not open_own_review(page, ctx, "?tour=first-review"):
        return
    ctx.check(tip_visible(page), "?tour=first-review starts the tour again")
    for i, (target, title) in enumerate(RUN_STEPS):
        ctx.check(tip_title(page) == title, f"step {i + 1} title {title!r} ({tip_title(page)!r})")
        g = anchor_gap(page, target)
        ctx.check(g is not None and g <= 48, f"step {i + 1} anchors on {target} (gap {g}px)")
        hit = hit_test(page)
        ctx.check(hit["ok"] and not hit["inRun"], f"step {i + 1}: card is topmost at its centre ({hit['el']})")
        ctx.check(f"Tour, {i + 1} of 4" in head_text(page), f"status 'Tour, {i + 1} of 4'")
        if i == 3:
            ctx.shoot("t5-1-step4-sign")
        click_next(page)
    ctx.check(tip_gone(page), "Done closes the tour")
    page.wait_for_timeout(800)
    ctx.check(tutorial_done(page), "finishing first-review completes tutorial")
    ctx.visit("/get-started")
    row = page.locator(".gs-row", has_text=re.compile(r"2-minute tour|Tour taken|Take the tour"))
    ctx.check(row.count() >= 1 and "is-done" in (row.first.get_attribute("class") or ""),
              "Get started shows the tutorial row done")
    ctx.shoot("t5-1-get-started-tutorial-done", full_page=True)


def no_chip_on_confirm_progress(page, ctx):
    clear_seen(page)
    page.evaluate(
        """([k, row]) => { const now = Date.now(); const rows = JSON.parse(localStorage.getItem(k) || '[]');
             if (!rows.some(r => r.id === row.id)) rows.push({ ...row, slaDueAt: now + 5 * 864e5,
               orderedAt: now - 864e5, createdAt: now - 864e5, updatedAt: now - 864e5 });
             localStorage.setItem(k, JSON.stringify(rows)); }""",
        [REVIEWS_KEY, INTAKE],
    )
    ctx.visit(f"/reviews/{INTAKE['id']}?tour=first-review")
    try:
        page.wait_for_selector(".run .run-cf", timeout=15000)
    except Exception:
        pass
    ctx.settle(900)
    if not ctx.check(page.locator(".run .run-cf").count() == 1, "intake review opens on Review setup (confirm)"):
        return
    ctx.check(page.locator(f".run-head {CHIP}").count() == 0, "no chip on confirm")
    ctx.check(page.locator(TIP).count() == 0, "?tour=first-review does not start on confirm")
    ctx.shoot("t5-1-confirm-no-chip")
    page.locator(".run-cf-footbar button:has-text('Start review')").first.click(force=True)
    seen_chip = False
    for _ in range(12):
        if page.locator(".run-cf").count() == 0 and page.locator('[data-tour="wb-cite"]').count() == 0:
            seen_chip = seen_chip or page.locator(f".run-head {CHIP}").count() > 0
        page.wait_for_timeout(150)
    ctx.check(not seen_chip, "no chip during progress")

    # The sample review never runs the review tour, not even from ?tour (would tick tutorial).
    clear_seen(page)
    ctx.visit("/reviews/review-sample?tour=first-review")
    try:
        page.wait_for_selector('.run [data-tour="wb-cite"]', timeout=15000)
    except Exception:
        pass
    ctx.settle(1500)
    ctx.check(page.locator(TIP).count() == 0, "?tour=first-review does not start on the sample review")
    ctx.check(page.locator(f".run-head {CHIP}").count() == 0, "no chip on the sample review")
    ctx.check(page.locator(TIP).count() == 0, "nothing auto-starts after progress")


# ---------------------------------------------------------------- page chips


def targets_present(page, ids):
    return page.evaluate(
        "(ids) => ids.map(id => [...document.querySelectorAll(`[data-tour=\"${id}\"]`)].some(e => e.getClientRects().length))",
        ids,
    )


def start_chip(page, chip):
    """A real pointer click (T5.4 moved the prototype pill out of the header band)."""
    chip.locator("button", has_text="Take a 1-minute tour").first.click()


def walk(page, max_steps=6):
    titles = []
    for _ in range(max_steps):
        if not tip_visible(page, timeout=3000):
            break
        titles.append(tip_title(page))
        click_next(page)
    return titles


def page_chips(page, ctx, missing_report):
    for route, ids in PAGE_TOURS.items():
        clear_seen(page)
        ctx.visit(route)
        page.wait_for_timeout(800)
        present = targets_present(page, ids)
        for tid, ok in zip(ids, present):
            if not ok:
                missing_report.add(f"{route}: [data-tour={tid}]")
        ctx.check(page.locator(TIP).count() == 0, f"{route}: nothing auto-starts")
        chip = page.locator(f".tour-slot {CHIP}")
        eligible = present[0] and sum(present) * 2 >= len(present)
        if eligible:
            if not ctx.check(chip.count() == 1 and chip.first.is_visible(), f"{route}: header chip shows (targets {present})"):
                ctx.shoot(f"t5-1-nochip{route}")
                continue
            ctx.shoot(f"t5-1-chip{route}")
            start_chip(page, chip)
            titles = walk(page)
            ctx.check(len(titles) == sum(present), f"{route}: one card per present target ({titles})")
            ctx.check(page.locator(TIP).count() == 0, f"{route}: tour ends after the last card")
            ctx.visit(route)
            page.wait_for_timeout(800)
            ctx.check(page.locator(f".tour-slot {CHIP}").count() == 0, f"{route}: second visit shows no chip")
        else:
            ctx.check(chip.count() == 0, f"{route}: no chip while its targets are missing ({present})")


def reviews_only_with_rows(page, ctx):
    snap = page.evaluate("(k) => localStorage.getItem(k)", REVIEWS_KEY)
    page.evaluate(
        "(k) => { const rows = JSON.parse(localStorage.getItem(k) || '[]'); localStorage.setItem(k, JSON.stringify(rows.filter(r => r.orgId !== 'org-hcb' || r.sample))); }",
        REVIEWS_KEY,
    )
    clear_seen(page)
    ctx.visit("/reviews")
    page.wait_for_timeout(900)
    ctx.check(page.locator(f".tour-slot {CHIP}").count() == 0, "/reviews: no chip on the empty queue")
    ctx.shoot("t5-1-reviews-empty-no-chip")
    page.evaluate("([k, v]) => localStorage.setItem(k, v)", [REVIEWS_KEY, snap])


def removed_target_skipped(page, ctx):
    # The richest page tour whose targets are all present: drop step 2's target, then walk.
    for route, ids in sorted(PAGE_TOURS.items(), key=lambda kv: -len(kv[1])):
        clear_seen(page)
        ctx.visit(route)
        page.wait_for_timeout(800)
        present = targets_present(page, ids)
        if len(ids) < 3 or not all(present):
            continue
        before = len(ctx.errors)
        page.evaluate("(id) => document.querySelectorAll(`[data-tour=\"${id}\"]`).forEach(e => e.removeAttribute('data-tour'))", ids[1])
        page.wait_for_timeout(300)
        chip = page.locator(f".tour-slot {CHIP}")
        if not ctx.check(chip.count() == 1, f"{route}: chip still offered with one target removed"):
            return
        start_chip(page, chip)
        titles = walk(page)
        ctx.check(len(titles) == len(ids) - 1, f"{route}: removed target skipped ({titles})")
        ctx.check(len(ctx.errors) == before, f"{route}: no error while skipping ({ctx.errors[before:]})")
        return
    print("    note: no page tour with 3+ targets all present yet; removed-target check ran on the run tour only")
    # Fallback: the run tour (always has its targets): remove wb-viewmode, walk.
    clear_seen(page)
    if not open_own_review(page, ctx):
        return
    before = len(ctx.errors)
    page.evaluate("() => document.querySelectorAll('[data-tour=\"wb-viewmode\"]').forEach(e => e.removeAttribute('data-tour'))")
    page.locator(f".run-head {CHIP} button", has_text="Take a 1-minute tour").click()
    titles = walk(page)
    ctx.check(len(titles) == 3 and "This is the workbook" not in titles, f"run tour: removed target skipped ({titles})")
    ctx.check(len(ctx.errors) == before, f"run tour: no error while skipping ({ctx.errors[before:]})")


def reduced_motion(page, ctx):
    page.emulate_media(reduced_motion="reduce")
    clear_seen(page)
    if not open_own_review(page, ctx, "?motion=1&tour=first-review"):
        return
    if not ctx.check(tip_visible(page), "reduced motion: tour starts"):
        return
    tr = page.evaluate("() => { const f = document.querySelector('.react-joyride__floater'); return f ? getComputedStyle(f).transitionDuration : null; }")
    ctx.check(tr in ("0.12s", "0s"), f"reduced motion: card fades in 120 ms, no travel ({tr})")
    page.keyboard.press("Escape")
    ctx.check(tip_gone(page), "Esc skips the tour")
    page.wait_for_timeout(800)
    ctx.check(page.locator(".run").count() >= 1, "Esc on the tour leaves the review open")
    page.emulate_media(reduced_motion="no-preference")


def run(page, ctx):
    if ctx.width < 1000:
        return  # desktop-first takeover and header slot
    first_review_tooltip_visible(page, ctx)
    no_chip_on_confirm_progress(page, ctx)
    missing = set()
    reviews_only_with_rows(page, ctx)
    page_chips(page, ctx, missing)
    removed_target_skipped(page, ctx)
    reduced_motion(page, ctx)
    if missing:
        print("    note: page targets not in yet (T5.3): " + ", ".join(sorted(missing)))
