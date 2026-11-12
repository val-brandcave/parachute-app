"""Phase 0 baseline: every key route loads for four personas, both themes, two widths."""

PERSONAS = ["trial-admin", "pending-admin", "reviewer", "returning"]
ROUTES = ["/get-started", "/dashboard", "/reviews", "/configure/billing", "/launchpad", "/welcome"]


def run(page, ctx):
    for route in ROUTES:
        ctx.visit(route)
        ctx.shoot(route)
