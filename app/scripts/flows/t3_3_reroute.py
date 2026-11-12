"""T3.3 Reroute Add credits, draft before checkout.

short_by_one_prefills_one (RF2): persona short by one (payg-admin-low, 1 credit), drop a
  file on /launchpad -> Review setup with both types -> Start review -> lock dialog (T4.1)
  "Add 1 credit" -> URL is
  /checkout/credits?credits=1&return=%2Freviews%2F<id>&types=technical%2Cadministrative.
round_trip_with_reload (RF4): zero balance, Technical only -> Start -> "You're out of credits"
  dialog, pick "1 credit · Just this review", Continue to checkout -> credits=1&types=technical;
  one `intake` draft (double click safe) listed in /reviews Intake; hard reload on Payment;
  pay -> "Back to your review" -> /reviews/<id> with exactly Technical checked; Start runs.
entry_points: header popover, billing band, Invoices empty, command palette each land on
  checkout with the right amount and `return`; /emails "Add credits" CTAs carry
  href="/checkout/credits?pack=pack10"; reviewer has no palette "Add credits"; an embedded
  YouConnect run on a wallet org at 0 opens no lock dialog and never navigates to checkout.

RF4 uses zero balance + Technical only (short by 1) so the round trip proves the
selection survives: exactly Technical is checked on return. The embedded check puts the
YouConnect org on wallet billing at 0 credits, so a wallet lock WOULD fire if embedded runs
were not exempt (spec §5.0: no lock dialog and no checkout in embedded runs).
T4.3 deleted the LowBalanceCallout: Add credits is now the lock dialog's (T4.1).
"""

import re
from urllib.parse import parse_qs, urlparse

PERSONAS = ["payg-admin-low", "reviewer", "enterprise-yc"]

REVIEWS_KEY = "parachute:reviews"
LEDGER_KEY = "parachute:credit_ledger"
ORGS_KEY = "parachute:orgs"
LOCK_SEL = '.lock-dlg[role="dialog"], .lock-dlg [role="dialog"], [role="dialog"]:has(.lock-body)'
START = ".run-cf-footbar button:has-text('Start review')"
PDF = {"name": "Short-by-one appraisal.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4\n%mock\n"}


def query(url):
    return {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}


def on_checkout(page):
    return urlparse(page.url).path == "/checkout/credits"


def wait_checkout(page, ctx, what, timeout=15000):
    try:
        page.wait_for_url(lambda u: "/checkout/credits" in u, timeout=timeout)
    except Exception:
        pass
    ok = ctx.check(on_checkout(page), f"{what}: lands on /checkout/credits (at {page.url})")
    ctx.settle(600)
    return ok


def open_review_setup(page, ctx):
    ctx.visit("/launchpad")
    inp = page.locator('input[type="file"]').first
    inp.set_input_files(PDF)
    page.wait_for_selector(".run .run-cf", timeout=15000)
    ctx.settle(900)


def checked_types(page):
    return page.evaluate(
        """() => [...document.querySelectorAll('.run-cf-opt[role="checkbox"]')]
             .filter(b => b.getAttribute('aria-checked') === 'true')
             .map(b => b.textContent.trim().toLowerCase())"""
    )


def open_lock(page, ctx, what):
    """Click Start review (aria-disabled while short, so force) and wait for the lock dialog."""
    page.locator(START).first.click(force=True)
    try:
        page.wait_for_selector(LOCK_SEL, state="visible", timeout=6000)
    except Exception:
        pass
    dlg = page.locator(LOCK_SEL)
    ok = ctx.check(dlg.count() >= 1, f"{what}: Start review opens the lock dialog")
    page.wait_for_timeout(400)
    return dlg.first if ok else None


