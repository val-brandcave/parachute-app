"""T1.2 invite rows. Mounts InviteStep at /welcome/invite; falls back to the
temporary harness /t12-harness while T1.1's page is not rendering it."""

PERSONAS = ["trial-admin"]
EMAILS = ["p%d@harborcb.com" % i for i in range(1, 13)]


def run(page, ctx):
    route = "/welcome/invite"
    ctx.visit(route)
    ctx.check(page.locator(".invite-step").count() == 1, f"InviteStep renders at {route}")

    inputs = page.locator(".invite-row input[type=email]")
    send = page.locator(".invite-actions .ui-btn--primary")
    ctx.check(inputs.count() == 3, "3 rows to start")
    ctx.check(page.evaluate("() => document.activeElement === document.querySelector('.invite-row input')"), "first row focused")
    ctx.check(page.locator(".rolesel").count() == 3 and all("Reviewer" in t for t in page.locator(".rolesel").all_inner_texts()), "role Reviewer on each")
    ctx.check(" ".join(send.inner_text().split()) == "Send invites", "button 'Send invites'")
    ctx.check(page.locator("button[disabled]").count() == 0, "no disabled buttons")
    ctx.shoot("t1-2-default")

    # empty send
    send.click()
    ctx.check(page.get_by_text("Add at least one work email, or skip for now").count() == 1, "empty send error under row 1")
    ctx.shoot("t1-2-empty")

    # one email -> "Send 1 invite"
    inputs.nth(0).fill("new.one@harborcb.com")
    ctx.check(" ".join(send.inner_text().split()) == "Send 1 invite", f"label Send 1 invite (got {send.inner_text()!r})")

    # RoleSelect keyboard
    rs = page.locator(".rolesel").nth(0)
    ctx.check(rs.get_attribute("aria-expanded") == "false", "aria-expanded false at rest")
    rs.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    ctx.check(rs.get_attribute("aria-expanded") == "true", "Enter opens listbox")
    ctx.check(page.get_by_role("listbox").count() == 1, "listbox rendered")
    top = page.evaluate("""() => { const l=document.querySelector('[role=listbox]'); const r=l.getBoundingClientRect();
      const el=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return !!el && l.contains(el) }""")
    ctx.check(top, "open listbox is topmost at its centre")
    ctx.shoot("t1-2-role-open")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    ctx.check(rs.get_attribute("aria-expanded") == "false", "Enter on option closes")
    ctx.check("Approver" in rs.inner_text(), "arrow + Enter picked Approver")
    rs.focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(300)
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    ctx.check(rs.get_attribute("aria-expanded") == "false", "Esc closes")
    ctx.check(page.evaluate("() => document.activeElement === document.querySelector('.rolesel')"), "focus returns to trigger after Esc")

    # row errors
    inputs.nth(1).fill("nope")
    inputs.nth(2).fill("someone@gmail.com")
    send.click()
    page.wait_for_timeout(900)
    ctx.check(page.get_by_text("Enter a work email").count() >= 1, "invalid error shown")
    ctx.check(page.get_by_text("Use a harborcb.com address").count() >= 1, "wrong domain error shown")
    ctx.check(page.locator(".invite-row input[type=email]").count() >= 2, "rows stay on error")
    ctx.shoot("t1-2-row-errors")

    # paste 12 into a fresh page so the row count is exact
    ctx.visit(route)
    page.get_by_role("button", name="Paste a list").click()
    page.locator("textarea[aria-label='Paste a list of emails']").fill("\n".join(EMAILS) + "\n" + EMAILS[0])
    page.get_by_role("button", name="Add to list").click()
    page.wait_for_timeout(500)
    n = page.locator(".invite-row input[type=email]").count()
    ctx.check(n == 12, f"exactly 12 rows after paste (got {n})")
    ctx.check(page.get_by_text("12 people", exact=True).count() == 1, "'12 people' shown")
    ctx.check(page.get_by_text("duplicate", exact=False).count() >= 1, "duplicate note")
    ctx.check(page.get_by_text("Set all to").count() == 1, "'Set all to' visible")
    ctx.check(page.get_by_text("Inviting a bigger team?").count() == 1, "bigger-team callout past 10 rows")
    scroll = page.evaluate("() => { const l=document.querySelector('.invite-list'); return l.scrollHeight > l.clientHeight }")
    ctx.check(scroll, "list scrolls inside the card")
    ctx.shoot("t1-2-twelve")

    # a paste event into a row
    page.evaluate("""() => { const el=document.querySelector('.invite-row input'); el.focus();
      const dt=new DataTransfer(); dt.setData('text/plain','x1@harborcb.com, x2@harborcb.com');
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true})); }""")
    page.wait_for_timeout(400)
    ctx.check(page.locator(".invite-row input[value='x1@harborcb.com']").count() + sum(
        1 for v in page.locator(".invite-row input[type=email]").evaluate_all("els=>els.map(e=>e.value)") if v == "x1@harborcb.com") >= 1,
        "paste event fills rows")

    # Set all to: Approver
    page.locator(".invite-setall .rolesel").click()
    page.get_by_role("option", name="Approver").click()
    page.wait_for_timeout(300)
    roles = page.locator(".invite-row .rolesel").all_inner_texts()
    ctx.check(len(roles) >= 12 and all("Approver" in t for t in roles), "Set all to Approver applies to every row")

    # Send still works past 10 rows (12 rows, none sent yet)
    page.locator(".invite-actions .ui-btn--primary").click()
    page.wait_for_timeout(2500)
    ctx.check(page.get_by_text("invites sent").count() >= 1 or "/get-started" in page.url or page.locator(".invite-row").count() == 0, "send works with 12 rows")

    # clean slate: remove all rows down to a fresh set via reload
    ctx.visit(route)
    inputs = page.locator(".invite-row input[type=email]")
    send = page.locator(".invite-actions .ui-btn--primary")
    inputs.nth(0).fill("mixed.rev@harborcb.com")
    inputs.nth(1).fill("mixed.app@harborcb.com")
    inputs.nth(2).fill("dana.reyes@harborcb.com")
    for idx, name in ((1, "Approver"),):
        page.locator(".rolesel").nth(idx).click()
        page.get_by_role("option", name=name).click()
        page.wait_for_timeout(250)
    send.click()
    page.wait_for_timeout(1800)
    ctx.shoot("t1-2-partial")
    ctx.check(page.get_by_text("Already in Harbor Community Bank").count() == 1, "already-member row stays with reason")
    ctx.check(page.get_by_text("2 invites sent · 1 already a member").count() == 1, "summary text")
    ctx.check(send.inner_text().strip() == "Continue", "primary becomes Continue")
    ctx.check(page.get_by_role("button", name="Skip for now").count() == 0, "Skip hidden")
    ctx.check(page.locator(".invite-row input[type=email]").count() == 1, "only the failed row remains")

    # mixed roles landed in one send: check Bouncer
    ctx.visit("/bouncer")
    page.get_by_text("Pending invites").first.click()
    page.wait_for_timeout(600)
    body = page.inner_text("body")
    ctx.check("mixed.rev@harborcb.com" in body and "mixed.app@harborcb.com" in body, "invites visible in Bouncer")
    ctx.check(body.count("Approver") >= 1 and body.count("Reviewer") >= 1, "mixed roles in one send (Reviewer + Approver pending)")
    ctx.shoot("t1-2-bouncer")
