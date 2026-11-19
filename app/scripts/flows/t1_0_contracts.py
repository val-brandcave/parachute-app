"""T1.0 contracts: the Bouncer invite dialog still sends through the new
sendInvites({email, role}[]) shape, and a self-serve arrival fires the
onboarding confetti once (canvas at z-index 201), never again on reload."""

import time

PERSONAS = ["trial-admin"]


def run(page, ctx):
    # 1. Bouncer mock: one role for every row, toast confirms.
    ctx.visit("/bouncer")
    page.get_by_role("button", name="Invite people").first.click()
    box = page.locator("input.bx-chipinput")
    box.fill("new.person@harborcb.com")
    box.press("Enter")
    page.locator(".ui-modal").get_by_role("button", name="Send invites").click()
    toast = page.get_by_text("Invite sent", exact=False)
    try:
        toast.first.wait_for(timeout=5000)
        ok = True
    except Exception:
        ok = False
    ctx.check(ok, "bouncer invite toast 'Invite sent' shown")
    ctx.shoot("t1-0-bouncer-sent")

    # 2. Arrival confetti on /get-started?motion=1.
    ctx.visit("/get-started")
    page.evaluate(
        "() => sessionStorage.setItem('parachute:arrival', JSON.stringify({path:'self_serve', at: Date.now()}))"
    )
    page.goto(ctx.url("/get-started?motion=1"), wait_until="domcontentloaded")
    start = time.time()
    z = None
    try:
        # 1 s budget in production; dev compiles the confetti chunk on first use, so allow 5 s.
        page.wait_for_selector("body > canvas", state="attached", timeout=5000)
        z = page.evaluate("() => getComputedStyle(document.querySelector('body > canvas')).zIndex")
    except Exception:
        pass
    ctx.check(z == "201", f"confetti canvas at z-index 201 (got {z!r}, {time.time() - start:.1f}s)")
    ctx.shoot("t1-0-confetti")

    # 3. Reload: the arrival was read once, so no canvas.
    page.reload(wait_until="domcontentloaded")
    ctx.settle(1500)
    ctx.check(page.locator("body > canvas").count() == 0, "no confetti after reload")
