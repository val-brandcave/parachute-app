/**
 * Password gate for the hosted prototype (Next.js 16 proxy, formerly middleware).
 *
 * Same gate as the Realwired Reporter prototype: one shared password, entered
 * once on a small form, remembered in a cookie. Vercel's own Password
 * Protection is a paid add-on, so this does the job in code.
 *
 * Switched on by SITE_PASSWORD in the Vercel project's environment variables
 * (Preview and/or Production), then redeploy. When SITE_PASSWORD is unset or
 * empty, every request passes untouched, so local dev behaves as before.
 *
 *   - Never prefix it NEXT_PUBLIC_. That would bake the password into the
 *     browser bundle of the page it is meant to protect.
 *   - Never commit the value. It lives only in the Vercel dashboard.
 *
 * Behaviour:
 *   - No valid cookie -> 401 with a self-contained password form (no-store).
 *   - POST /__gate with the right password -> cookie for 30 days, 303 back to
 *     the page first asked for (deep links survive the gate).
 *   - /__gate/logout -> cookie cleared, back to the form.
 *   - The cookie holds an HMAC of the password, not the password. Changing
 *     SITE_PASSWORD invalidates every cookie (that's how you lock everyone out).
 */

export const config = {
  // Every path, including /_next assets, so nothing is reachable without it.
  matcher: "/(.*)",
};

const GATE_PATH = "/__gate";
const LOGOUT_PATH = "/__gate/logout";
const COOKIE_NAME = "pc_gate";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const TOKEN_CONTEXT = "parachute-prototype-gate-v1";

const encoder = new TextEncoder();

/** HMAC-SHA256(key = password, message = fixed context), hex. */
async function tokenFor(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(TOKEN_CONTEXT));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent comparison, so timing does not leak how much matched. */
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/** Only same-origin paths; anything else falls back to "/". */
function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.startsWith(GATE_PATH)) return "/";
  return raw;
}

function cookieHeader(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

const NO_STORE = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formPage(next: string, failed: boolean): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Password required</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f7f9; --card:#fff; --ink:#1b1f24; --mute:#5b6470; --line:#d6dae0; --accent:#1f5eff; --on-accent:#fff; --err:#b42318; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111418; --card:#1a1e24; --ink:#e8ebef; --mute:#9aa3ad; --line:#323943; --accent:#6d97ff; --on-accent:#0b1020; --err:#ff8a80; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:16px; background:var(--bg); color:var(--ink);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  form { width:100%; max-width:360px; background:var(--card); border:1px solid var(--line); border-radius:10px; padding:28px 24px; }
  h1 { font-size:18px; margin:0 0 4px; }
  p { margin:0 0 20px; color:var(--mute); font-size:14px; }
  label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; }
  input[type=password] { width:100%; padding:10px 12px; font:inherit; color:inherit; background:transparent;
         border:1px solid var(--line); border-radius:6px; }
  input[type=password]:focus { outline:2px solid var(--accent); outline-offset:1px; }
  button { margin-top:16px; width:100%; padding:10px 12px; font:inherit; font-weight:600; color:var(--on-accent); background:var(--accent);
         border:0; border-radius:6px; cursor:pointer; }
  .err { color:var(--err); font-size:13px; margin:8px 0 0; }
</style>
</head>
<body>
<form method="post" action="${GATE_PATH}">
  <h1>This prototype is private</h1>
  <p>Enter the password you were given to continue.</p>
  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  <input type="hidden" name="next" value="${escapeAttr(next)}">
  ${failed ? '<p class="err" role="alert">That password did not match. Try again.</p>' : ""}
  <button type="submit">Continue</button>
</form>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE },
  });
}

/** Next's proxy needs an absolute Location, so resolve the path against the request. */
function redirect(request: Request, path: string, setCookie?: string): Response {
  const headers: Record<string, string> = { Location: new URL(path, request.url).toString(), ...NO_STORE };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return new Response(null, { status: 303, headers });
}

export async function proxy(request: Request): Promise<Response | undefined> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return undefined; // gate off: continue untouched

  const url = new URL(request.url);
  const expected = await tokenFor(password);

  if (url.pathname === LOGOUT_PATH) {
    return redirect(request, "/", cookieHeader("", 0));
  }

  if (url.pathname === GATE_PATH) {
    if (request.method !== "POST") return redirect(request, "/");
    let submitted = "";
    let next = "/";
    try {
      const form = await request.formData();
      submitted = String(form.get("password") ?? "");
      next = safeNext(String(form.get("next") ?? "/"));
    } catch {
      return formPage("/", true);
    }
    if (safeEqual(await tokenFor(submitted), expected)) {
      return redirect(request, next, cookieHeader(expected, COOKIE_MAX_AGE));
    }
    return formPage(next, true);
  }

  const cookie = readCookie(request, COOKIE_NAME);
  if (cookie && safeEqual(cookie, expected)) return undefined; // signed in: continue

  return formPage(safeNext(url.pathname + url.search), false);
}
