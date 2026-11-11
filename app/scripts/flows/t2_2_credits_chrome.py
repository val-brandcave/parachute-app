"""T2.2 header credits pill, popover and sidebar resource links.

numbers_agree (RF3): pill number = sidebar Balance number = /configure/billing hero number.
Popover, sidebar and route checks run for every persona; layout checks only at desktop width.
"""

import re

PERSONAS = ["trial-admin", "payg-admin-low", "approver", "pending-admin", "reviewer", "returning"]
AGREE = {"trial-admin", "payg-admin-low", "approver", "pending-admin"}


def num(text):
    m = re.search(r"\d+", text or "")
    return int(m.group()) if m else None


def pill_text(page):
    return " ".join(page.locator(".credits-pill").first.inner_text().split())


def popover(page):
    return page.locator(".credits-pop")


def open_pill(page):
    page.locator(".credits-pill").first.click()
    page.wait_for_timeout(500)


def numbers_agree(page, ctx):
    pill = pill_text(page)
    low = pill.lower()
    ctx.check("trial" not in low and "review" not in low and "$" not in pill, f"pill text is credits only ({pill!r})")
    sb = page.locator(".sb-balance")
    bal = " ".join(sb.first.inner_text().split()) if sb.count() else None
    pn = num(pill)
    if ctx.persona == "pending-admin":
        ctx.check(pill == "Credits after your call", f"held pill label ({pill!r})")
        ctx.check(bal is not None and "On hold" in bal, f"held sidebar Balance says On hold ({bal!r})")
    else:
        ctx.check(bal is not None and num(bal) == pn, f"pill {pn} = sidebar Balance ({bal!r})")
    # popover big number = pill number (held has no number: its title is the check)
    open_pill(page)
    big = page.locator(".credits-pop .cp-big b")
    if ctx.persona == "pending-admin":
        ctx.check("Credits after your call" in popover(page).inner_text(), "held popover title matches pill")
    else:
        ctx.check(big.count() == 1 and num(big.first.inner_text()) == pn, f"popover number {big.first.inner_text() if big.count() else None!r} = pill {pn}")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    ctx.visit("/configure/billing")
    hero = page.locator(".bl-big-n")
    if ctx.persona == "pending-admin":
        # Held: Billing swaps the hero number for the waiting-for-approval state.
        ctx.check(hero.count() == 0 and "waiting for approval" in page.inner_text("body"), "held state on billing in place of a hero number")
    else:
        ctx.check(hero.count() == 1, f"billing hero exists (count {hero.count()})")
        hn = num(hero.first.inner_text()) if hero.count() else None
        ctx.check(hn == pn, f"pill {pn} = billing hero {hn}")
    ctx.visit("/dashboard")


