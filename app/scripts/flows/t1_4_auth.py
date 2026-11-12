"""T1.4 auth transitions: sign-up -> verify -> /welcome with motion off; a wrong
code clears the boxes, shows the error and refocuses box 1; a direct load of
/auth/verify renders at rest; no button[disabled] on any of these screens.
Runs without a persona."""

BOXES = ".kc-code input"


def no_disabled(page, ctx, where):
    n = page.locator("button[disabled]").count()
    ctx.check(n == 0, f"{where}: no button[disabled] (found {n})")


def run(page, ctx):
    # 1. Direct load of verify renders at rest.
    ctx.visit("/auth/verify")
    ctx.check(page.locator(BOXES).count() == 6, "verify: six code boxes on direct load")
    ctx.check(page.get_by_role("heading", name="Check your inbox").is_visible(), "verify: heading visible at rest")
    op = page.evaluate("() => getComputedStyle(document.querySelector('.kc-card form').parentElement).opacity")
    ctx.check(op == "1", f"verify: content opacity 1 on direct load (got {op})")
    no_disabled(page, ctx, "verify (rest)")
    ctx.shoot("t1-4-verify-rest")

    # Submitting an incomplete code explains instead of being disabled.
    page.get_by_role("button", name="Verify email").click()
    page.locator(".kc-err").wait_for(timeout=3000)
    ctx.check("6-digit" in page.locator(".kc-err").inner_text(), "verify: short code shows an explanation")

    # 2. Wrong code: boxes cleared, error shown, focus on box 1.
    for i, ch in enumerate("000000"):
        page.locator(BOXES).nth(i).fill(ch)
    ctx.check(page.locator(BOXES).nth(5).input_value() == "0", "wrong: six digits typed")
    page.get_by_role("button", name="Verify email").click()
    page.locator(".kc-err").filter(has_text="match").wait_for(timeout=5000)
    vals = [page.locator(BOXES).nth(i).input_value() for i in range(6)]
    ctx.check(all(v == "" for v in vals), f"wrong: boxes cleared (got {vals})")
    focused = page.evaluate("() => document.activeElement && document.activeElement.getAttribute('aria-label')")
    ctx.check(focused == "Digit 1 of 6", f"wrong: focus on box 1 (got {focused!r})")
    ctx.check(page.locator(BOXES).first.get_attribute("aria-invalid") == "true", "wrong: boxes marked invalid")
    no_disabled(page, ctx, "verify (wrong code)")
    ctx.shoot("t1-4-verify-wrong")

    # 3. Sign-up -> verify -> /welcome.
    ctx.visit("/auth/create-account")
    no_disabled(page, ctx, "sign-up")
    ctx.shoot("t1-4-signup")
    page.get_by_role("button", name="Create account").click()
    try:
        page.wait_for_url("**/auth/verify**", timeout=15000)
    except Exception:
        ctx.errors.append("assert: sign-up did not reach /auth/verify")
        return
    page.locator(BOXES).first.wait_for(timeout=5000)
    ctx.check("email=" in page.url, "sign-up: verify URL carries the email")
    ctx.settle(500)
    no_disabled(page, ctx, "verify (after sign-up)")
    ctx.shoot("t1-4-verify-after-signup")

    # Paste fills every box.
    page.locator(BOXES).first.focus()
    page.evaluate(
        """() => {
          const el = document.querySelector('.kc-code input');
          const dt = new DataTransfer(); dt.setData('text', '123456');
          el.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true}));
        }"""
    )
    page.wait_for_timeout(300)
    vals = "".join(page.locator(BOXES).nth(i).input_value() for i in range(6))
    ctx.check(vals == "123456", f"verify: paste fills all boxes (got {vals!r})")
    page.get_by_role("button", name="Verify email").click()
    try:
        page.wait_for_url("**/welcome**", timeout=15000)
    except Exception:
        ctx.errors.append("assert: verify did not reach /welcome")
        return
    ctx.check("/welcome" in page.url, "verify: landed on /welcome")
    # Consuming the verify handoff (sessionStorage "parachute:handoff") is T1.1's job on /welcome;
    # here we only require the URL, not the storage state.
    ctx.settle(800)
    ctx.shoot("t1-4-welcome")
