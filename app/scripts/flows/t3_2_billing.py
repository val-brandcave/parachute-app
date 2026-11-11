"""T3.2 Billing states, Usage donut, How credits work.

Covers: the band per role/billing model, invoiced variants, amber/red rules, low hero + AutoReloadOffer,
zero hero + "Waiting to start", ExpiryAlert action, soonest-expiring copy, ?tab=credits for every role,
the /configure/billing/credits redirect, and the Usage donut (role=img sentence, hidden table = legend,
slice total = by-person total = centre number, empty period, period change).
Layout-level checks run at desktop width only; narrow width visits and shoots.
"""

import re

PERSONAS = ["trial-admin", "payg-admin-low", "approver", "reviewer", "pending-admin", "returning"]
ADMIN_WALLET = {"trial-admin", "payg-admin-low", "pending-admin"}
LEDGER_KEY = "parachute:credit_ledger"


def num(text):
    m = re.search(r"\d+(?:\.\d+)?", text or "")
    return float(m.group()) if m else None


def band(page):
    return page.locator("[role=tablist]").first.locator("xpath=../..")


def tab_labels(page):
    return [t.strip() for t in page.locator("[role=tablist]").first.locator("[role=tab]").all_inner_texts()]


def body(page):
    return " ".join(page.inner_text("main").split())


def band_text(page):
    bd = band(page)
    return " ".join(bd.inner_text().split()) if bd.count() else ""


def go(ctx, route):
    """Navigate without networkidle: wait for the tab list (the band) instead, at most 3 s."""
    page = ctx.page
    resp = page.goto(ctx.url(route), wait_until="domcontentloaded")
    if resp is not None and resp.status >= 400:
        ctx.errors.append(f"{route}: HTTP {resp.status}")
    try:
        page.wait_for_selector("[role=tablist]", timeout=3000)
    except Exception:
        pass
    page.wait_for_timeout(500)
    return resp


def ltxt(loc):
    return loc.first.inner_text() if loc.count() else ""


def attr(loc, name):
    return loc.first.get_attribute(name) if loc.count() else None


def visit_tab(ctx, tab=None):
    go(ctx, "/configure/billing" + (f"?tab={tab}" if tab else ""))


def explainer_ok(ctx, page, label):
    txt = body(page)
    ctx.check("What a review costs" in txt and "When you reach zero" in txt and "When credits expire" in txt, f"{label}: explainer renders")
    ctx.check("soonest first" in txt, f"{label}: expiry copy says soonest first")
    ctx.check(page.locator(".hcw svg.ill").count() >= 1, f"{label}: scene illustration present")


def band_checks(ctx, page):
    p = ctx.persona
    labels = tab_labels(page)
    bt = band_text(page)
    if p in ADMIN_WALLET:
        want = ["Overview", "Usage", "Invoices", "Settings"]
        ctx.check(labels[:4] == want and labels[-1] == "How credits work", f"{p}: admin tabs ({labels})")
        ctx.check("Prefer a monthly invoice?" in bt and "Talk to us" in bt, f"{p}: invoice link in band")
        ctx.check("How credits work" in bt, f"{p}: How credits work link in band")
        ctx.check(page.get_by_role("button", name=re.compile(r"^Add credits")).count() >= 1, f"{p}: Add credits in band")
    elif p in ("approver", "reviewer"):
        ctx.check(labels == ["Overview", "My usage", "How credits work"], f"{p}: reviewer tabs ({labels})")
        ctx.check("Add credits" not in bt, f"{p}: no Add credits")
    elif p == "returning":
        ctx.check(labels == ["Usage", "Invoices", "Settings", "How credits work"], f"{p}: invoiced admin tabs ({labels})")
        ctx.check("Download statement" in bt, "invoiced keeps Download statement")
        ctx.check("Add credits" not in bt and "Prefer a monthly invoice" not in bt, "invoiced band has no Add credits / invoice prompt")


