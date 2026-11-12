"""T4.3 Review setup: lock-then-explain over the review takeover.

lock_over_takeover (RF1): persona short by one (payg-admin-low, 1 credit), Review setup
  with both types, click Start review -> the credits lock dialog is visible;
  elementFromPoint(dialog centre) lands inside the lock dialog; Review setup is still
  rendered behind the scrim; Esc -> dialog gone, `.run` still attached, focus back on
  Start review.
run_only (PC-32): reopen the dialog -> "Run Technical only (1 credit)" -> the review starts
  now with Technical only (progress spoke, stored `running` + ["technical"]) and the
  ledger has ONE debit for it, of 1 credit.
form_gaps (B12 / RF5): zero types -> Start stays clickable, no dialog, the inline note
  shows and focus moves to the type list; empty address -> inline note, focus on the
  field; no `button[disabled]` in `.run-cf-footbar`; LowBalanceCallout text absent.
pending_queue_run (B5): pending-admin, an intake row in /reviews -> queue "Run" ->
  Review setup -> Start review is aria-disabled (never disabled) and opens the approval
  dialog over the takeover.

The lock dialog is T4.1's: its root is matched as an element with role="dialog" that is,
or sits inside, `.lock-dialog` / T4.1's `.lock-dlg` (so it is never confused with `.run`, also role="dialog").
"""

import re

from flows.t3_3_reroute import (
    LEDGER_KEY,
    REVIEWS_KEY,
    current_org,
    open_review_setup,
    stored_review,
    type_state,
)

PERSONAS = ["payg-admin-low", "pending-admin"]

LOCK_SEL = (
    '.lock-dialog[role="dialog"], .lock-dialog [role="dialog"], [role="dialog"]:has(.lock-dialog), '
    '.lock-dlg[role="dialog"], .lock-dlg [role="dialog"], [role="dialog"]:has(.lock-body)'
)
START = ".run-cf-footbar button:has-text('Start review')"


def lock_dialog(page):
    return page.locator(LOCK_SEL).first


def wait_lock(page, timeout=6000):
    try:
        page.wait_for_selector(LOCK_SEL, state="visible", timeout=timeout)
        return True
    except Exception:
        return False


def lock_gone(page, timeout=4000):
    try:
        page.wait_for_selector(LOCK_SEL, state="detached", timeout=timeout)
        return True
    except Exception:
        return page.locator(LOCK_SEL).count() == 0 or not page.locator(LOCK_SEL).first.is_visible()


def focus_info(page):
    return page.evaluate(
        """() => { const a = document.activeElement; if (!a) return null;
             return { tag: a.tagName, text: (a.textContent || '').trim().slice(0, 40),
                      role: a.getAttribute('role'), inFoot: !!a.closest('.run-cf-footbar'),
                      inOpts: !!a.closest('.run-cf-opts'), inForm: !!a.closest('.run-cf-form'),
                      label: a.closest('label') ? a.closest('label').querySelector('span').textContent.trim() : null }; }"""
    )


def footbar_checks(page, ctx):
    n = page.locator(".run-cf-footbar button[disabled]").count()
    ctx.check(n == 0, f"no button[disabled] in .run-cf-footbar ({n})")
    body = page.inner_text(".run")
    ctx.check(page.locator(".cs-callout").count() == 0, "no LowBalanceCallout (.cs-callout) on Review setup")
    ctx.check("saved as a draft" not in body and "This review needs" not in body,
              "LowBalanceCallout copy is gone")


def form_gaps(page, ctx):
    start = page.locator(START).first
    # Zero types
    for label in ("Technical review", "Administrative review"):
        page.locator('.run-cf-opt[role="checkbox"]', has_text=label).first.click()
    page.wait_for_timeout(400)
    ctx.check(type_state(page) == {"technical": False, "administrative": False}, "both types unticked")
    ctx.check(start.get_attribute("disabled") is None, "zero types: Start review is not disabled")
    ctx.check(start.get_attribute("aria-disabled") == "true", "zero types: Start review is aria-disabled")
    start.click(force=True)  # aria-disabled reads as 'not enabled' to Playwright
    page.wait_for_timeout(500)
    ctx.check(page.locator(".run-cf-opt-note", has_text="Select at least one review type").count() == 1,
              "zero types: inline note shows")
    f = focus_info(page)
    ctx.check(f is not None and f["inOpts"] and f["role"] == "checkbox", f"zero types: focus moves to the type list ({f})")
    ctx.check(page.locator(LOCK_SEL).count() == 0, "zero types: no lock dialog")
    ctx.check(page.locator(".run .run-cf").count() == 1, "zero types: still on Review setup")
    ctx.shoot("t4-3-zero-types")
    for label in ("Technical review", "Administrative review"):
        page.locator('.run-cf-opt[role="checkbox"]', has_text=label).first.click()
    page.wait_for_timeout(400)

    # Empty address
    addr_input = page.locator(".run-cf-form label", has_text="Property address").locator("input").first
    addr = addr_input.input_value()
    addr_input.fill("")
    page.locator(".run-cf-title").click()  # blur
    ctx.check(start.get_attribute("disabled") is None, "empty address: Start review is not disabled")
    start.click(force=True)  # aria-disabled reads as 'not enabled' to Playwright
    page.wait_for_timeout(500)
    ctx.check(page.locator(".run-cf-opt-note", has_text="Add the property address").count() == 1,
              "empty address: inline note shows")
    f = focus_info(page)
    ctx.check(f is not None and f["tag"] == "INPUT" and f["label"] == "Property address",
              f"empty address: focus on the address field ({f})")
    ctx.check(page.locator(LOCK_SEL).count() == 0, "empty address: no lock dialog")
    ctx.shoot("t4-3-empty-address")
    addr_input.fill(addr or "12 Test St, Springfield")
    page.wait_for_timeout(300)