def run(page, ctx):
    ctx.visit("/dashboard")
    ctx.check(page.locator(".credits-pill").count() == 1, "one header credits pill")
    ctx.check(page.locator("button[disabled].credits-pill").count() == 0, "pill never disabled")
    desktop = ctx.width >= 1000
    if not desktop:
        # Desktop-first: the shell is not responsive yet, so narrow width only checks routes.
        for route in ("/trust", "/learn"):
            resp = ctx.visit(route)
            ctx.check(resp is not None and resp.status == 200, f"{route} returns 200")
        return

    if ctx.persona in AGREE:
        numbers_agree(page, ctx)

    pill = pill_text(page)
    if ctx.persona == "returning":
        ctx.check(re.fullmatch(r"\d+ credits? used", pill) is not None, f"invoiced pill is a used state ({pill!r})")
        ctx.check(page.locator(".sb-balance").count() == 0, "sidebar Balance absent when invoiced")

    # open: click, then Esc returns focus
    open_pill(page)
    pop = popover(page)
    ctx.check(pop.count() == 1, "popover opens on click")
    z = page.evaluate("() => { const e=document.querySelector('.credits-pop'); return e? getComputedStyle(e.parentElement).zIndex + '/' + getComputedStyle(e).zIndex : '' }")
    ctx.check("200" in z, f"popover z-index 200 ({z})")
    top = page.evaluate("""() => { const p=document.querySelector('.credits-pop'); if(!p) return false; const r=p.getBoundingClientRect();
      const el=document.elementFromPoint(r.left+r.width/2, r.top+20); return !!el && p.contains(el) }""")
    ctx.check(top, "popover is topmost at its top edge")
    ctx.shoot("t2-2-popover")
    text = pop.inner_text() if pop.count() else ""

    p = ctx.persona
    if p == "trial-admin":
        ctx.check("Full review" in text and "Add credits" in text and "View usage" in text, "healthy popover rows and buttons")
        ctx.check("Trial credits" in text and "never expire" in text, "trial sub-line")
    if p == "payg-admin-low":
        ctx.check("Running low" in text, "low persona shows Running low")
    if p == "pending-admin":
        ctx.check("Credits after your call" in text, "held popover title")
        ctx.check(pop.locator("svg").count() >= 2, "held popover has hourglass + spot illustration")
    if p in ("reviewer", "approver"):
        ctx.check(re.search(r"Ask \w+ for more credits", text) is not None, f"non-admin asks the admin ({text[:80]!r})")
        ctx.check("Add credits" not in text, "non-admin has no Add credits")
    if p == "returning":
        ctx.check(re.search(r"so far\s+\d+ credits? used", text) is not None, f"invoiced: month line, then used ({text[:60]!r})")
        ctx.check("Next statement" in text or "You used" in text, "invoiced second line")

    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    ctx.check(popover(page).count() == 0, "Esc closes")
    ctx.check(page.evaluate("() => document.activeElement === document.querySelector('.credits-pill')"), "Esc returns focus to the pill")

    # Enter opens
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    ctx.check(popover(page).count() == 1, "Enter opens")

    # page scroll closes
    page.evaluate("() => document.dispatchEvent(new Event('scroll'))")
    page.evaluate("() => window.dispatchEvent(new Event('scroll'))")
    page.wait_for_timeout(300)
    ctx.check(popover(page).count() == 0, "closes on page scroll")

    # Add credits navigates (admins)
    if p in ("trial-admin", "payg-admin-low"):
        open_pill(page)
        page.locator(".credits-pop").get_by_role("button", name="Add credits").click()
        page.wait_for_timeout(1200)
        # Phase 3: Add credits lands on the focused checkout with the default pack and a return path.
        ctx.check("/checkout/credits" in page.url and "pack=pack10" in page.url and "return=" in page.url,
                  f"Add credits goes to checkout ({page.url})")
        ctx.visit("/dashboard")

    # sidebar rows
    if desktop:
        rows = page.locator(".sb-res a")
        ctx.check(rows.count() == 2, "two resource rows")
        if rows.count() == 2:
            ctx.check(rows.nth(0).inner_text().strip() == "Trust Center" and rows.nth(1).inner_text().strip() == "Learning Center", "row labels")
            ctx.check(rows.nth(0).get_attribute("href") == "/trust" and rows.nth(1).get_attribute("href") == "/learn", "row hrefs")
            sz = page.evaluate("() => [...document.querySelectorAll('.sb-res a svg')].map(s => Math.round(s.getBoundingClientRect().width))")
            ctx.check(sz == [19, 19], f"19 px icons ({sz})")
            above = page.evaluate("""() => { const r=document.querySelector('.sb-res'); const b=document.querySelector('.sb-balance');
              return !b || r.getBoundingClientRect().bottom <= b.getBoundingClientRect().top }""")
            ctx.check(above, "rows sit above Balance")
            col = page.evaluate("""() => { const a=document.querySelector('.sb-res a svg').getBoundingClientRect().left;
              const n=document.querySelector('nav a[href="/dashboard"] svg'); return n ? Math.abs(a-n.getBoundingClientRect().left) : 0 }""")
            ctx.check(col <= 1.5, f"icons sit in the nav icon column (delta {col})")
        ctx.shoot("t2-2-sidebar")
        page.get_by_role("button", name="Collapse navigation").click()
        page.wait_for_timeout(600)
        ctx.check(page.locator(".sb-res a span.truncate").count() == 0, "collapsed rail shows icons only")
        page.locator(".sb-res a").first.hover()
        page.wait_for_timeout(500)
        tip = page.get_by_role("tooltip")
        ctx.check(tip.count() >= 1 and "Trust Center" in " ".join(tip.all_inner_texts()), "collapsed row shows a Trust Center tooltip")
        ctx.shoot("t2-2-collapsed")
        page.get_by_role("button", name="Expand navigation").click()
        page.wait_for_timeout(400)

    # routes
    for route in ("/trust", "/learn"):
        resp = ctx.visit(route)
        ctx.check(resp is not None and resp.status == 200, f"{route} returns 200")
    ctx.shoot("t2-2-learn")