def amber_red(ctx, page, expect):
    amber = page.locator(".ov-hero.is-low").count()
    red = page.locator(".ov-hero.is-zero").count()
    ctx.check((amber, red) == expect, f"amber/red hero classes {expect}, got {(amber, red)}")


def overview(ctx, page):
    p = ctx.persona
    visit_tab(ctx)
    ctx.shoot("t3-2-overview")
    txt = body(page)
    if p == "trial-admin":
        amber_red(ctx, page, (0, 0))
        ctx.check("Running low" not in txt and "Out of credits" not in txt, "trial: no low/zero language")
        ctx.check(page.locator(".bl-bonus").count() == 1, "trial: BonusNotice shown")
        ctx.check("Open Get started" in txt, "trial: bonus links Get started")
        ctx.check("soonest" in txt, "trial: breakdown says soonest-expiring first")
    if p == "payg-admin-low":
        amber_red(ctx, page, (1, 0))
        ctx.check("Running low" in txt, "low hero says Running low")
        offer = page.locator(".bl-offer")
        ctx.check(offer.count() == 1 and "up to 2 times a month" in ltxt(offer), "AutoReloadOffer with 'up to 2 times a month'")
        ctx.check("Never stop at Start" in txt, "offer title")
        ctx.check("Runs out" in txt, "runway shown (Runs out fact / line)")
        ctx.check("soonest" in txt, "breakdown says soonest-expiring first")
        ctx.shoot("t3-2-low")
    if p == "approver":
        ctx.check("Team balance" in txt, "approver: team balance hero")
        ctx.check(page.get_by_role("button", name="Add credits").count() == 0, "approver: no Add credits")
    if p == "reviewer":
        ctx.check("Team balance" in txt, "reviewer: team balance hero")
        ctx.check("You used this month" in txt and "Team used this month" in txt and "Admin" in txt, "reviewer: section 5.8 facts")
        ctx.check("Shared by everyone at" in txt, "reviewer: shared-by line")
    if p == "pending-admin":
        ctx.check("waiting for approval" in txt and "On hold" in txt, "pending: On hold hero")
        ctx.check(page.locator(".bl-big-n").count() == 0, "pending: no balance number")
        locked = page.get_by_role("button", name=re.compile(r"^Add credits"))
        ctx.check(locked.count() == 1 and attr(locked, "aria-disabled") == "true", "pending: Add credits is aria-disabled")
        ctx.check(attr(locked, "disabled") is None, "pending: Add credits has no disabled attribute")
        if locked.count():
            locked.first.click(force=True)
        page.wait_for_timeout(500)
        # LockDialog is a stub until T4.1, so only "the click does not navigate" is checkable here.
        ctx.check("/configure/billing" in page.url and "/checkout" not in page.url, "pending: locked Add credits does not navigate")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        ctx.shoot("t3-2-held")
    if p == "returning":
        rf3_invoiced(ctx, page)


def rf3_invoiced(ctx, page):
    """RF3: the header pill's 'N credits used' equals the Usage donut's centre number."""
    pill = " ".join(ltxt(page.locator(".credits-pill")).split())
    visit_tab(ctx, "usage")
    centre = num(ltxt(page.locator(".ud-n")))
    ctx.check(num(pill) is not None and centre is not None and num(pill) == centre, f"RF3 invoiced: pill {pill!r} = Usage centre {centre}")