def lock_over_takeover(page, ctx):
    ctx.check(type_state(page) == {"technical": True, "administrative": True}, f"both types selected ({type_state(page)})")
    start = page.locator(START).first
    start.click(force=True)  # aria-disabled reads as 'not enabled' to Playwright
    if not ctx.check(wait_lock(page), "Start while short opens the lock dialog (T4.1 .lock-dialog)"):
        ctx.shoot("t4-3-no-lock-dialog")
        return False
    page.wait_for_timeout(500)  # entrance motion
    hit = page.evaluate(
        """(sel) => { const d = document.querySelector(sel); if (!d) return { ok: false, why: 'no dialog' };
             const r = d.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
             const el = document.elementFromPoint(x, y);
             return { ok: !!el && (d.contains(el) || !!el.closest('.lock-dialog, .lock-dlg')),
                      inRun: !!el && !!el.closest('.run'),
                      el: el ? el.tagName + '.' + (el.className && el.className.baseVal === undefined ? el.className : '') : null }; }""",
        LOCK_SEL,
    )
    ctx.check(hit["ok"] and not hit["inRun"], f"RF1: elementFromPoint(centre) is inside the lock dialog ({hit})")
    behind = page.locator(".run .run-cf")
    ctx.check(behind.count() == 1 and behind.first.is_visible(), "Review setup still rendered behind the scrim")
    text = lock_dialog(page).inner_text()
    ctx.check(re.search(r"need 1 more credit", text, re.I) is not None, f"credits short copy ({text[:80]!r})")
    ctx.shoot("t4-3-lock-over-takeover")

    page.keyboard.press("Escape")
    ctx.check(lock_gone(page), "Esc closes the lock dialog")
    page.wait_for_timeout(1200)  # long enough for a stray close / route change to land
    ctx.check(page.locator(".run").count() >= 1 and page.locator(".run .run-cf").count() == 1,
              "Esc leaves .run attached on Review setup")
    f = focus_info(page)
    ctx.check(f is not None and f["inFoot"] and "Start review" in f["text"], f"focus returns to Start review ({f})")
    return True


def ledger_debits(page, rid):
    return page.evaluate(
        """([k, id]) => JSON.parse(localStorage.getItem(k) || '[]')
             .filter(e => e.kind === 'debit' && e.reviewId === id).map(e => e.credits)""",
        [LEDGER_KEY, rid],
    )


def all_debits(page):
    return page.evaluate(
        "(k) => JSON.parse(localStorage.getItem(k) || '[]').filter(e => e.kind === 'debit').length", LEDGER_KEY
    )


def run_only(page, ctx):
    page.locator(START).first.click(force=True)
    if not ctx.check(wait_lock(page), "Start reopens the credits dialog"):
        return
    btn = lock_dialog(page).get_by_role("button", name=re.compile(r"Run Technical only"))
    if not ctx.check(btn.count() >= 1, "dialog offers 'Run Technical only (1 credit)'"):
        return
    ctx.check(re.search(r"\(1 credit\)", btn.first.inner_text()) is not None, f"label carries (1 credit) ({btn.first.inner_text()!r})")
    before = all_debits(page)
    btn.first.dblclick()  # the dialog body stays clickable through its exit: must start once
    try:
        page.wait_for_url(re.compile(r"/reviews/[^/?#]+$"), timeout=10000)
    except Exception:
        pass
    m = re.search(r"/reviews/([^/?#]+)$", page.url)
    if not ctx.check(m is not None, f"run-only routes into the review ({page.url})"):
        return
    rid = m.group(1)
    page.wait_for_timeout(1200)
    ctx.check(page.locator(LOCK_SEL).count() == 0, "lock dialog closed after run-only")
    ctx.check(page.locator(".run .run-cf").count() == 0, "left Review setup (progress spoke)")
    r = stored_review(page, rid)
    ctx.check(r is not None and r["status"] == "running" and r["types"] == ["technical"],
              f"PC-32: review started now with Technical only ({r})")
    d = ledger_debits(page, rid)
    ctx.check(d == [-1], f"PC-32: ledger shows ONE debit of 1 credit for {rid} ({d})")
    page.wait_for_timeout(800)
    after = all_debits(page)
    ctx.check(after == before + 1, f"double-clicked run-only: exactly ONE new debit across all reviews ({before} -> {after})")
    ctx.shoot("t4-3-run-only-progress")


