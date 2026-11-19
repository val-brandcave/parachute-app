"""T4.2 Shell Start sites and the Reviews upload zone (spec 5.5, PC-37).

every_site_explains (RF5), persona pending-admin: each Start site has aria-disabled="true", no
  `disabled` attribute, an hourglass glyph (the collapsed sidebar rail has no room for one) and a
  click that opens the approval lock. The click must show T4.1's `.lock-dlg` dialog with its text (hard);
  Esc closes it and returns focus; Enter/Space reopen it; a drop on a locked zone explains and starts
  no run. The dev lock probe (`<html data-lock-kind>`) is a secondary signal.
trial_admin_works: the same controls are live; the Reviews upload zone opens Review setup in the
  RunModal takeover; the sidebar link and OrderButton go to /launchpad.
"""
import re

PERSONAS = ["pending-admin", "trial-admin"]
PDF = {"name": "Harbor appraisal.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4\n%mock\n"}
START = "Start a review"


def lock_kind(page):
    return page.evaluate("() => document.documentElement.dataset.lockKind || null")


DLG = '.lock-dlg[role="dialog"], [role="dialog"].lock-dlg'
APPROVAL = re.compile(r"setup call|confirmed", re.I)


def dialog_open(page):
    d = page.locator(DLG)
    try:
        d.first.wait_for(state="visible", timeout=2500)
    except Exception:
        return False
    return APPROVAL.search(d.first.inner_text()) is not None


def dialog_gone(page):
    try:
        page.locator(DLG).first.wait_for(state="detached", timeout=2500)
        return True
    except Exception:
        return page.locator(DLG).count() == 0 or not page.locator(DLG).first.is_visible()


def close_with_esc(ctx, page, name, el=None):
    page.keyboard.press("Escape")
    ctx.check(dialog_gone(page), f"{name}: Esc closes the dialog")
    if el is not None:
        page.wait_for_timeout(300)
        ctx.check(el.evaluate("e => e === document.activeElement"), f"{name}: focus returns to the trigger")


def locked_ok(ctx, page, loc, name, glyph=True, shot=None, keys=("Enter", "Space"), restore=None):
    """aria-disabled, no disabled, hourglass, reason reachable; click -> approval dialog (hard),
    Esc -> gone + focus back; keyboard Enter / Space open it again. The probe is secondary."""
    n = loc.count()
    if not ctx.check(n >= 1, f"{name}: found ({n})"):
        return False
    el = loc.first
    ctx.check(el.get_attribute("aria-disabled") == "true", f"{name}: aria-disabled=true")
    ctx.check(el.get_attribute("disabled") is None, f"{name}: no disabled attribute")
    if glyph:
        ctx.check(el.locator(".tabler-icon-hourglass-high").count() >= 1, f"{name}: hourglass glyph")
    desc = el.get_attribute("aria-describedby")
    ok = bool(desc) and all(
        page.locator('[id="' + d + '"]').count() == 1 and page.locator('[id="' + d + '"]').inner_text().strip()
        for d in desc.split()
    )
    ctx.check(ok, f"{name}: aria-describedby resolves to a reason ({desc!r})")
    ctx.check(lock_kind(page) is None and not page.locator(DLG).count(), f"{name}: no lock open before the click")
    before = page.url
    el.click(force=True)  # Playwright treats aria-disabled as not actionable
    page.wait_for_timeout(400)
    ctx.check(page.url == before, f"{name}: click does not navigate")
    ctx.check(dialog_open(page), f"{name}: click shows the approval dialog with its text")
    ctx.check(lock_kind(page) == "approval", f"{name}: lock probe says approval (secondary)")
    ctx.check(page.locator('[role="region"] > ol > li').count() == 0, f"{name}: no toast")
    if shot:
        ctx.shoot(shot)
    close_with_esc(ctx, page, f"{name} (click)", el)
    for key in keys:
        el.focus()
        page.keyboard.press(key)
        page.wait_for_timeout(300)
        ctx.check(dialog_open(page), f"{name}: {key} opens the dialog")
        close_with_esc(ctx, page, f"{name} ({key})", el)
    return True