def short_by_one_prefills_one(page, ctx):
    open_review_setup(page, ctx)
    on = checked_types(page)
    ctx.check(len(on) == 2, f"Review setup opens with both types checked ({on})")
    dlg = open_lock(page, ctx, "short by one")
    if dlg is None:
        return None
    btn = dlg.get_by_role("button", name=re.compile(r"^Add 1 credit\b"))
    ctx.check(btn.count() == 1, f"dialog offers 'Add 1 credit' ({dlg.inner_text()[:120]!r})")
    ctx.shoot("t3-3-review-setup-short")
    if not btn.count():
        return None
    btn.first.click()
    if not wait_checkout(page, ctx, "dialog Add 1 credit"):
        return None
    raw = urlparse(page.url).query
    q = query(page.url)
    m = re.fullmatch(r"/reviews/([^/?#]+)", q.get("return", ""))
    ctx.check(q.get("credits") == "1", f"credits=1 (RF2 shortfall, not the full cost) ({q})")
    ctx.check("pack" not in q, "no pack when the shortfall is below the smallest pack")
    ctx.check(m is not None, f"return=/reviews/<id> ({q.get('return')!r})")
    ctx.check("return=%2Freviews%2F" in raw, f"return is encoded ({raw})")
    ctx.check("types=technical%2Cadministrative" in raw, f"types=technical%2Cadministrative ({raw})")
    ctx.shoot("t3-3-checkout-credits-1")
    return m.group(1) if m else None


def stored_review(page, rid):
    return page.evaluate(
        """([key, id]) => { const rows = JSON.parse(localStorage.getItem(key) || '[]');
             const r = rows.find(x => x.id === id); return r ? { status: r.status, types: r.reviewTypes, address: r.propertyAddress } : null; }""",
        [REVIEWS_KEY, rid],
    )


def click_first(page, pattern):
    for role in ("button", "link"):
        loc = page.get_by_role(role, name=pattern)
        if loc.count():
            loc.first.click()
            return True
    return False


def pay_through(page, ctx):
    """Walk T3.1's steps to Paid. Returns True when it reached step=done."""
    for _ in range(6):
        if "step=done" in page.url:
            return True
        terms = page.get_by_role("checkbox", name=re.compile(r"credit terms", re.I))
        if terms.count() and not terms.first.is_checked():
            terms.first.check()
        if click_first(page, re.compile(r"^Pay \$")):
            try:
                page.wait_for_url(lambda u: "step=done" in u, timeout=10000)
            except Exception:
                pass
            ctx.settle(600)
            continue
        if not click_first(page, re.compile(r"^(Next: Payment|Continue to review|Next)\b")):
            break
        ctx.settle(500)
    return "step=done" in page.url


def zero_org_ledger(page, org_id):
    """Drop every ledger row of one org (balance 0). Returns the snapshot."""
    return page.evaluate(
        """([k, org]) => { const raw = localStorage.getItem(k); const rows = JSON.parse(raw || '[]');
             localStorage.setItem(k, JSON.stringify(rows.filter(r => r.orgId !== org))); return raw; }""",
        [LEDGER_KEY, org_id],
    )


def current_org(page):
    return page.evaluate(
        """() => { for (const k of Object.keys(localStorage)) { if (!/session/i.test(k)) continue;
             try { const v = JSON.parse(localStorage.getItem(k)); const o = v && (v.orgId || (v.state && v.state.orgId));
                   if (o) return o; } catch (e) {} } return null; }"""
    )


def type_state(page):
    return page.evaluate(
        """() => Object.fromEntries([...document.querySelectorAll('.run-cf-opt[role="checkbox"]')]
             .map(b => [b.querySelector('.run-cf-opt-label').textContent.trim().split(' ')[0].toLowerCase(),
                        b.getAttribute('aria-checked') === 'true']))"""
    )


def intake_count_at(page, addr):
    return page.evaluate(
        """([k, addr]) => JSON.parse(localStorage.getItem(k) || '[]')
             .filter(x => x.status === 'intake' && x.propertyAddress === addr).length""",
        [REVIEWS_KEY, addr],
    )