INTAKE = {
    "id": "review-t43-intake",
    "orgId": "org-lakeside",
    "propertyAddress": "Harborview Lofts — 14 Pier Rd",
    "propertyType": "Multifamily",
    "bank": "Lakeside Valuation",
    "appraisalFirm": "Northgate Appraisal Group",
    "loanNo": "LN-4310",
    "status": "intake",
    "reviewTypes": ["technical", "administrative"],
    "assigneeId": "user-lv1",
    "source": "yc",
    "riskRating": None,
    "openFindings": 0,
    "flaggedCount": 0,
    "worstSeverity": None,
    "pipelineStage": 0,
}


def pending_queue_run(page, ctx):
    org = current_org(page)
    ctx.check(org == "org-lakeside", f"pending-admin session org ({org})")
    page.evaluate(
        """([k, row]) => { const now = Date.now(); const rows = JSON.parse(localStorage.getItem(k) || '[]');
             if (!rows.some(r => r.id === row.id)) rows.push({ ...row, slaDueAt: now + 5 * 864e5,
               orderedAt: now - 864e5, createdAt: now - 864e5, updatedAt: now - 864e5 });
             localStorage.setItem(k, JSON.stringify(rows)); }""",
        [REVIEWS_KEY, INTAKE],
    )
    ctx.visit("/reviews")
    tab = page.get_by_role("tab", name=re.compile(r"^Intake"))
    if tab.count():
        tab.first.click()
        page.wait_for_timeout(600)
    row = page.locator(".qrow", has_text="Harborview Lofts")
    if not ctx.check(row.count() >= 1, "pending org's intake row is in /reviews"):
        ctx.shoot("t4-3-pending-reviews")
        return
    run = row.first.get_by_role("button", name="Run")
    if not run.count():
        run = row.first.get_by_role("link", name="Run")
    if not ctx.check(run.count() >= 1, "intake row has the queue 'Run'"):
        return
    run.first.click()
    try:
        page.wait_for_selector(".run .run-cf", timeout=15000)
    except Exception:
        pass
    ctx.settle(900)
    if not ctx.check(page.locator(".run .run-cf").count() == 1, f"queue Run reaches Review setup ({page.url})"):
        return
    start = page.locator(START).first
    ctx.check(start.get_attribute("disabled") is None, "pending: Start review is not disabled")
    ctx.check(start.get_attribute("aria-disabled") == "true", "pending: Start review is aria-disabled")
    footbar_checks(page, ctx)
    start.click(force=True)  # aria-disabled reads as 'not enabled' to Playwright
    if not ctx.check(wait_lock(page), "B5: pending Start opens the approval lock dialog"):
        ctx.shoot("t4-3-pending-no-dialog")
        return
    page.wait_for_timeout(500)
    text = lock_dialog(page).inner_text()
    ctx.check(re.search(r"Lakeside|setup call|confirmed", text) is not None and "credit" not in text.split("\n")[0].lower(),
              f"approval variant, not credits ({text[:100]!r})")
    ctx.check(page.locator(".run .run-cf").count() == 1, "pending: Review setup stays behind the dialog")
    ctx.shoot("t4-3-pending-approval")
    page.keyboard.press("Escape")
    ctx.check(lock_gone(page), "pending: Esc closes the approval dialog")
    page.wait_for_timeout(1200)  # long enough for a stray close / route change to land
    ctx.check(page.locator(".run .run-cf").count() == 1 and "/reviews/" in page.url,
              f"pending: .run still attached after Esc ({page.url})")
    f = focus_info(page)
    ctx.check(f is not None and f["inFoot"] and "Start review" in f["text"], f"pending: focus returns to Start review ({f})")
    r = stored_review(page, INTAKE["id"])
    ctx.check(r is not None and r["status"] == "intake", f"pending: nothing started ({r})")


def run(page, ctx):
    if ctx.width < 1000:
        return  # desktop-first takeover; nothing width-specific to check here
    if ctx.persona == "payg-admin-low":
        open_review_setup(page, ctx)
        footbar_checks(page, ctx)
        form_gaps(page, ctx)
        ctx.shoot("t4-3-review-setup-short")
        if lock_over_takeover(page, ctx):
            run_only(page, ctx)
    elif ctx.persona == "pending-admin":
        pending_queue_run(page, ctx)