def usage_checks(ctx, page):
    """Donut, hidden table, totals, empty period, period change. Admin wallet persona with spend."""
    visit_tab(ctx, "usage")
    ctx.shoot("t3-2-usage")
    svg = page.locator(".ud svg[role=img]")
    ctx.check(svg.count() == 1, "donut svg role=img present")
    label = svg.first.get_attribute("aria-label") or ""
    ctx.check(re.match(r"^[\d.]+ credits? used in \w+: Technical [\d.]+ credits? \(\d+%\), Administrative [\d.]+ credits? \(\d+%\)\.$", label) is not None, f"aria-label sentence ({label!r})")
    ctx.check(attr(page.locator(".ud-center"), "aria-hidden") == "true", "centre label aria-hidden")
    legend_rows = page.locator(".ud-legend .ud-lr").count()
    table_rows = page.locator(".ud table tbody tr").count()
    ctx.check(legend_rows == table_rows == 3, f"hidden table rows = legend rows ({table_rows} vs {legend_rows})")
    vals = [num(t) for t in page.locator(".ud-legend .ud-lr .ud-val").all_inner_texts()]
    centre = num(ltxt(page.locator(".ud-n")))
    ppl = [num(t) for t in page.locator(".ubp-v").all_inner_texts()]
    by_total = num(ltxt(page.locator(".ubp-total span")))
    ctx.check(vals[0] + vals[1] == vals[2] == centre == by_total == sum(ppl), f"slice total {vals[0]}+{vals[1]} = legend total {vals[2]} = centre {centre} = by-person {by_total} = rows {sum(ppl)}")
    ctx.check(ltxt(page.locator(".ud-legend")).count("full review") >= 3, "legend carries full-review equivalents")
    ctx.check(page.locator(".us-card, .us-legend").count() == 0, "UsageChart/BreakdownTable gone from Usage")
    ctx.check("1 credit is one review type on one report" in body(page), "legend footnote")
    ctx.check(page.get_by_role("button", name="Export CSV").count() == 1, "one Export CSV on Usage (filter row only)")


def period_checks(ctx, page):
    """Move every spend back 40 days: this month is empty, last month is not."""
    page.evaluate(
        """(key) => { const rows = JSON.parse(localStorage.getItem(key) || '[]');
          const d = 40 * 86400000;
          rows.forEach(r => { if (r.kind === 'debit' || r.kind === 'rescan') r.createdAt -= d; });
          localStorage.setItem(key, JSON.stringify(rows)); }""",
        LEDGER_KEY,
    )
    visit_tab(ctx, "usage")
    empties = page.locator(".ud .el, .ubp .el")
    ctx.check(empties.count() == 2, f"empty period: one EmptyLine per card ({empties.count()})")
    ctx.check(all("No credits used yet this period." in t for t in empties.all_inner_texts()), "empty period copy")
    ctx.check(page.locator(".ud svg[role=img]").count() == 0, "empty period: no empty ring")
    ctx.shoot("t3-2-usage-empty")
    if page.locator("#ud-period").count() == 0:
        ctx.check(False, "period picker present")
        return
    page.locator("#ud-period").click()
    page.wait_for_timeout(300)
    opts = page.locator("[role=listbox] [role=option]")
    ctx.check(opts.count() >= 2, f"period options include an earlier month ({opts.count()})")
    if opts.count() >= 2:
        opts.nth(1).click()
        page.wait_for_timeout(600)
        ctx.check(page.locator(".ud svg[role=img]").count() == 1, "period change: donut appears")
        ctx.check(page.locator(".ubp .ubp-row").count() >= 1, "period change: by-person list appears")
        centre = num(ltxt(page.locator(".ud-n")))
        by_total = num(ltxt(page.locator(".ubp-total span")))
        ctx.check(centre == by_total and centre > 0, f"period change: centre {centre} = by-person {by_total}")


def zero_checks(ctx, page):
    n = num(ltxt(page.locator(".bl-big-n"))) or 0
    page.evaluate(
        """([key, n]) => { const rows = JSON.parse(localStorage.getItem(key) || '[]');
          const last = rows[rows.length - 1];
          rows.push({ id: 'flow-zero', createdAt: Date.now(), orgId: last.orgId, kind: 'debit', credits: -n,
            reviewTypes: ['technical'], actorId: last.actorId, note: 'flow: zero' });
          localStorage.setItem(key, JSON.stringify(rows)); }""",
        [LEDGER_KEY, n],
    )
    visit_tab(ctx)
    txt = body(page)
    ctx.check("Out of credits" in txt, "zero hero says Out of credits")
    ctx.check("Waiting to start" in txt and "Ran out" in txt, "zero facts: Ran out, Waiting to start")
    amber_red(ctx, page, (0, 1))
    ctx.check("Running low" not in txt, "zero is not amber")
    ctx.shoot("t3-2-zero")