def round_trip_with_reload(page, ctx, org_id):
    """RF4: zero balance, Technical only (short by 1) -> checkout credits=1&types=technical ->
    hard reload on Payment -> pay -> Back to your review -> exactly Technical checked -> Start."""
    zero_org_ledger(page, org_id)
    open_review_setup(page, ctx)
    page.locator('.run-cf-opt[role="checkbox"]', has_text="Administrative review").first.click()
    page.wait_for_timeout(500)
    st = type_state(page)
    ctx.check(st == {"technical": True, "administrative": False}, f"Technical only selected ({st})")
    addr = page.locator(".run-cf-form input").first.input_value()
    before = intake_count_at(page, addr)
    dlg = open_lock(page, ctx, "zero balance + Technical only")
    if dlg is None:
        return
    ctx.check("out of credits" in dlg.inner_text(), f"zero variant ({dlg.inner_text()[:80]!r})")
    just = dlg.get_by_text(re.compile(r"1 credit · Just this review"))
    if not ctx.check(just.count() >= 1, "zero dialog offers '1 credit · Just this review'"):
        return
    just.first.click()
    page.wait_for_timeout(300)
    btn = dlg.get_by_role("button", name="Continue to checkout")
    if not ctx.check(btn.count() == 1, "zero dialog offers 'Continue to checkout'"):
        return
    btn.first.dblclick()  # a double click must create one draft, not two
    if not wait_checkout(page, ctx, "RF4 Add 1 credit"):
        return
    q = query(page.url)
    m = re.fullmatch(r"/reviews/([^/?#]+)", q.get("return", ""))
    ctx.check(q.get("credits") == "1" and q.get("types") == "technical", f"credits=1&types=technical ({q})")
    if not ctx.check(m is not None, f"return=/reviews/<id> ({q.get('return')!r})"):
        return
    rid = m.group(1)

    r = stored_review(page, rid)
    ctx.check(r is not None and r["status"] == "intake", f"draft review {rid} is intake before payment ({r})")
    ctx.check(r is not None and (r["types"] or []) == ["technical"], f"draft keeps Technical only ({r})")
    after = intake_count_at(page, addr)
    ctx.check(after == before + 1, f"double click made exactly one draft ({before} -> {after})")
    tab = page.context.new_page()
    tab.goto(ctx.url("/reviews"), wait_until="domcontentloaded")
    ctx.settle(800)
    intake = tab.get_by_role("tab", name=re.compile(r"^Intake"))
    if intake.count():
        intake.first.click()
        tab.wait_for_timeout(600)
    rows = tab.locator(".qrow", has_text=addr)
    ctx.check(intake.count() == 1 and rows.count() >= 1, f"the draft ({addr!r}) is listed in /reviews Intake")
    tab.screenshot(path=str(ctx.out / f"t3-3-reviews-intake-{ctx.persona}-{ctx.theme}-{ctx.width}.png"))
    tab.close()

    # Hard reload on the Payment step: the wallet and the draft both survive (adapter-backed).
    page.goto(page.url + "&step=payment", wait_until="domcontentloaded")
    page.reload(wait_until="domcontentloaded")
    ctx.settle(900)
    q = query(page.url)
    ctx.check(on_checkout(page) and q.get("return") == f"/reviews/{rid}" and q.get("types") == "technical",
              f"reload keeps return and types ({page.url})")
    ctx.check(stored_review(page, rid) is not None, "draft survives the reload")
    ctx.shoot("t3-3-checkout-after-reload")

    ctx.check(pay_through(page, ctx), f"pay reaches step=done ({page.url})")
    ctx.shoot("t3-3-paid")
    ctx.check(click_first(page, re.compile(r"Back to your review")), "Paid offers 'Back to your review'")
    try:
        page.wait_for_url(lambda u: urlparse(u).path == f"/reviews/{rid}", timeout=10000)
    except Exception:
        pass
    ctx.check(urlparse(page.url).path == f"/reviews/{rid}", f"back on /reviews/{rid} ({page.url})")
    print(f"    info: returned to {page.url}", flush=True)
    try:
        page.wait_for_selector(".run .run-cf", timeout=10000)
    except Exception:
        pass
    ctx.settle(900)
    st = type_state(page)
    ctx.check(st == {"technical": True, "administrative": False}, f"Review setup reopens with exactly Technical checked ({st})")
    ctx.check(page.locator(LOCK_SEL).count() == 0 and page.locator(".cs-callout").count() == 0,
              "no lock dialog or callout after paying")
    ctx.shoot("t3-3-back-at-review-setup")
    page.get_by_role("button", name="Start review").first.click()
    ctx.settle(1200)
    r = stored_review(page, rid)
    ctx.check(r is not None and r["status"] == "running" and r["types"] == ["technical"],
              f"Start now succeeds with Technical only ({r})")
    ctx.check("/checkout" not in page.url, "Start does not bounce to checkout")


