"""T4.1 lock dialog variants (spec §5.5, §5.9, PC-31).

Drives `useLockStore` through the dev-only `?lock=<kind>` hook on /dashboard (inside
LockDialog) and, for focus checks, `window.__parachuteLock(kind)` after focusing a
real control (so the store records it as the opener).

Personas (data/seed/demo-personas.seed.ts): trial-admin (Dana, Harbor Community Bank,
org_admin) for the approval and credits variants; reviewer (Marcus, same org) for the
reviewer approval variant, the role variant and the credit request.

Checks per variant: title, copy, options and actions match the §5.5 table; a 96–104 px
spot (no panel); the dialog is on top (elementFromPoint at its centre is inside it);
no button[disabled]. Short "Add 1 credit" → checkout credits=1; zero "Continue to
checkout" → pack=pack10; reviewer ask → "Requested · Dana will be notified" + spot 15 +
a stored request that survives reload ("You already asked Dana", no second ask);
role → "Only admins can buy credits"; focus returns to the opener; Esc closes only
the dialog.
"""

import re

PERSONAS = ["trial-admin", "reviewer"]

DLG = "[role=dialog].lock-dlg"


def open_lock(page, ctx, kind):
    ctx.visit(f"/dashboard?lock={kind}")
    page.wait_for_selector(f"{DLG} .lock-title", timeout=15000)
    page.wait_for_timeout(400)


def title(page):
    return page.locator(f"{DLG} .lock-title").first.inner_text().strip()


def copy_text(page):
    return " ".join(t.strip() for t in page.locator(f"{DLG} .lock-copy").all_inner_texts())


def actions(page):
    return [t.strip() for t in page.locator(f"{DLG} .lock-acts button, {DLG} .lock-acts a").all_inner_texts()]


def common(page, ctx, where, spot):
    art = page.locator(f"{DLG} .lock-art[data-spot='{spot}'] svg.ill")
    ctx.check(art.count() == 1, f"{where}: spot {spot}")
    if art.count():
        w = art.first.evaluate("e => Math.round(e.getBoundingClientRect().width)")
        ctx.check(96 <= w <= 104, f"{where}: spot is 96–104 px ({w})")
        ctx.check("ill--panel" not in (art.first.get_attribute("class") or ""), f"{where}: spot panel off")
    n = page.locator(f"{DLG} button[disabled]").count()
    ctx.check(n == 0, f"{where}: no button[disabled] (found {n})")
    on_top = page.evaluate(
        """(sel) => { const d = document.querySelector(sel); if (!d) return false;
           const r = d.getBoundingClientRect();
           const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
           return !!hit && d.contains(hit); }""",
        DLG,
    )
    ctx.check(on_top, f"{where}: elementFromPoint at the centre is inside the dialog")
    z = page.evaluate("(sel) => getComputedStyle(document.querySelector(sel)).zIndex", DLG)
    ctx.check(z == "140", f"{where}: dialog at --rw-z-modal 140 (z {z})")


def closed(page):
    page.wait_for_timeout(500)
    return page.locator(DLG).count() == 0


def click_action(page, label):
    page.locator(f"{DLG} .lock-acts").get_by_role("button", name=label, exact=True).click()