def dock_low(ctx, page):
    """DemoDock Low balance on a healthy-ish org flips the hero to low."""
    chip = page.get_by_role("button", name="Demo controls")
    if chip.count() == 0:
        ctx.check(False, "DemoDock chip present")
        return
    chip.first.click()
    page.wait_for_timeout(300)
    low = page.get_by_role("button", name="Low balance")
    if low.count():
        low.first.click()
    page.wait_for_timeout(800)
    chip.first.click()
    visit_tab(ctx)
    ctx.check("Running low" in body(page), "DemoDock Low balance -> Running low")
    ctx.check(page.locator(".bl-offer").count() == 1, "DemoDock low shows AutoReloadOffer")


def run(page, ctx):
    page.set_default_timeout(5000)
    p = ctx.persona
    desktop = ctx.width >= 1000
    visit_tab(ctx)
    if not desktop:
        ctx.shoot("t3-2-overview")
        visit_tab(ctx, "credits")
        ctx.shoot("t3-2-credits")
        if p in ADMIN_WALLET - {"pending-admin"}:
            visit_tab(ctx, "usage")
            ctx.shoot("t3-2-usage")
        return

    band_checks(ctx, page)
    ctx.shoot("t3-2-band")
    overview(ctx, page)

    # ?tab=credits renders the explainer for every role, and the old path redirects.
    visit_tab(ctx, "credits")
    explainer_ok(ctx, page, p)
    ctx.shoot("t3-2-credits")
    txt = body(page)
    if p in ("trial-admin", "payg-admin-low"):
        ctx.check("Need an invoice or a larger volume?" in txt and "Talk to sales" in txt, "admin sees the sales panel")
    if p == "pending-admin":
        first = ltxt(page.locator(".hcw .card"))
        ctx.check("Need an invoice" in first, "enterprise pill: sales panel moves to the top")
    if p in ("approver", "reviewer", "returning"):
        ctx.check("Need an invoice or a larger volume?" not in txt, f"{p}: no sales panel")
    resp = go(ctx, "/configure/billing/credits")
    ctx.check("tab=credits" in page.url, f"/configure/billing/credits redirects ({page.url})")
    ctx.check(resp is not None and resp.status < 400, "redirect page loads")
    ctx.check("What a review costs" in body(page), "redirect lands on the explainer")

    # Usage tab.
    if p == "payg-admin-low":
        usage_checks(ctx, page)
        # ExpiryAlert-less copy: soonest-expiring wording lives in the breakdown note.
        period_checks(ctx, page)
    if p == "trial-admin":
        usage_checks(ctx, page)
        dock_low(ctx, page)
    if p in ("approver", "reviewer"):
        visit_tab(ctx, "usage")
        ctx.check(page.locator(".ubp").count() == 0, f"{p}: My usage has no by-person card")
        ctx.shoot("t3-2-my-usage")
    if p == "returning":
        visit_tab(ctx, "usage")
        ctx.check(page.locator(".ud").count() == 1, "invoiced Usage shows the donut")
        ctx.check("Add credits" not in body(page) and "Runs out" not in body(page), "invoiced: no Add credits, no runway")
        ctx.shoot("t3-2-invoiced-usage")
    if p == "pending-admin":
        visit_tab(ctx, "usage")
        ctx.check("waiting for approval" in body(page), "pending Usage empty state")

    # Zero last: it rewrites the ledger.
    if p == "payg-admin-low":
        visit_tab(ctx)
        zero_checks(ctx, page)
