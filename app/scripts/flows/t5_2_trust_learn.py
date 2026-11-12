"""T5.2 Trust Center and Learning Center (spec 5.10, 5.11).

Desktop width runs every behaviour check; narrow width only checks the routes render.
"""

import re

PERSONAS = ["trial-admin", "reviewer"]
ROUTES = ["/trust", "/learn"]

DOCS = [
    "SOC 2 Type II report",
    "Security overview",
    "Data processing agreement",
    "Penetration test summary",
    "Subprocessors",
    "Vendor questionnaire",
]

EXTRA = {"How a review works", "Mapping a checklist"}

GROUPS = {
    "Getting set up": [("Create your organization", "2:40"), ("Invite your team", "1:55"), ("Upload your bank policy", "3:30"), ("Choose review defaults", "5:10")],
    "Running a review": [("Start your first review", "3:15"), ("Technical vs Administrative", "4:20"), ("Sending a report from YouConnect", "5:05"), ("What credits a review uses", "2:10")],
    "Working with findings": [("Writing a finding with a citation", "4:45"), ("Using the response library", "3:50"), ("Returning a report to the appraiser", "4:30")],
    "Your workbook": [("Reading the workbook", "6:30"), ("Editing blocks inline", "4:15"), ("Signing and exporting", "4:05")],
    "Admin": [("Buying credits and auto-reload", "3:40"), ("Reading usage by person", "2:55"), ("Custom workbook layouts", "6:10"), ("Sending the security pack to IT", "3:05")],
}


def team_progress(page):
    m = re.search(r"Bring your team.{0,200}?(\d of 2)", page.inner_text("body"), re.S)
    return m.group(1) if m else None


def reviewer_trust(page, ctx):
    ctx.visit("/trust")
    btn = page.get_by_role("button", name="Send to IT")
    ctx.check(btn.get_attribute("aria-disabled") == "true" and btn.get_attribute("disabled") is None, "non-admin Send to IT is aria-disabled, not disabled")
    why = btn.get_attribute("aria-describedby")
    ctx.check(bool(why) and "Only an org admin" in page.locator(f"#{why}").inner_text(), "non-admin Send to IT has a visible reason")
    btn.click(force=True)  # aria-disabled is not `disabled`: the click must go through and explain
    page.wait_for_timeout(500)
    ctx.check(page.get_by_text("Only an org admin can send this").count() >= 1 and page.get_by_role("dialog").count() == 0, "click explains and opens no dialog")
    ctx.check(page.locator("[disabled]").count() == 0, "no disabled attribute on /trust")
    ctx.shoot("t5-2-trust-nonadmin")


