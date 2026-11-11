"""T1.3 book a call: scheduler header, pick Fri 10:00, book, booked state with
scene 25 and focus on its heading, the interstitial and /get-started (pending);
"I'll book later" -> interstitial without the booking line; "Call booked" e-mail.
Runs on the real /welcome/call, reached through the org-setup step."""

from datetime import datetime, timezone

PERSONAS = ["prospect"]

# Wed 11 Nov 2026, 12:00 Eastern: days are Thu 12 .. Wed 18 regardless of the real date.
NOW = datetime(2026, 11, 11, 17, 0, tzinfo=timezone.utc)


def open_call(page, ctx):
    page.clock.set_fixed_time(NOW)
    ctx.visit("/welcome")
    page.locator("#wel-org").wait_for(timeout=15000)
    page.fill("#wel-org", "Harbor Community Bank")
    page.locator(".onb-card").get_by_role("tab", name="11+", exact=True).click()
    page.locator(".onb-submit").click()
    page.wait_for_url(lambda u: "/welcome/call" in u, timeout=15000)
    page.locator(".call").wait_for(timeout=15000)


def wait_get_started(page, ctx, what):
    try:
        page.wait_for_url(lambda u: "/get-started" in u, timeout=20000)
        return True
    except Exception:
        ctx.check(False, f"{what}: never reached /get-started (at {page.url})")
        return False


def run(page, ctx):
    open_call(page, ctx)
    ctx.check(page.get_by_text("November 2026 · Eastern Time").count() == 1, "header 'November 2026 · Eastern Time'")
    days = page.locator(".call-day").all_inner_texts()
    ctx.check([" ".join(d.split()) for d in days] == ["Thu 12", "Fri 13", "Mon 16", "Tue 17", "Wed 18"], f"day row (got {days})")
    ctx.check(page.locator(".call button[disabled]").count() == 0, "no disabled buttons")
    book = page.locator(".call > button.ui-btn").first
    ctx.check(book.get_attribute("aria-disabled") == "true", "empty pick: aria-disabled=true")
    ctx.check(bool(book.get_attribute("aria-describedby")), "empty pick: aria-describedby hint")
    ctx.shoot("t1-3-pick")

    book.click(force=True)  # aria-disabled: Playwright treats it as not enabled
    ctx.check(page.get_by_role("alert").filter(has_text="Pick a time first").count() == 1, "empty pick shows inline message")

    page.locator(".call-day").nth(1).click()
    ctx.check(page.locator(".call-time").count() == 8, "8 time slots")
    page.locator(".call-time", has_text="10:00 AM").click()
    btn = page.get_by_role("button", name="Book Fri, Nov 13 at 10:00 AM")
    ctx.check(btn.count() == 1, "button names the slot")
    ctx.check(btn.get_attribute("aria-disabled") is None, "picked: not aria-disabled")
    page.wait_for_timeout(400)
    ctx.shoot("t1-3-picked")
    btn.click()

    heading = page.get_by_role("heading", name="You're booked")
    heading.wait_for(timeout=5000)
    ctx.check(page.locator(".call--booked svg.ill").count() == 1, "scene 25 in the booked card")
    ctx.check(page.locator('.call--booked[role="status"]').count() == 1, "booked state has role=status")
    focused = page.evaluate("() => document.activeElement && document.activeElement.tagName")
    ctx.check(focused == "H1", f"focus moved to the booked heading (got {focused})")
    ctx.shoot("t1-3-booked")

    title = page.locator(".onb-inter-title")
    try:
        title.wait_for(timeout=10000)
        ctx.check(title.inner_text().strip() == "Getting Harbor ready for your call", f"interstitial title (got {title.inner_text()!r})")
        ctx.check(page.locator(".onb-inter").get_by_text("Booking Fri, Nov 13 at 10:00 AM").count() == 1, "interstitial shows the booking line")
    except Exception:
        ctx.check(False, "interstitial 'Getting Harbor ready for your call' never shown")
    if wait_get_started(page, ctx, "after booking"):
        page.wait_for_timeout(800)
        ctx.shoot("t1-3-get-started-pending")

    # Book later: interstitial without the booking line.
    open_call(page, ctx)
    page.get_by_role("button", name="I'll book later").click()
    title = page.locator(".onb-inter-title")
    try:
        title.wait_for(timeout=10000)
        ctx.check("Getting" not in title.inner_text(), f"later: not the 'Getting ... ready' title (got {title.inner_text()!r})")
        ctx.check(page.locator(".onb-inter").get_by_text("Booking", exact=False).count() == 0, "later: no booking line")
        ctx.shoot("t1-3-interstitial-later")
    except Exception:
        ctx.check(False, "later: interstitial never shown")
    wait_get_started(page, ctx, "after book later")

    ctx.visit("/emails")
    ctx.check(page.get_by_text("Call booked").count() >= 1, "/emails lists 'Call booked'")