def palette_search(page, text):
    """Open the palette (retry once if the shortcut lands before hydration) and search."""
    box = page.get_by_placeholder("Search reviews, pages, actions…")
    for _ in range(2):
        page.keyboard.press("Control+k")
        try:
            box.wait_for(timeout=3000)
            break
        except Exception:
            page.wait_for_timeout(800)
    box.fill(text)
    page.wait_for_timeout(400)


def palette_add_credits(page, ctx):
    palette_search(page, "Add credits")
    return page.locator(".cmdk-item", has_text="Add credits")


def entry_points(page, ctx):
    # Header popover
    ctx.visit("/dashboard")
    page.locator(".credits-pill").first.click()
    page.wait_for_timeout(500)
    pop_btn = page.locator(".credits-pop").get_by_role("button", name="Add credits")
    if ctx.check(pop_btn.count() == 1, "popover has Add credits"):
        pop_btn.first.click()
        if wait_checkout(page, ctx, "popover"):
            q = query(page.url)
            ctx.check(q.get("pack") == "pack10" and q.get("return") == "/dashboard", f"popover: pack10 + return=/dashboard ({q})")
            ctx.check(page.locator(".credits-pop").count() == 0, "popover closed on the way out")

    # Billing band
    ctx.visit("/configure/billing")
    band = page.get_by_role("button", name=re.compile(r"^Add credits"))
    if ctx.check(band.count() >= 1, "billing has Add credits (T3.2 band)"):
        band.first.click()
        if wait_checkout(page, ctx, "billing band"):
            q = query(page.url)
            ctx.check(q.get("pack") == "pack10" and (q.get("return") or "").startswith("/configure/billing"), f"billing: pack10 + return=/configure/billing… ({q})")

    # Invoices empty: strip purchases/debits for this org, then restore.
    snap = page.evaluate("(k) => localStorage.getItem(k)", LEDGER_KEY)
    page.evaluate(
        """(k) => { const rows = JSON.parse(localStorage.getItem(k) || '[]');
             localStorage.setItem(k, JSON.stringify(rows.filter(r => !['purchase','debit','rescan'].includes(r.kind)))); }""",
        LEDGER_KEY,
    )
    ctx.visit("/configure/billing?tab=invoices")
    empty = page.locator(".bl-stack").get_by_role("button", name="Add credits")
    if ctx.check(empty.count() >= 1, "Invoices empty state has Add credits"):
        ctx.shoot("t3-3-invoices-empty")
        empty.first.click()
        if wait_checkout(page, ctx, "invoices empty"):
            q = query(page.url)
            ctx.check(q.get("pack") == "pack10" and q.get("return") == "/configure/billing?tab=invoices", f"invoices: pack10 + return=/configure/billing?tab=invoices ({q})")
    page.evaluate("([k, v]) => { if (v !== null) localStorage.setItem(k, v); }", [LEDGER_KEY, snap])

    # Command palette
    ctx.visit("/reviews")
    item = palette_add_credits(page, ctx)
    if ctx.check(item.count() == 1, "palette offers Add credits to an admin"):
        ctx.shoot("t3-3-palette")
        item.first.click()
        if wait_checkout(page, ctx, "palette"):
            q = query(page.url)
            ctx.check(q.get("pack") == "pack10" and q.get("return") == "/reviews", f"palette: pack10 + return=/reviews ({q})")
    ctx.visit("/reviews")
    palette_search(page, "How credits")
    how = page.locator(".cmdk-item", has_text="How credits work")
    if ctx.check(how.count() == 1, "palette offers How credits work"):
        how.first.click()
        page.wait_for_timeout(1200)
        ctx.check("/configure/billing" in page.url and "tab=credits" in page.url, f"How credits work → billing?tab=credits ({page.url})")

    # E-mail preview CTAs
    ctx.visit("/emails")
    hrefs = page.evaluate("() => [...document.querySelectorAll('a')].map(a => a.getAttribute('href'))")
    n = sum(1 for h in hrefs if h == "/checkout/credits?pack=pack10")
    ctx.check(n >= 2, f"/emails low- and zero-balance CTAs link to /checkout/credits?pack=pack10 ({n} found)")
    body = page.inner_text("body")
    ctx.check("Zero balance" in body or "out of credits" in body, "zero-balance e-mail listed")