def trust(page, ctx):
    ctx.visit("/trust")
    ctx.check(page.locator(".tc-hero-art svg").count() == 1, "hero has the trust-center scene")
    w = page.evaluate("() => Math.round(document.querySelector('.tc-hero-art svg').getBoundingClientRect().width)")
    ctx.check(w == 420, f"hero scene is 420 px wide ({w})")
    titles = [t.replace("Placeholder", "").strip() for t in page.locator(".tc-doc-title").all_inner_texts()]
    ctx.check(titles[:6] == DOCS, f"six documents first ({titles[:6]})")
    ctx.check(len(titles) == 8, f"eight documents ({len(titles)})")
    chips = page.locator(".tc-doc .tc-doc-title .ui-chip", has_text="Placeholder").count()
    ctx.check(chips == 8, f"every document row carries a Placeholder chip ({chips})")
    ctx.check(page.locator("button[disabled]").count() == 0 and page.locator("[disabled]").count() == 0, "no disabled attribute on /trust")
    hosting = page.locator(".tc-fact", has_text="Hosting").locator("dd")
    ctx.check(" ".join(hosting.inner_text().split()) == "Placeholder", f"Hosting shows only Placeholder ({hosting.inner_text()!r})")
    uptime = page.locator(".tc-fact", has_text="Uptime").inner_text()
    ctx.check("99.98%" in uptime and "Placeholder" in uptime, "uptime figure carries a Placeholder chip")
    ctx.check("Placeholder" in page.locator(".tc-contact").inner_text(), "contact line carries a Placeholder chip")
    enc = page.locator(".tc-fact", has_text="Encryption").inner_text()
    ctx.check("Placeholder" not in enc, "confirmed fact has no chip")
    ctx.check(page.get_by_role("button", name="Send to IT").count() == 1 and page.get_by_role("button", name="Copy link").count() == 1, "Send to IT and Copy link")
    ctx.shoot("t5-2-trust")

    # Request access opens a form
    page.get_by_role("button", name="Request access: SOC 2 Type II report").click()
    page.wait_for_timeout(600)
    dlg = page.get_by_role("dialog")
    ctx.check(dlg.count() == 1 and dlg.get_by_label("Work email").count() == 1, "Request access opens a form with Work email")
    ctx.shoot("t5-2-request")
    dlg.get_by_label("Your name").fill("Sam IT")
    dlg.get_by_label("Work email").fill("sam@harborbank.example")
    dlg.get_by_role("button", name="Send request").click()
    page.wait_for_timeout(500)
    ctx.check("Request sent" in page.get_by_role("dialog").inner_text(), "request form confirms")
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)
    ctx.check(page.get_by_role("dialog").count() == 0, "Esc closes the dialog")

    # Send to IT completes security_pack
    ctx.visit("/get-started")
    before = team_progress(page)
    ctx.check(before == "1 of 2", f"team section is 1 of 2 before sending ({before!r})")
    ctx.visit("/trust")
    page.get_by_role("button", name="Send to IT").click()
    page.wait_for_timeout(600)
    dlg = page.get_by_role("dialog")
    ctx.check(dlg.count() == 1, "Send to IT opens a dialog")
    ctx.shoot("t5-2-send")
    dlg.get_by_label("IT or vendor-risk contact").fill("it-vendor@harborbank.example")
    dlg.get_by_role("button", name="Send", exact=True).click()
    page.wait_for_timeout(1200)
    ctx.check("Sent to it-vendor@harborbank.example" in page.get_by_role("dialog").inner_text(), "dialog confirms the send")
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)
    ctx.check("Sent to it-vendor@harborbank.example" in page.locator(".tc-hero-text").inner_text(), "sent line stays on the page")
    ctx.visit("/get-started")
    ctx.shoot("t5-2-get-started")
    after = team_progress(page)
    ctx.check(after == "2 of 2", f"Get started shows security_pack done: team 2 of 2 ({after!r})")

    # public view
    ctx.visit("/shared/trust/harbor-it-review")
    body = page.inner_text("body")
    ctx.check("Shared by Dana Reyes, Harbor Community Bank" in body, "public view names the sharer")
    ctx.check(page.locator("aside:not(.tc-card), nav, header, .credits-pill").count() == 0 and page.locator('a[href="/learn"], a[href="/dashboard"]').count() == 0, "public view renders without the shell (no sidebar, nav or header)")
    ctx.check(page.get_by_role("button", name="Send to IT").count() == 0, "public view has no Send to IT")
    ctx.check(page.locator(".tc-doc").count() == 8, "public view lists the documents")
    ctx.shoot("t5-2-shared")
    ctx.visit("/shared/trust/expired")
    ctx.check("This link has expired" in page.inner_text("body"), "expired token shows the expired state")

    # redirect
    ctx.visit("/configure/security")
    ctx.check(page.url.rstrip("/").endswith("/trust"), f"/configure/security redirects to /trust ({page.url})")
    ctx.visit("/configure")
    ctx.check(page.locator('a[href="/trust"].cfg-card').count() == 1, "Configure card points at the Trust Center")


