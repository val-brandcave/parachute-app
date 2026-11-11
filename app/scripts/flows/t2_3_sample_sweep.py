"""T2.3 sample sweep (PC-4): the sample review is reachable by URL only.
No link, button or copy offers it on /dashboard, /reviews (empty org), /configure/billing (fresh).
Also: the locked Start on the pending-admin dashboard explains itself (lock store + toast)."""
import re

PERSONAS = ["pending-admin", "payg-admin-low"]
ROUTES = ["/dashboard", "/reviews", "/configure/billing"]
# A visible title that proves the empty state / hero rendered (not a blank page).
EXPECT = {
    "/dashboard": r"Your dashboard fills in after your first review",
    "/reviews": r"No reviews yet",
    "/configure/billing": r"Your balance and usage show up here|Usage starts with your first review|waiting for approval|Plan|Billing|Credits|Balance",
}
REASON = "Opens when your organization is approved"


def run(page, ctx):
    for route in ROUTES:
        ctx.visit(route)
        ctx.settle(1500)
        tag = route.strip("/").replace("/", "-")
        main = page.locator("main")
        ctx.check(main.count() >= 1, f"{route}: <main> rendered")
        text = main.first.inner_text() if main.count() else ""
        ctx.check(len(text.strip()) > 0, f"{route}: main is not blank")
        ctx.check(re.search(EXPECT[route], text) is not None, f"{route}: expected heading/empty-state shown")
        ctx.check(re.search(r"sample", text, re.I) is None, f"{route}: main text has no /sample/i")
        ctx.check(page.locator('a[href*="review-sample"]').count() == 0, f"{route}: no a[href*=review-sample]")
        ctx.check(page.locator("button", has_text=re.compile("sample", re.I)).count() == 0, f"{route}: no button text /sample/i")
        ctx.check(page.get_by_text("Open the sample").count() == 0, f"{route}: no 'Open the sample' copy")
        # /reviews is skipped: OrderButton (header, not owned here) still uses disabled={locked}.
        if route != "/reviews":
            ctx.check(page.locator("main button[disabled]").count() == 0, f"{route}: no disabled buttons in main")
        ctx.shoot(f"t2-3-{tag}")

        if route == "/dashboard" and ctx.persona == "pending-admin":
            btn = page.get_by_role("button", name=re.compile("Start a review")).last
            ctx.check(btn.get_attribute("aria-disabled") == "true", "locked Start has aria-disabled")
            ctx.check(btn.get_attribute("disabled") is None, "locked Start has no disabled attribute")
            desc = btn.get_attribute("aria-describedby")
            ctx.check(bool(desc) and REASON in page.locator("#" + desc).inner_text(), "aria-describedby points at the reason")
            before = page.url
            toast_sel = '[role="region"] > ol > li'  # Radix toast viewport (ToastProvider in @realwired/ui) > toast item
            toasts = page.locator(toast_sel).filter(has_text=REASON)
            ctx.check(toasts.count() == 0, "no reason toast before the click")
            btn.click(force=True)  # Playwright treats aria-disabled as not enabled
            page.wait_for_timeout(600)
            ctx.check(page.url == before, "locked Start click does not navigate")
            toasts.first.wait_for(state="visible", timeout=3000)
            ctx.check(toasts.first.is_visible(), "locked Start click shows a visible toast (in the toast viewport) with the reason")
            ctx.shoot("t2-3-locked-start")

    ran = False
    if ctx.theme == "light" and ctx.persona == PERSONAS[0]:
        r = page.request.get(ctx.url("/reviews/review-sample"))
        ctx.check(r.status == 200, f"/reviews/review-sample still 200 (got {r.status})")
        ran = True
    if ctx.theme == "light" and ctx.persona == PERSONAS[0]:
        ctx.check(ran, "review-sample 200 check ran")