def reviewer_checks(page, ctx):
    ctx.visit("/reviews")
    palette_search(page, "credits")
    ctx.check(page.locator(".cmdk-item", has_text="Add credits").count() == 0, "reviewer: no palette Add credits")
    ctx.check(page.locator(".cmdk-item", has_text="How credits work").count() == 1, "reviewer: How credits work offered")
    page.keyboard.press("Escape")


def embedded_never_checkout(page, ctx):
    """Embedded session on a wallet org at 0 credits: Start opens no lock dialog and
    nothing ever navigates to checkout (spec §5.0: billed through YouConnect)."""
    visited = []
    page.on("framenavigated", lambda f: visited.append(f.url) if f == page.main_frame else None)
    org = current_org(page)
    if not ctx.check(org is not None, "embedded session org found"):
        return
    page.evaluate(
        """([ok, org]) => { const rows = JSON.parse(localStorage.getItem(ok) || '[]');
             localStorage.setItem(ok, JSON.stringify(rows.map(o => o.id === org ? { ...o, billing: 'payg' } : o))); }""",
        [ORGS_KEY, org],
    )
    zero_org_ledger(page, org)
    ctx.visit("/youconnect")
    go = page.locator(".ycm-act--go")
    if not ctx.check(go.count() >= 1, "YouConnect mock has the Parachute action"):
        return
    go.first.click()
    try:
        page.wait_for_selector(".run .run-cf", timeout=20000)
    except Exception:
        pass
    ctx.settle(900)
    ctx.check(page.locator(".run .run-cf").count() == 1, "embedded Review setup opens")
    ctx.check(page.locator(".cs-callout").count() == 0, "embedded: no callout")
    start = page.locator(START).first
    ctx.check(start.get_attribute("aria-disabled") is None, "embedded short run: Start is not aria-disabled")
    start.click()
    page.wait_for_timeout(800)
    ctx.check(page.locator(LOCK_SEL).count() == 0, "embedded: Start opens no lock dialog")
    ctx.shoot("t3-3-embedded-start")
    ctx.settle(1200)
    ctx.check(page.locator(".run .run-cf").count() == 0, "embedded: Start runs in place (left Review setup)")
    ctx.check(not any("/checkout" in u for u in visited), f"embedded run never navigates to checkout ({visited})")


def run(page, ctx):
    if ctx.width < 1000:
        # Desktop-first shell; narrow width only checks that checkout opens on the spec'd URL.
        ctx.visit("/checkout/credits?pack=pack10")
        ctx.check(on_checkout(page), "checkout route opens at narrow width")
        return
    p = ctx.persona
    if p == "payg-admin-low":
        org = current_org(page)
        ledger = page.evaluate("(k) => localStorage.getItem(k)", LEDGER_KEY)
        short_by_one_prefills_one(page, ctx)
        if ctx.check(org is not None, "session org found in localStorage"):
            round_trip_with_reload(page, ctx, org)
        # Restore the persona's ledger (1 credit) for the entry-point checks.
        page.evaluate("([k, v]) => { if (v !== null) localStorage.setItem(k, v); }", [LEDGER_KEY, ledger])
        entry_points(page, ctx)
    elif p == "reviewer":
        reviewer_checks(page, ctx)
    elif p == "enterprise-yc":
        embedded_never_checkout(page, ctx)