def learn(page, ctx):
    ctx.visit("/learn")
    ctx.check(page.locator(".lc-hero-art svg").count() == 1, "learn hero has the scene")
    heads = [h.strip() for h in page.locator(".lc-h2").all_inner_texts()]
    expect = list(GROUPS) + ["PDF guides", "Page tours"]
    ctx.check(heads == expect, f"groups in order ({heads})")
    for g, vids in GROUPS.items():
        sec = page.locator(".lc-sec", has=page.get_by_role("heading", name=g, exact=True))
        got = [(c.locator(".lc-title").inner_text().strip(), c.locator(".lc-dur").inner_text().strip()) for c in sec.locator(".lc-card").all()]
        # The catalog also carries two videos spec 5.11 omits (How a review works, Mapping a checklist): ignore them here.
        got = [x for x in got if x[0] not in EXTRA]
        ctx.check(got == vids, f"{g}: titles and durations ({got})")
    guides = [t.strip() for t in page.locator(".lc-sec", has=page.get_by_role("heading", name="PDF guides")).locator(".lc-row-title").all_inner_texts()]
    ctx.check(guides == ["Reviewer quick-start", "Admin guide: setup, credits and billing", "Review checklist reference"], f"PDF guides ({guides})")
    ctx.check(page.get_by_text("Continue where you left off").count() == 0, "no Continue section when nothing is in progress")
    ctx.check(page.locator("[disabled]").count() == 0, "no disabled attribute on /learn")
    chk = page.locator(".lc-row", has_text="Review checklist reference")
    ctx.check("Placeholder" in chk.inner_text(), "checklist reference guide has a Placeholder chip")
    ctx.shoot("t5-2-learn")

    # search
    box = page.get_by_label("Search videos and guides")
    box.fill("sign")
    page.wait_for_timeout(300)
    titles = [t.strip() for t in page.locator(".lc-card .lc-title").all_inner_texts()]
    ctx.check("Signing and exporting" in titles and "Create your organization" not in titles, f"search 'sign' filters ({titles})")
    box.fill("admin")
    page.wait_for_timeout(300)
    titles = [t.strip() for t in page.locator(".lc-card .lc-title").all_inner_texts()]
    ctx.check("Buying credits and auto-reload" in titles and "Create your organization" not in titles, f"search matches a group title ({titles})")
    box.fill("zzzzqq")
    page.wait_for_timeout(300)
    ctx.check(page.locator(".el").count() == 1 and page.locator(".lc-card").count() == 0, "no match shows an EmptyLine")
    ctx.shoot("t5-2-learn-empty")
    page.get_by_role("button", name="Clear search").click()
    page.wait_for_timeout(300)
    ctx.check(box.input_value() == "" and page.locator(".lc-card").count() == 20, "Clear search restores the list")

    # progress, resume, keyboard
    page.locator('[data-video="signing-exporting"]').first.click()
    page.wait_for_timeout(800)
    ctx.check(page.get_by_role("dialog").count() == 1 and page.locator(".hc-player").count() == 1, "card opens the player")
    ctx.shoot("t5-2-player")
    page.wait_for_function("() => { const v = document.querySelector('.hc-video'); return v && v.currentTime > 1 }", timeout=20000)
    pause = page.locator('.hc-ctrls button[aria-label="Pause"]')
    pause.focus()
    page.keyboard.press("Space")
    page.wait_for_timeout(300)
    ctx.check(page.evaluate("() => document.querySelector('.hc-video').paused"), "Space on the focused control pauses")
    play = page.locator('.hc-ctrls button[aria-label="Play"]')
    play.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    ctx.check(not page.evaluate("() => document.querySelector('.hc-video').paused"), "Enter on the focused control plays")
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)
    ctx.check(page.get_by_text("Continue where you left off").count() == 1, "Continue where you left off shows while in progress")
    card = page.locator('[data-video="signing-exporting"]').first
    ctx.check("% watched" in card.inner_text(), f"card shows partial progress ({card.inner_text()!r})")
    page.reload(wait_until="domcontentloaded")
    ctx.settle()
    ctx.check(page.get_by_text("Continue where you left off").count() == 1, "progress persists after reload")
    # resume: opening from Continue picks up where it stopped
    page.locator('[data-video="signing-exporting"]').first.click()
    page.wait_for_timeout(1500)
    t = page.evaluate("() => document.querySelector('.hc-video').currentTime")
    ctx.check(t > 0.5, f"resume starts past 0:00 ({t})")
    # finish it: Continue disappears, card is Watched
    page.evaluate("() => { const v = document.querySelector('.hc-video'); v.currentTime = Math.max(0, v.duration - 0.4); v.play(); }")
    page.wait_for_function("() => document.querySelector('.hc-video').ended", timeout=20000)
    page.keyboard.press("Escape")
    page.wait_for_timeout(600)
    ctx.check(page.get_by_text("Continue where you left off").count() == 0, "Continue hides once the video is done")
    ctx.check("Watched" in page.locator('[data-video="signing-exporting"]').first.inner_text(), "card shows Watched")
    page.reload(wait_until="domcontentloaded")
    ctx.settle()
    ctx.check("Watched" in page.locator('[data-video="signing-exporting"]').first.inner_text(), "watched persists after reload")

    # page tours: a link to <route>?tour=<id>; the tour card shows
    link = page.get_by_role("link", name="Run the Reviews tour")
    ctx.check(link.get_attribute("href") == "/reviews?tour=reviews", f"tour entry is a link ({link.get_attribute('href')})")
    link.click()
    page.wait_for_url("**/reviews**", timeout=15000)
    page.wait_for_timeout(1500)
    ctx.check("/reviews" in page.url, "Page tours lands on the tour's page")
    tip = page.locator(".tour-tip")
    ctx.check(tip.count() >= 1 and tip.first.is_visible(), "tour card is visible after landing")
    ctx.shoot("t5-2-tour")
    ctx.visit("/learn")
    fr = page.get_by_role("link", name="Run the Your first review tour")
    if fr.count():
        ctx.check((fr.get_attribute("href") or "").endswith("?tour=first-review") and "review-sample" not in fr.get_attribute("href"), "first-review tour links to an own review")


def run(page, ctx):
    if ctx.width < 1000:
        for route in ("/trust", "/learn", "/shared/trust/harbor-it-review"):
            resp = ctx.visit(route)
            ctx.check(resp is not None and resp.status == 200, f"{route} returns 200")
            ctx.shoot(route)
        return
    if ctx.persona == "reviewer":
        reviewer_trust(page, ctx)
        return
    trust(page, ctx)
    learn(page, ctx)
