"""T1.1 onboarding frame (spec §5.1 option C): org setup with live routing, the
2-segment progress bar, the per-step side panel, the invite and call steps
inside the same card, and the "Setting up your workspace" interstitial.
Motion is off under Playwright, so nothing here waits on animation."""

PERSONAS = ["prospect"]

CARD = ".onb-card"
PANEL_TITLE = ".onb-panel-title"
SUBMIT = ".onb-submit"


def text_of(page, sel):
    loc = page.locator(sel)
    return loc.first.inner_text().strip() if loc.count() else ""


def no_sample(page, ctx, where):
    body = page.locator(".onb").first.inner_text().lower() if page.locator(".onb").count() else ""
    ctx.check("sample" not in body, f"{where}: no 'sample' text")


def no_disabled(page, ctx, where):
    n = page.locator(f"{CARD} button[disabled]").count()
    ctx.check(n == 0, f"{where}: no button[disabled] in the card (found {n})")


def pick(page, name):
    page.locator(CARD).get_by_role("tab", name=name, exact=True).click()
    page.wait_for_timeout(150)


def wait_url(page, ctx, part, what, timeout=15000):
    try:
        page.wait_for_url(lambda u: part in u, timeout=timeout)
        return True
    except Exception:
        ctx.check(False, f"{what}: never reached {part} (at {page.url})")
        return False


def interstitial(page, ctx, lines, title_part):
    status = page.locator('.onb-inter [role="status"]')
    try:
        status.wait_for(timeout=5000)
    except Exception:
        ctx.check(False, "interstitial role=status shown")
        return
    n = status.locator("li").count()
    ctx.check(n == lines, f"interstitial has {lines} lines (got {n})")
    title = text_of(page, ".onb-inter-title")
    ctx.check(title_part in title, f"interstitial title contains {title_part!r} (got {title!r})")
    body = page.locator(".onb-inter").first.inner_text().lower()
    ctx.check("sample" not in body, "interstitial: no 'sample' text")
    ctx.shoot("t1-1-interstitial-" + ("self" if lines == 3 else "ent"))


def run(page, ctx):
    # ---------------------------------------------------------- org setup
    ctx.visit("/welcome")
    page.locator(CARD).wait_for(timeout=15000)
    ctx.check(text_of(page, PANEL_TITLE) == "What Parachute checks", "setup panel title 'What Parachute checks'")
    ctx.check(page.locator('[aria-label="Step 1 of 2"]').count() == 1, "progress 'Step 1 of 2'")
    ctx.shoot("t1-1-welcome")
    no_sample(page, ctx, "org setup")

    # Empty name: inline error, focus on the field, nothing disabled.
    page.fill("#wel-org", "")
    page.locator(SUBMIT).click()
    page.wait_for_timeout(300)
    ctx.check(page.locator(".onb-field-err").count() == 1, "empty name shows inline error")
    focused = page.evaluate("() => document.activeElement && document.activeElement.id")
    ctx.check(focused == "wel-org", f"focus on the name field (got {focused!r})")
    ctx.check("/welcome" == page.url.split("?")[0][-8:], "still on /welcome after empty submit")
    no_disabled(page, ctx, "org setup")
    ctx.shoot("t1-1-welcome-empty-name")
    page.fill("#wel-org", "Harbor Community Bank")

    # Enterprise threshold flips live, without submitting.
    pick(page, "11+")
    callout = page.get_by_text("Teams your size start with a short call")
    ctx.check(callout.count() == 1 and callout.first.is_visible(), "enterprise callout appears at 11+")
    ctx.check("Book a call" in text_of(page, SUBMIT), "button reads 'Book a call'")
    ctx.check(page.url.split("?")[0].endswith("/welcome"), "threshold flip does not submit")
    ctx.check(page.locator(".onb-q.is-trigger").count() == 1, "triggering answer marked")
    ctx.shoot("t1-1-welcome-enterprise")
    pick(page, "2–10")
    try:
        page.get_by_text("Teams your size start with a short call").wait_for(state="detached", timeout=3000)
        gone = True
    except Exception:
        gone = False
    ctx.check(gone, "callout gone after switching back to 2–10")
    ctx.check(page.locator(".onb-q.is-trigger").count() == 0, "no triggering-answer marker at 2–10")
    ctx.check("Continue to Parachute" in text_of(page, SUBMIT), "button reads 'Continue to Parachute'")

    # "I'm not sure yet": self-serve with the later-call line.
    pick(page, "I'm not sure yet")
    ctx.check(page.get_by_text("We'll offer a call later if you need one.").count() == 1, "unsure note shown")
    ctx.check("Continue to Parachute" in text_of(page, SUBMIT), "unsure stays self-serve")
    pick(page, "Under 50")

    # ------------------------------------------------------- self-serve
    bank = page.locator(CARD).get_by_role("tab", name="Bank or lender", exact=True)
    ctx.check(bank.get_attribute("aria-selected") == "true", "Bank or lender selected before submit")
    page.locator(SUBMIT).click()
    if wait_url(page, ctx, "/welcome/invite", "self-serve submit"):
        ctx.settle(600)
        ctx.check(page.locator('[aria-label="Step 2 of 2"]').count() == 1, "progress 'Step 2 of 2' on invite")
        ctx.check(text_of(page, PANEL_TITLE) == "What your team gets", "invite panel title 'What your team gets'")
        no_sample(page, ctx, "invite")
        no_disabled(page, ctx, "invite")
        ctx.shoot("t1-1-invite")
        skip = page.locator(CARD).get_by_role("button", name="Skip for now")
        if ctx.check(skip.count() >= 1, "invite has 'Skip for now'"):
            skip.first.click()
            interstitial(page, ctx, 3, "Setting up")
            wait_url(page, ctx, "/get-started", "self-serve interstitial")

    # ------------------------------------------------------- enterprise
    ctx.visit("/welcome")
    page.locator(CARD).wait_for(timeout=15000)
    pick(page, "11+")
    page.locator(SUBMIT).click()
    if wait_url(page, ctx, "/welcome/call", "enterprise submit"):
        ctx.settle(600)
        ctx.check(page.locator('[aria-label="Step 2 of 2"]').count() == 1, "progress 'Step 2 of 2' on call")
        ctx.check(text_of(page, PANEL_TITLE) == "What happens next", "call panel title 'What happens next'")
        no_sample(page, ctx, "call")
        no_disabled(page, ctx, "call")
        ctx.shoot("t1-1-call")
        later = page.locator(CARD).get_by_role("button", name="I'll book later")
        if ctx.check(later.count() >= 1, "call has 'I'll book later'"):
            later.first.click()
            interstitial(page, ctx, 2, "Setting up")
            wait_url(page, ctx, "/get-started", "enterprise interstitial")