# ---------------------------------------------------------------- admin (Dana)
def admin_run(page, ctx):
    # Approval, booked
    open_lock(page, ctx, "approval")
    t = title(page)
    ctx.check(t == "Credits open when Harbor is confirmed", f"approval title ({t!r})")
    c = copy_text(page)
    ctx.check("Teams your size start with a short call. You booked one for" in c and " ET. After it, Realwired sets up your billing" in c, f"approval copy ({c[:120]!r})")
    ctx.check(page.locator(f"{DLG} .gs-track.gs-track--compact").count() == 1, "approval: compact PendingTracker")
    labels = [x.strip() for x in page.locator(f"{DLG} .gs-track-label").all_inner_texts()]
    ctx.check(len(labels) == 3 and labels[0].startswith("Signed up") and labels[1].startswith("Call booked"), f"tracker steps {labels}")
    a = actions(page)
    ctx.check(a == ["Change call", "Got it"], f"approval actions {a}")
    common(page, ctx, "approval", "09b-approval-pending")
    ctx.shoot("t4-1-approval")
    click_action(page, "Got it")
    ctx.check(closed(page), "approval: Got it closes")

    # Approval, not booked
    open_lock(page, ctx, "approval-unbooked")
    t = title(page)
    ctx.check(t == "Book Harbor's setup call to open credits", f"unbooked title ({t!r})")
    a = actions(page)
    ctx.check(a == ["Not now", "Book a call"], f"unbooked actions {a}")
    common(page, ctx, "approval-unbooked", "09b-approval-pending")
    ctx.shoot("t4-1-approval-unbooked")
    click_action(page, "Book a call")
    page.wait_for_url(re.compile(r"/welcome/call"), timeout=15000)
    ctx.check("/welcome/call" in page.url, f"Book a call → /welcome/call ({page.url})")

    # Credits short
    open_lock(page, ctx, "credits-short")
    t = title(page)
    ctx.check(t == "You need 1 more credit", f"short title ({t!r})")
    c = copy_text(page)
    ctx.check("Technical and Administrative together use 2 credits. Harbor Community Bank has 1." in c, f"short copy ({c!r})")
    opts = page.locator(f"{DLG} .lock-opts label")
    ctx.check(opts.count() == 2, f"short: two options ({opts.count()})")
    ctx.check(opts.nth(0).locator("text=Add 1 credit and run the full review").count() == 1 and "$150" in opts.nth(0).inner_text(), "short option 1: add 1 credit · $150")
    ctx.check("Run Technical only" in opts.nth(1).inner_text() and "Uses your 1 credit now." in opts.nth(1).inner_text(), "short option 2: run Technical only")
    ctx.check(page.locator(f"{DLG} .lock-note", has_text="Turn on auto-reload").count() == 1, "short: auto-reload note")
    a = actions(page)
    ctx.check(a == ["Back", "Run Technical only (1 credit)", "Add 1 credit"], f"short actions {a}")
    add_btn = page.locator(f"{DLG} .lock-acts").get_by_role("button", name="Add 1 credit", exact=True)
    ctx.check("ui-btn--primary" in (add_btn.get_attribute("class") or ""), "short: Add 1 credit is primary by default")
    common(page, ctx, "credits-short", "10b-locked-feature")
    ctx.shoot("t4-1-credits-short")
    opts.nth(1).click()
    page.wait_for_timeout(200)
    run_btn = page.locator(f"{DLG} .lock-acts").get_by_role("button", name="Run Technical only (1 credit)", exact=True)
    ctx.check("ui-btn--primary" in (run_btn.get_attribute("class") or ""), "short: picking Run Technical only makes it primary")
    page.evaluate("() => { window.__lockRunOnlyCalls = 0; }")
    run_btn.dblclick()
    ctx.check(closed(page), "short: Run Technical only closes the dialog")
    calls = page.evaluate("() => window.__lockRunOnlyCalls")
    ctx.check(calls == 1, f"short: double-click Run Technical only calls onRunOnly exactly once ({calls})")
    ctx.check(page.locator("text=Technical review would start now").count() >= 1, "short: onRunOnly(technical) called")

    open_lock(page, ctx, "credits-short")
    hist0 = page.evaluate("() => history.length")
    page.locator(f"{DLG} .lock-acts").get_by_role("button", name="Add 1 credit", exact=True).dblclick()
    page.wait_for_url(re.compile(r"/checkout/credits"), timeout=15000)
    page.wait_for_timeout(800)
    hist1 = page.evaluate("() => history.length")
    ctx.check(hist1 - hist0 == 1, f"short: double-click Add 1 credit navigates once (history +{hist1 - hist0})")
    ctx.check(re.search(r"/checkout/credits\?credits=1&return=%2Fdashboard&types=technical%2Cadministrative$", page.url) is not None, f"Add 1 credit → checkout credits=1 ({page.url})")

    # Credits zero
    open_lock(page, ctx, "credits-zero")
    t = title(page)
    ctx.check(t == "You're out of credits", f"zero title ({t!r})")
    c = copy_text(page)
    ctx.check("This review uses 2 credits. Harbor Community Bank has 0." in c, f"zero copy ({c[:90]!r})")
    ctx.check("Your report stays uploaded. It starts as soon as the payment goes through." in c, "zero: report stays uploaded")
    ctx.check(page.locator(f"{DLG} button", has_text="How credits work").count() == 1, "zero: How credits work link")
    opts = page.locator(f"{DLG} .lock-opts label")
    o1 = opts.nth(0).inner_text() if opts.count() > 0 else ""
    o2 = opts.nth(1).inner_text() if opts.count() > 1 else ""
    ctx.check("10 credits · 5 full reviews" in o1 and "$140 a credit" in o1 and "$1,400" in o1, f"zero option 1 ({o1!r})")
    ctx.check("2 credits · Just this review" in o2 and "$150 a credit" in o2 and "$300" in o2, f"zero option 2 ({o2!r})")
    a = actions(page)
    ctx.check(a == ["Not now", "Continue to checkout"], f"zero actions {a}")
    common(page, ctx, "credits-zero", "01b-credits")
    ctx.shoot("t4-1-credits-zero")
    click_action(page, "Continue to checkout")
    page.wait_for_url(re.compile(r"/checkout/credits"), timeout=15000)
    ctx.check(re.search(r"/checkout/credits\?pack=pack10&return=%2Fdashboard&types=technical%2Cadministrative$", page.url) is not None, f"Continue to checkout carries the pack ({page.url})")

    # Esc closes only the dialog; focus returns to the opener
    focus_and_esc(page, ctx, "credits-short", "Back")


