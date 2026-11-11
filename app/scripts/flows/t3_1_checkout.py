"""T3.1 full-page checkout (spec §5.6, PC-7, PC-8).

Persona trial-admin (Dana, Harbor Community Bank). The seed already gives org-hcb a saved
card (wallet-settings.seed.ts: paymentMethod "card", cardLast4 "4242"), so no set-up step
is needed; the flow asserts it instead (Next on Amount goes straight to Review).

Checks: focused chrome (no sidebar/header), stepper "1 Amount · 2 Payment · 3 Review",
summary stays put while the body scrolls, saved card skips Payment but the stepper still
opens it, Pay without terms → inline error + focus on the checkbox, Pay → step=done via
replace (Back can't reach Review), balance +10, Custom 101 → sales line, error=card →
decline callout, Exit with a return lands there, hard reload keeps the draft, no
button[disabled], no illustration on Amount/Payment/Review.
"""

import re
from urllib.parse import quote

PERSONAS = ["trial-admin", "reviewer"]
RETURN = "/configure/billing?tab=usage"


def num(text):
    m = re.search(r"\d+", text or "")
    return int(m.group()) if m else None


def no_disabled(page, ctx, where):
    n = page.locator("button[disabled]").count()
    ctx.check(n == 0, f"{where}: no button[disabled] (found {n})")


def no_art(page, ctx, where):
    # The top-bar logo is a brand mark, not an illustration.
    n = page.locator(".co-main .ill, .co-main img, .co-main svg.ill, .co-sum .ill, .co-sum img").count()
    ctx.check(n == 0, f"{where}: no illustration (found {n})")


def summary_balance(page):
    row = page.locator(".co-sum-row", has_text="Current balance").locator("dd")
    return num(row.first.inner_text()) if row.count() else None


def reviewer_run(page, ctx):
    """A reviewer reaching the URL: a plain explanation, never a form or a Pay button.
    (The lock store is in-memory zustand; the LockDialog is still the phase-4 stub, so the
    flow asserts the inline explanation and that nothing can be bought.)"""
    pill0 = page.locator(".credits-pill")
    bal0 = num(pill0.first.inner_text()) if pill0.count() else None
    ctx.check(pill0.count() > 0 and bal0 is not None, "reviewer balance source (.credits-pill) exists before the visit")
    ctx.visit("/checkout/credits?pack=pack10&step=review")
    page.wait_for_selector(".co-blocked", timeout=15000)
    ctx.check(page.locator("text=Only an admin can buy credits").count() == 1, "reviewer sees the inline explanation")
    ctx.check(page.locator(".co-blocked button", has_text="Ask").count() == 1, "reviewer gets an Ask action")
    ctx.check(page.locator(".co-pay, .co-sum, .co-terms").count() == 0, "no Pay, summary or terms for a reviewer")
    no_disabled(page, ctx, "reviewer")
    ctx.shoot("t3-1-reviewer")
    page.locator(".co-blocked button", has_text="Ask").click()
    page.wait_for_timeout(300)
    ctx.visit("/dashboard")
    pill1 = page.locator(".credits-pill")
    bal1 = num(pill1.first.inner_text()) if pill1.count() else None
    ctx.check(pill1.count() > 0 and bal1 is not None, "reviewer balance source (.credits-pill) exists after the visit")
    ctx.check(bal0 is not None and bal0 == bal1, f"no purchase happened ({bal0} → {bal1})")