def palette_ok(ctx, page, idx, name, shot=None):
    """Palette rows: aria-disabled + hourglass + reason; click and Enter in the input both explain."""
    ctx.visit("/dashboard")
    page.keyboard.press("Control+k")
    page.wait_for_selector(".cmdk-item", timeout=5000)
    rows = page.locator(".cmdk-item").filter(has_text=re.compile(r"^\s*" + START))
    ctx.check(rows.count() == 2, f"{name}: palette lists two Start entries ({rows.count()})")
    if rows.count() != 2:
        return
    el = rows.nth(idx)
    ctx.check(el.get_attribute("aria-disabled") == "true", f"{name}: aria-disabled=true")
    ctx.check(el.get_attribute("disabled") is None, f"{name}: no disabled attribute")
    ctx.check(el.locator(".tabler-icon-hourglass-high").count() >= 1, f"{name}: hourglass glyph")
    desc = el.get_attribute("aria-describedby")
    ctx.check(bool(desc) and page.locator('[id="' + str(desc) + '"]').count() == 1, f"{name}: aria-describedby resolves ({desc!r})")
    el.click(force=True)
    page.wait_for_timeout(400)
    ctx.check(dialog_open(page), f"{name}: click shows the approval dialog with its text")
    ctx.check(lock_kind(page) == "approval", f"{name}: lock probe says approval (secondary)")
    if shot:
        ctx.shoot(shot)
    close_with_esc(ctx, page, f"{name} (click)")
    # Enter in the search input on the active row.
    ctx.visit("/dashboard")
    page.keyboard.press("Control+k")
    page.wait_for_selector(".cmdk-item", timeout=5000)
    page.locator(".cmdk input").fill(START)
    for _ in range(idx):
        page.keyboard.press("ArrowDown")
    page.keyboard.press("Enter")
    page.wait_for_timeout(400)
    ctx.check(dialog_open(page), f"{name}: Enter in the input shows the approval dialog")
    close_with_esc(ctx, page, f"{name} (Enter)")


def drop_while_locked(ctx, page, route, loc, name):
    """A file dropped on a locked zone explains and never starts a run."""
    ctx.visit(route)
    zone = page.locator(loc)
    if not ctx.check(zone.count() == 1, f"{name}: zone found"):
        return
    dt = page.evaluate_handle(
        "() => { const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1.4'], 'dropped.pdf', {type: 'application/pdf'})); return dt; }"
    )
    zone.dispatch_event("drop", {"dataTransfer": dt})
    page.wait_for_timeout(1200)  # longer than the 700 ms read beat
    ctx.check(dialog_open(page), f"{name}: drop opens the approval dialog")
    ctx.check(page.locator(".run").count() == 0, f"{name}: drop does not open Review setup")
    close_with_esc(ctx, page, f"{name} (drop)")


def start_buttons(page):
    return page.locator("button").filter(has_text=re.compile(r"^\s*" + START))


