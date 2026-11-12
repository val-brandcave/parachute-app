"""T4.4 reviewer credit requests (spec §5.9).

Marcus (reviewer) and Dana (trial-admin) share Harbor Community Bank, and the mock data
lives in this browser's localStorage, so switching persona in one context is the hand-off.

Checks: reviewer asks from Billing with a note -> tracker "You asked Dana Reyes", survives
reload, no second ask offered; admin popover shows "Marcus Ortiz asked for more credits" +
note and marks it opened (reviewer's tracker says so); Add credits -> checkout carrying
pack=pack10&request=<id> -> pay -> reviewer sees "Credits added" and one toast (not after a
reload); a second request is dismissed -> "Dana closed your request" + "Ask again" opens the
form; the reviewer popover asks through the same record; /emails lists both emails.
"""

import re

PERSONAS = ["reviewer"]
NOTE = "3 reports due Friday"


def no_disabled(page, ctx, where):
    n = page.locator("button[disabled]").count()
    ctx.check(n == 0, f"{where}: no button[disabled] (found {n})")


def open_pill(page):
    page.locator(".credits-pill").first.click()
    page.wait_for_selector(".credits-pop .cp", timeout=10000)
    page.wait_for_timeout(500)


def reviewer_billing(page, ctx):
    ctx.visit("/configure/billing")
    page.wait_for_selector(".rq, .bl-ask", timeout=15000)


def emails(page, ctx):
    ctx.visit("/emails")
    body = page.inner_text("body")
    ctx.check("Marcus Ortiz asked for more credits" in body, "/emails lists the request email")
    ctx.check("added credits for Harbor Community Bank" in body, "/emails lists the credits-added email")
    ctx.shoot("t4-4-emails")