def focus_and_esc(page, ctx, kind, dismiss):
    ctx.visit("/dashboard")
    page.wait_for_function("() => typeof window.__parachuteLock === 'function'", timeout=15000)
    opener = page.locator("aside a[href], header button").first
    opener.focus()
    page.evaluate("() => document.activeElement && document.activeElement.setAttribute('data-t41-opener', '1')")
    url0 = page.url
    page.evaluate(f"() => window.__parachuteLock('{kind}')")
    page.wait_for_selector(f"{DLG} .lock-title", timeout=10000)
    page.wait_for_timeout(300)
    inside = page.evaluate("(sel) => document.querySelector(sel).contains(document.activeElement)", DLG)
    ctx.check(inside, f"{kind}: focus moves into the dialog")
    page.keyboard.press("Escape")
    ctx.check(closed(page), f"{kind}: Esc closes the dialog")
    ctx.check(page.url == url0, f"{kind}: Esc leaves the page alone ({page.url})")
    ctx.check(page.locator("aside").count() >= 1, f"{kind}: shell still there after Esc")
    back = page.evaluate("() => !!document.activeElement && document.activeElement.hasAttribute('data-t41-opener')")
    ctx.check(back, f"{kind}: focus returns to the opener after Esc")

    # Same through the dismiss button (Back / Got it)
    opener.focus()
    page.evaluate(f"() => window.__parachuteLock('{kind}')")
    page.wait_for_selector(f"{DLG} .lock-title", timeout=10000)
    page.wait_for_timeout(300)
    click_action(page, dismiss)
    ctx.check(closed(page), f"{kind}: {dismiss} closes")
    back = page.evaluate("() => !!document.activeElement && document.activeElement.hasAttribute('data-t41-opener')")
    ctx.check(back, f"{kind}: focus returns to the opener after the button")