def every_site_explains(page, ctx):
    desktop = ctx.width >= 1000
    seen = []

    if desktop:
        ctx.visit("/dashboard")
        seen.append(locked_ok(ctx, page, page.locator('[aria-describedby="sb-start-reason"]'), "sidebar Start (expanded)", shot="t4-2-sidebar"))
        ctx.visit("/dashboard")
        seen.append(locked_ok(ctx, page, start_buttons(page), "dashboard first-run Start", shot="t4-2-dashboard"))

        for i, label in enumerate(["Go to", "Actions"]):
            palette_ok(ctx, page, i, f"palette Start ({label})", shot=f"t4-2-palette-{i}")
            seen.append(True)

        ctx.visit("/launchpad")
        crumb = page.locator(".ui-crumbs .crumb-lock")
        ctx.check(crumb.count() == 1 and re.search(r"setup call", crumb.inner_text()) is not None, "/launchpad breadcrumb shows the reason line")
        ctx.check(page.locator('.ui-crumbs [class*="chip"]').count() == 0, "/launchpad breadcrumb reason is not a chip")
        ctx.check("sample" not in page.locator("main").inner_text().lower(), "/launchpad: no sample copy")
        seen.append(locked_ok(ctx, page, page.locator(".intake-drop"), "Launchpad dropzone", shot="t4-2-launchpad"))

        ctx.visit("/launchpad")
        page.locator(".ih-toggle").get_by_text("From YouConnect").click()
        page.wait_for_timeout(600)
        seen.append(locked_ok(ctx, page, page.locator(".intake-yc-item"), "Launchpad YouConnect row", shot="t4-2-yc"))

        ctx.visit("/get-started")
        row = page.locator('.gs-row .ui-btn[aria-disabled="true"]').filter(has_text=re.compile("Upload", re.I))
        seen.append(locked_ok(ctx, page, row, "Get started Upload row", shot="t4-2-get-started"))

        ctx.visit("/configure/billing")
        seen.append(locked_ok(ctx, page, page.locator("button").filter(has_text=re.compile(r"^\s*Add credits")), "billing Add credits", shot="t4-2-billing"))

        ctx.visit("/reviews")
        seen.append(locked_ok(ctx, page, start_buttons(page), "Reviews OrderButton"))
    else:
        ctx.visit("/reviews")

    ctx.visit("/reviews")  # fresh load: the OrderButton dialog above may still be open
    seen.append(locked_ok(ctx, page, page.locator(".rq-zone"), "Reviews upload zone", shot="t4-2-reviews-zone"))
    ctx.check(page.locator("main button[disabled]").count() == 0, "/reviews: no button[disabled] in main")
    drop_while_locked(ctx, page, "/reviews", ".rq-zone", "Reviews upload zone")
    if desktop:
        drop_while_locked(ctx, page, "/launchpad", ".intake-drop", "Launchpad dropzone")

    if desktop:
        ctx.visit("/dashboard")
        page.get_by_role("button", name="Collapse navigation").click()
        page.wait_for_timeout(500)
        seen.append(locked_ok(ctx, page, page.locator('[aria-describedby="sb-start-reason"]'), "sidebar Start (collapsed)", glyph=False, shot="t4-2-sidebar-collapsed"))

    ctx.check(all(seen), "every pending-admin site was exercised")


def trial_admin_works(page, ctx):
    # trial-admin is mid-setup with reviews of its own, so the level-1 page needs an empty list.
    ctx.visit("/reviews")
    page.evaluate("() => localStorage.setItem('parachute:reviews', '[]')")
    ctx.visit("/reviews")
    zone = page.locator(".rq-zone")
    ctx.check(zone.count() == 1, f"/reviews level-1 upload zone present ({zone.count()})")
    if not zone.count():
        return
    ctx.check(zone.first.get_attribute("aria-disabled") is None, "trial: zone is not aria-disabled")
    ctx.check(zone.first.locator(".tabler-icon-hourglass-high").count() == 0, "trial: zone has no hourglass")
    ctx.shoot("t4-2-reviews-zone-open")
    page.locator(".rq-zone-wrap input[type=file]").set_input_files(PDF)
    page.wait_for_selector(".run .run-cf", timeout=15000)
    ctx.check(page.locator(".run .run-cf").count() == 1, "trial: upload zone opens Review setup in the RunModal")
    ctx.shoot("t4-2-review-setup")

    ctx.visit("/reviews")
    btn = start_buttons(page)
    ctx.check(btn.count() >= 1 and btn.first.get_attribute("aria-disabled") is None, "trial: OrderButton is live")
    btn.first.click()
    page.wait_for_url(lambda u: u.endswith("/launchpad"), timeout=8000)
    ctx.check(page.url.endswith("/launchpad"), "trial: OrderButton goes to /launchpad")
    ctx.check(page.locator(".ui-crumbs .crumb-lock").count() == 0, "trial: no breadcrumb reason line")
    drop = page.locator(".intake-drop")
    ctx.check(drop.count() == 1 and drop.first.get_attribute("aria-disabled") is None, "trial: dropzone is live")
    page.locator(".intake-drop input[type=file]").set_input_files(PDF)
    page.wait_for_selector(".run .run-cf", timeout=15000)
    ctx.check(page.locator(".run .run-cf").count() == 1, "trial: Launchpad drop opens Review setup")


def run(page, ctx):
    page.set_default_timeout(6000)
    if ctx.persona == "pending-admin":
        every_site_explains(page, ctx)
    elif ctx.width >= 1000:
        trial_admin_works(page, ctx)
    else:
        ctx.visit("/reviews")
        ctx.shoot("t4-2-reviews-zone-open")
