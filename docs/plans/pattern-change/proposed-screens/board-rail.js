/* Fixed right-hand index rail for the proposed-screens boards.
   Built from every <section id> that has an <h2>. Highlights the screen in view,
   jumps on click, J / K (or ] / [) for next / previous, and links between boards.
   Under 1100 px wide it collapses to an "Index" button that opens it as a panel. */
(function () {
  var BOARDS = [
    ["index.html", "Board 1"],
    ["part2.html", "Board 2"],
    ["onboarding-motion.html", "Motion"],
    ["onboarding-layout-compare.html", "Layout"]
  ];
  var here = location.pathname.split("/").pop() || "index.html";

  var secs = Array.prototype.slice.call(document.querySelectorAll("section[id]")).filter(function (s) {
    return s.querySelector("h2") && !s.parentElement.closest("section[id]");
  });
  if (!secs.length) return;

  var css = [
    ":root{--rail-w:248px}",
    "@media (min-width:1100px){body.has-rail{padding-right:calc(var(--rail-w) + 24px)}}",
    ".brail{position:fixed;top:16px;right:16px;bottom:16px;width:var(--rail-w);z-index:1000;display:flex;flex-direction:column;background:#fff;border:1px solid #e2e4e8;border-radius:14px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 28px rgba(16,52,76,.10);font:500 13px/1.35 Inter,system-ui,sans-serif;color:#1a1d21}",
    ".brail-hd{padding:12px 12px 10px;border-bottom:1px solid #eef0f2}",
    ".brail-boards{display:flex;flex-wrap:wrap;gap:4px}",
    ".brail-boards a{flex:1 1 auto;text-align:center;padding:6px 8px;border-radius:8px;color:#10344c;text-decoration:none;font-weight:600;font-size:12.5px;background:#f3f5f7;white-space:nowrap}",
    ".brail-boards a:hover{background:#d6e3ee}",
    ".brail-boards a[aria-current=page]{background:#10344c;color:#fff}",
    ".brail-meta{display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:12px;color:#565c64}",
    ".brail-meta b{color:#10344c;font-variant-numeric:tabular-nums}",
    ".brail-x{display:none;border:0;background:none;font:inherit;font-weight:600;color:#2a6f7f;cursor:pointer;padding:2px 4px}",
    ".brail ol{list-style:none;margin:0;padding:6px;overflow-y:auto;flex:1;scrollbar-width:thin}",
    ".brail li a{display:flex;gap:8px;align-items:baseline;padding:7px 8px;border-radius:8px;color:#3d434a;text-decoration:none;text-wrap:pretty}",
    ".brail li a:hover{background:#f3f5f7;color:#10344c}",
    ".brail li a .n{flex:none;min-width:20px;font-weight:700;color:#868d96;font-variant-numeric:tabular-nums}",
    ".brail li a.on{background:#d6e3ee;color:#10344c;font-weight:600}",
    ".brail li a.on .n{color:#10344c}",
    ".brail li a:focus-visible,.brail-boards a:focus-visible,.brail-open:focus-visible{outline:2px solid #2a6f7f;outline-offset:1px}",
    ".brail-ft{padding:8px 12px 10px;border-top:1px solid #eef0f2;font-size:11.5px;color:#868d96;display:flex;gap:10px;justify-content:space-between}",
    ".brail-ft a{color:#2a6f7f;text-decoration:none;font-weight:600}",
    ".brail-open{display:none;position:fixed;right:16px;bottom:16px;z-index:1000;height:40px;padding:0 16px;border-radius:20px;border:0;background:#10344c;color:#fff;font:600 13.5px Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(16,52,76,.25);cursor:pointer}",
    "@media (max-width:1099px){.brail{display:none;top:auto;height:min(70vh,560px);left:16px;width:auto}.brail.open{display:flex}.brail-open{display:block}.brail.open~.brail-open{display:none}.brail-x{display:inline}}",
    "section[id]{scroll-margin-top:16px}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var items = secs.map(function (s, i) {
    var h = s.querySelector("h2");
    var noEl = s.querySelector(".no");
    var n = noEl ? noEl.textContent.trim() : String(i + 1);
    var title = h.textContent.replace(/\s+/g, " ").trim();
    return '<li><a href="#' + s.id + '" data-id="' + s.id + '"><span class="n">' + esc(n) + "</span><span>" + esc(title) + "</span></a></li>";
  }).join("");

  var boards = BOARDS.map(function (b) {
    return '<a href="' + b[0] + '"' + (b[0] === here ? ' aria-current="page"' : "") + ">" + b[1] + "</a>";
  }).join("");

  var nav = document.createElement("nav");
  nav.className = "brail";
  nav.setAttribute("aria-label", "Screens on this board");
  nav.innerHTML =
    '<div class="brail-hd"><div class="brail-boards">' + boards + "</div>" +
    '<div class="brail-meta"><span>Screen <b class="brail-pos">1</b> of <b>' + secs.length + '</b></span><button type="button" class="brail-x">Close</button></div></div>' +
    "<ol>" + items + "</ol>" +
    '<div class="brail-ft"><span>J / K next · previous</span><a href="#" class="brail-top">Top ↑</a></div>';
  var openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "brail-open";
  openBtn.textContent = "Index";
  document.body.appendChild(nav);
  document.body.appendChild(openBtn);
  document.body.classList.add("has-rail");

  var links = Array.prototype.slice.call(nav.querySelectorAll("ol a"));
  var pos = nav.querySelector(".brail-pos");
  var current = 0;

  function setActive(i) {
    if (i < 0 || i >= links.length) return;
    current = i;
    links.forEach(function (a, k) {
      a.classList.toggle("on", k === i);
      if (k === i) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
    pos.textContent = i + 1;
    var a = links[i], ol = a.closest("ol");
    var top = a.offsetTop - ol.offsetTop, bottom = top + a.offsetHeight;
    if (top < ol.scrollTop + 8 || bottom > ol.scrollTop + ol.clientHeight - 8) {
      ol.scrollTop = top - ol.clientHeight / 2 + a.offsetHeight / 2;
    }
  }

  var lockUntil = 0;
  function computeActive() {
    if (Date.now() < lockUntil) return;
    var line = window.innerHeight * 0.3, best = 0;
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top - line <= 0) best = i; else break;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) best = secs.length - 1;
    if (best !== current || !links[current].classList.contains("on")) setActive(best);
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; computeActive(); });
  }, { passive: true });
  window.addEventListener("resize", computeActive);

  function go(i) {
    i = Math.max(0, Math.min(secs.length - 1, i));
    secs[i].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#" + secs[i].id);
    lockUntil = Date.now() + 900;
    setActive(i);
  }

  links.forEach(function (a, i) {
    a.addEventListener("click", function (e) { e.preventDefault(); go(i); nav.classList.remove("open"); });
  });
  nav.querySelector(".brail-top").addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  openBtn.addEventListener("click", function () { nav.classList.add("open"); links[current].focus(); });
  nav.querySelector(".brail-x").addEventListener("click", function () { nav.classList.remove("open"); openBtn.focus(); });

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var k = e.key;
    if (k === "j" || k === "J" || k === "]") { e.preventDefault(); go(current + 1); }
    else if (k === "k" || k === "K" || k === "[") { e.preventDefault(); go(current - 1); }
    else if (k === "Escape") nav.classList.remove("open");
  });

  computeActive();
})();