def run(page, ctx):
    # ---- Reviewer asks from Billing ----
    reviewer_billing(page, ctx)
    ctx.check(page.locator("button", has_text="Ask Dana for more credits").count() == 1, "ask button offered")
    page.fill("#rq-note", NOTE)
    ctx.shoot("t4-4-form")
    page.locator("button", has_text="Ask Dana for more credits").click()
    page.wait_for_selector("text=You asked Dana Reyes", timeout=10000)
    ctx.check(page.locator("button", has_text="Ask Dana for more credits").count() == 0, "no second ask while open")
    ctx.check(page.locator(".rq-quote", has_text=NOTE).count() == 1, "note shown in the tracker")
    ctx.check(page.locator("text=has not opened it yet").count() == 1, "tracker: not opened yet")
    no_disabled(page, ctx, "tracker")
    ctx.shoot("t4-4-tracker")

    ctx.visit("/configure/billing")
    page.wait_for_selector("text=You asked Dana Reyes", timeout=15000)
    ctx.check(page.locator("button", has_text="Ask Dana for more credits").count() == 0, "after reload: still tracked, no second ask")

    if ctx.width < 1000:
        # The header pill is a desktop surface; the admin hand-off is covered at 1440.
        emails(page, ctx)
        return

    # Reviewer popover agrees: no second request from there either.
    open_pill(page)
    ctx.check(page.locator(".credits-pop button", has_text="Dana has been asked").count() == 1, "reviewer popover knows Dana was asked")
    page.keyboard.press("Escape")

    # ---- Admin sees it ----
    ctx.enter_persona("trial-admin")
    open_pill(page)
    card = page.locator(".cp-req")
    ctx.check(card.count() == 1, f"one request card ({card.count()})")
    ctx.check(card.locator("text=Marcus Ortiz asked for more credits").count() == 1, "card names Marcus")
    ctx.check(card.locator(f"text={NOTE}").count() == 1, "card shows the note")
    ctx.check(card.locator("button", has_text="Add credits").count() == 1 and card.locator("button", has_text="Dismiss").count() == 1, "Add credits and Dismiss")
    ctx.shoot("t4-4-admin-popover")
    page.keyboard.press("Escape")

    # Opening it set `opened`: the reviewer's tracker says so.
    ctx.enter_persona("reviewer")
    reviewer_billing(page, ctx)
    page.wait_for_selector("text=You asked Dana Reyes", timeout=10000)
    ctx.check(page.locator("text=Dana has seen your request").count() == 1, "opening the popover set opened")

    # ---- Admin adds credits through the request ----
    ctx.enter_persona("trial-admin")
    open_pill(page)
    page.locator(".cp-req button", has_text="Add credits").click()
    page.wait_for_url(re.compile(r"/checkout/credits"), timeout=15000)
    ctx.check("pack=pack10" in page.url and re.search(r"request=[^&]+", page.url) is not None, f"checkout carries pack10 and request ({page.url})")
    page.wait_for_selector(".co-sum", timeout=15000)
    page.locator(".co-sum-cta", has_text="Continue to checkout").click()
    page.wait_for_url(re.compile(r"step=review"), timeout=10000)
    page.wait_for_selector("text=Review and pay", timeout=10000)
    page.wait_for_timeout(500)
    ctx.check("request=" in page.url, "request survives to Review")
    page.locator(".co-terms input[type=checkbox]").check()
    page.locator(".co-sum-cta").click()
    page.wait_for_url(re.compile(r"step=done"), timeout=15000)
    page.wait_for_selector("text=10 credits added", timeout=10000)
    page.wait_for_timeout(500)

    # The admin's popover no longer lists it.
    ctx.visit("/dashboard")
    open_pill(page)
    ctx.check(page.locator(".cp-req").count() == 0, "fulfilled request leaves the admin popover")
    page.keyboard.press("Escape")

    # ---- Reviewer: Credits added + toast once ----
    ctx.enter_persona("reviewer")
    reviewer_billing(page, ctx)
    page.wait_for_selector(".rq-title--ok", timeout=10000)
    ctx.check(page.locator(".rq-title--ok", has_text="Credits added").count() == 1, "reviewer sees Credits added")
    ctx.check(page.locator("text=added credits to").count() == 1, "toast shown on first load")
    ctx.shoot("t4-4-credits-added")
    ctx.visit("/configure/billing")
    page.wait_for_selector(".rq-title--ok", timeout=10000)
    ctx.check(page.locator("text=added credits to").count() == 0, "toast not shown again after reload")

    # ---- Dismiss path ----
    page.locator("button", has_text="Ask for more").click()
    page.fill("#rq-note", "One more report came in")
    page.locator("button", has_text="Ask Dana for more credits").click()
    page.wait_for_selector("text=You asked Dana Reyes", timeout=10000)
    ctx.enter_persona("trial-admin")
    open_pill(page)
    ctx.check(page.locator(".cp-req").count() == 1, "second request waiting")
    page.locator(".cp-req button", has_text="Dismiss").click()
    page.wait_for_timeout(500)
    ctx.check(page.locator(".cp-req").count() == 0, "dismissed card leaves the popover")
    page.keyboard.press("Escape")
    ctx.enter_persona("reviewer")
    reviewer_billing(page, ctx)
    page.wait_for_selector("text=Dana closed your request", timeout=10000)
    ctx.shoot("t4-4-dismissed")
    page.locator("button", has_text="Ask again").click()
    page.wait_for_selector("#rq-note", timeout=5000)
    ctx.check(page.locator("button", has_text="Ask Dana for more credits").count() == 1, "Ask again reopens the form")
    no_disabled(page, ctx, "dismissed")

    # ---- Reviewer popover writes the same record ----
    open_pill(page)
    page.locator(".credits-pop button", has_text="Ask Dana for more credits").click()
    page.wait_for_timeout(500)
    ctx.check(page.locator(".credits-pop button", has_text="Dana has been asked").count() == 1, "popover ask writes a request")
    page.keyboard.press("Escape")
    reviewer_billing(page, ctx)
    page.wait_for_selector("text=You asked Dana Reyes", timeout=10000)
    ctx.check(True, "popover request shows in the Billing tracker")

    emails(page, ctx)