# ---------------------------------------------------------------- reviewer (Marcus)
def reviewer_run(page, ctx):
    # Approval, reviewer
    open_lock(page, ctx, "approval-reviewer")
    t = title(page)
    ctx.check(t == "Reviews open after Harbor's setup call", f"reviewer approval title ({t!r})")
    c = copy_text(page)
    ctx.check(c.startswith("Dana Reyes booked Harbor's setup call for") and "Reviews open once Realwired confirms the account, usually the same day." in c, f"reviewer approval copy ({c!r})")
    a = actions(page)
    ctx.check(a == ["Ask Dana", "Got it"], f"reviewer approval actions {a}")
    common(page, ctx, "approval-reviewer", "09b-approval-pending")
    ctx.shoot("t4-1-approval-reviewer")
    click_action(page, "Got it")
    ctx.check(closed(page), "reviewer approval: Got it closes")

    # Role
    open_lock(page, ctx, "role")
    t = title(page)
    ctx.check(t == "Only admins can buy credits", f"role title ({t!r})")
    c = copy_text(page)
    ctx.check(c == "Dana Reyes manages billing for Harbor Community Bank.", f"role copy ({c!r})")
    a = actions(page)
    ctx.check(a == ["Ask Dana", "Got it"], f"role actions {a}")
    common(page, ctx, "role", "10b-locked-feature")
    ctx.shoot("t4-1-role")
    click_action(page, "Ask Dana")
    page.wait_for_timeout(300)
    ctx.check(title(page) == "Ask Dana for more credits", f"role → Ask Dana opens the request ({title(page)!r})")
    click_action(page, "Not now")
    ctx.check(closed(page), "role request: Not now closes")

    # Credits, reviewer → request
    open_lock(page, ctx, "credits-reviewer")
    t = title(page)
    ctx.check(t == "You need 1 more credit", f"reviewer credits title ({t!r})")
    c = copy_text(page)
    ctx.check("Only admins can buy credits. Dana Reyes gets your request by email and in Parachute." in c, f"reviewer credits copy ({c!r})")
    ctx.check(page.locator(f"{DLG} label", has_text="Note for Dana (optional)").count() == 1, "note field label")
    ph = page.locator(f"{DLG} textarea").get_attribute("placeholder")
    ctx.check(ph == "For example: 3 reports due Friday", f"note placeholder ({ph!r})")
    a = actions(page)
    ctx.check(a == ["Not now", "Ask Dana for more credits"], f"reviewer credits actions {a}")
    common(page, ctx, "credits-reviewer", "10b-locked-feature")
    ctx.shoot("t4-1-credits-reviewer")
    page.locator(f"{DLG} textarea").fill("3 reports due Friday")
    click_action(page, "Ask Dana for more credits")
    page.wait_for_selector(f"{DLG} .lock-title:has-text('Requested')", timeout=10000)
    t = title(page)
    ctx.check(t == "Requested · Dana will be notified", f"sent title ({t!r})")
    ctx.check(page.locator(f"{DLG} .lock-art[data-spot='15-request-sent'] svg.ill").count() == 1, "sent: spot 15-request-sent")
    c = copy_text(page)
    ctx.check(c.startswith("Dana Reyes gets your request by email and in Parachute."), f"sent copy ({c!r})")
    ctx.shoot("t4-1-request-sent")
    stored = page.evaluate(
        """() => Object.keys(localStorage).filter(k => /credit_requests/.test(k))
             .map(k => localStorage.getItem(k)).join('')"""
    )
    ctx.check("3 reports due Friday" in (stored or ""), "request stored with the note (adapter)")
    click_action(page, "Done")
    ctx.check(closed(page), "sent: Done closes")

    # Survives reload: no second ask
    page.reload(wait_until="domcontentloaded")
    ctx.settle()
    open_lock(page, ctx, "credits-reviewer")
    page.wait_for_selector(f"{DLG} .lock-title:has-text('already')", timeout=10000)
    t = title(page)
    ctx.check(t == "You already asked Dana", f"after reload: already asked ({t!r})")
    ctx.check(page.locator(f"{DLG} textarea").count() == 0, "after reload: no second ask")
    ctx.shoot("t4-1-request-already")
    click_action(page, "Got it")
    ctx.check(closed(page), "already: Got it closes")

    focus_and_esc(page, ctx, "role", "Got it")


def run(page, ctx):
    if ctx.persona == "reviewer":
        reviewer_run(page, ctx)
    else:
        admin_run(page, ctx)