def run(page, ctx):
    if ctx.persona == "reviewer":
        reviewer_run(page, ctx)
        return
    desktop = ctx.width >= 1000

    # ---- Amount: focused chrome ----
    ctx.visit(f"/checkout/credits?pack=pack10&return={quote(RETURN, safe='')}")
    page.wait_for_selector(".co-sum", timeout=15000)
    ctx.check(page.locator(".credits-pill, .sb-balance, aside nav").count() == 0, "no shell header or sidebar")
    labels = [t.strip() for t in page.locator(".hstep-label").all_text_contents()]
    nums = [t.strip() for t in page.locator(".hstep-n").all_text_contents()]
    ctx.check(labels == ["Amount", "Payment", "Review"], f"stepper labels {labels}")
    ctx.check(nums == ["1", "2", "3"], f"stepper numbers {nums}")
    ctx.check(page.locator(".co-pack.is-selected", has_text="10").count() == 1, "pack10 preselected")
    ctx.check("Exit checkout" in page.locator(".co-exit").inner_text(), "Exit checkout in the top bar")
    no_disabled(page, ctx, "amount")
    no_art(page, ctx, "amount")
    before = summary_balance(page)
    ctx.check(before is not None, f"summary shows the current balance ({before})")

    if desktop:
        # A shorter window so the Amount body must scroll.
        page.set_viewport_size({"width": ctx.width, "height": 560})
        page.wait_for_timeout(300)
        top0 = page.evaluate("() => document.querySelector('.co-sum').getBoundingClientRect().top")
        page.evaluate("""() => { const b = document.querySelector('.co-main').closest('.overflow-y-auto');
          if (b) b.scrollTop = 600; }""")
        page.wait_for_timeout(300)
        scrolled = page.evaluate("() => { const b = document.querySelector('.co-main').closest('.overflow-y-auto'); return b ? b.scrollTop : 0 }")
        top1 = page.evaluate("() => document.querySelector('.co-sum').getBoundingClientRect().top")
        ctx.check(scrolled > 0, f"amount body scrolls ({scrolled})")
        ctx.check(abs(top1 - top0) < 1, f"summary stays put while the body scrolls ({top0} → {top1})")
        page.evaluate("() => { const b = document.querySelector('.co-main').closest('.overflow-y-auto'); if (b) b.scrollTop = 0; }")
        page.set_viewport_size({"width": ctx.width, "height": 900})
        page.wait_for_timeout(300)
        w = page.evaluate("() => Math.round(document.querySelector('.co-main').getBoundingClientRect().width)")
        ctx.check(w > ctx.width - 420, f"content column fills the rest ({w}px)")
    ctx.shoot("t3-1-amount")

    # ---- Saved card: Amount → Review ----
    page.locator(".co-actions button", has_text="Continue to review").click()
    page.wait_for_url(re.compile(r"step=review"), timeout=10000)
    page.wait_for_selector("text=Review and pay", timeout=10000)
    page.wait_for_timeout(500)
    ctx.check(page.locator(".hstep-item").nth(1).locator("button").count() == 1, "stepper still opens Payment")
    pn = page.locator(".hstep-item").nth(1).locator(".hstep-n").text_content().strip()
    ctx.check(pn == "2", f"skipped Payment keeps its number, not a done check ({pn!r})")
    no_disabled(page, ctx, "review")
    no_art(page, ctx, "review")
    ctx.check("Visa ending in 4242" in page.inner_text("body"), "saved card on Review")

    # ---- Pay without terms ----
    page.locator(".co-pay").click()
    page.wait_for_timeout(300)
    ctx.check(page.locator("text=Agree to the credit terms to pay").count() == 1, "terms error shows")
    focused = page.evaluate("() => { const a = document.activeElement; return !!a && a.type === 'checkbox' && !!a.closest('.co-terms') }")
    ctx.check(focused, "focus moves to the terms checkbox")
    pay_disabled = page.evaluate("() => document.querySelector('.co-pay').disabled")
    ctx.check(not pay_disabled, "Pay is never disabled")
    ctx.shoot("t3-1-review-terms")

    # ---- Pay (double-click: must buy once) ----
    page.locator(".co-terms input[type=checkbox]").check()
    page.locator(".co-pay").dblclick()
    page.wait_for_url(re.compile(r"step=done"), timeout=15000)
    page.wait_for_selector("text=10 credits added", timeout=10000)
    ctx.check(page.locator(".co-root .ill").count() == 1, "Paid shows its one scene")
    ctx.check(page.locator(".co-next button", has_text="Back to billing").count() == 1, "return makes the primary a way back")
    no_disabled(page, ctx, "paid")
    page.wait_for_timeout(500)
    ctx.shoot("t3-1-paid")

    # ---- View receipt opens the receipt dialog ----
    page.locator(".co-next button", has_text="View receipt").click()
    page.wait_for_timeout(600)
    ctx.check(page.locator(".rc-paper").count() == 1, "View receipt opens the receipt dialog")
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)

    page.go_back()
    page.wait_for_timeout(1500)
    ctx.check("step=review" not in page.url, f"Back does not return to Review ({page.url})")
    ctx.check(page.locator("text=Review and pay").count() == 0, "Review is not on screen after Back")

    # ---- Back from Paid, then buy again in the same mounted page ----
    page.wait_for_selector(".co-sum-cta", timeout=10000)
    ctx.check(page.locator(".co-sum-cta").get_attribute("aria-busy") != "true", "summary CTA is not stuck busy after Back")
    page.locator(".co-actions button", has_text="Continue to review").click()
    page.wait_for_url(re.compile(r"step=review"), timeout=10000)
    page.wait_for_selector("text=Review and pay", timeout=10000)
    page.wait_for_timeout(500)
    ctx.check(not page.locator(".co-terms input[type=checkbox]").is_checked(), "terms start unticked for the new order")
    page.locator(".co-terms input[type=checkbox]").check()
    page.locator(".co-pay").click()
    page.wait_for_url(re.compile(r"step=done"), timeout=15000)
    page.wait_for_selector("text=10 credits added", timeout=10000)
    ctx.check(True, "second Pay after Back reached Paid")

    ctx.visit("/configure/billing")
    pill = page.locator(".credits-pill")
    # The pill can read 0 for a moment while the wallet hydrates: poll until it settles.
    after = None
    for _ in range(20):
        after = num(pill.first.inner_text()) if pill.count() else None
        if after:
            break
        page.wait_for_timeout(250)
    ctx.check(pill.count() > 0, "balance source (.credits-pill) exists on billing")
    ctx.check(before is not None and after == before + 20, f"balance rose by exactly two packs (double-click once, then Pay again after Back), +20 ({before} → {after})")

    # ---- Custom 101 ----
    ctx.visit("/checkout/credits?credits=5")
    page.wait_for_selector("#co-custom-n", timeout=15000)
    page.fill("#co-custom-n", "101")
    page.wait_for_timeout(300)
    ctx.check(page.locator(".co-custom", has_text="Over 100 credits? Talk to sales for volume pricing").count() == 1, "custom 101 → sales line")
    ctx.check(page.locator(".co-custom button", has_text="Talk to us").count() == 1, "Talk to us next to it")
    no_disabled(page, ctx, "custom 101")
    ctx.shoot("t3-1-custom-101")

    # ---- error=card ----
    ctx.visit("/checkout/credits?pack=pack10&step=payment&error=card")
    page.wait_for_selector("text=Pay with", timeout=15000)
    ctx.check(page.locator("text=Your card was declined. Try another card or ask your bank.").count() == 1, "decline callout on Payment")
    no_disabled(page, ctx, "payment")
    no_art(page, ctx, "payment")
    ctx.shoot("t3-1-payment-declined")

    # ---- Pay with error=card shows the decline (and buys nothing) ----
    ctx.visit("/checkout/credits?pack=pack10&step=review&error=card")
    page.wait_for_selector("text=Review and pay", timeout=15000)
    bal_review = summary_balance(page)
    page.locator(".co-terms input[type=checkbox]").check()
    page.locator(".co-pay").click()
    page.wait_for_url(re.compile(r"step=payment"), timeout=10000)
    page.wait_for_timeout(500)
    ctx.check(page.locator("text=Your card was declined. Try another card or ask your bank.").count() == 1, "Pay with error=card lands on the decline")
    ctx.check(summary_balance(page) == bal_review, "a declined Pay buys nothing")

    # ---- Hard reload keeps the draft ----
    ctx.visit("/checkout/credits?credits=7&step=review")
    page.reload(wait_until="domcontentloaded")
    ctx.settle()
    ctx.check(page.locator("text=Custom amount, 7 credits").count() == 1, "reload on Review keeps the amount")

    # ---- Exit with a return ----
    ctx.visit(f"/checkout/credits?pack=pack10&return={quote(RETURN, safe='')}")
    page.locator(".co-exit").click()
    page.wait_for_url(re.compile(r"/configure/billing\?tab=usage"), timeout=15000)
    ctx.check(page.url.endswith(RETURN), f"Exit lands on the return ({page.url})")

    # ---- Exit carries the review types back (RF4) ----
    ctx.visit(f"/checkout/credits?pack=pack10&return={quote(RETURN, safe='')}&types=technical")
    page.locator(".co-exit").click()
    page.wait_for_url(re.compile(r"/configure/billing\?tab=usage&types=technical"), timeout=15000)
    ctx.check(page.url.endswith("/configure/billing?tab=usage&types=technical"), f"Exit appends types to the return ({page.url})")
