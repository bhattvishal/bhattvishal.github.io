(function () {
  "use strict";
  var P = window.PROFILE;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────── uptime / firmware version derived from career start ───────── */
  var start = new Date(P.careerStart + "T09:00:00");
  function uptime() {
    var now = new Date();
    var y = now.getFullYear() - start.getFullYear();
    var m = now.getMonth() - start.getMonth();
    var d = now.getDate() - start.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    var secs = Math.floor((now - start) / 1000);
    return { y: y, m: m, d: d, h: now.getHours(), mi: now.getMinutes(), s: now.getSeconds(), secs: secs };
  }
  function tick() {
    var u = uptime();
    $("#uptime-short").textContent = u.y + "y " + u.m + "m";
    $("#uptime-long").textContent = u.y + "y " + u.m + "m " + u.d + "d " + String(u.s).padStart(2, "0") + "s";
    $("#fw").textContent = "v" + u.y + "." + u.m + "." + u.d;
  }
  tick(); setInterval(tick, 1000);

  /* ───────── static content ───────── */
  var parts = P.name.split(" ");
  $("#hero-first").textContent = parts[0];
  $("#hero-last").textContent = parts.slice(1).join(" ");
  $("#loc").textContent = P.location;
  $("#headline").textContent = P.headline;
  $("#cta-resume").href = P.resume;
  $("#year").textContent = new Date().getFullYear();
  var patents = P.innovation.filter(function (i) { return /patent/i.test(i.label); })[0];
  $("#patents").textContent = patents ? String(patents.n) : "—";

  $("#about-text").innerHTML = P.about.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  $("#now").innerHTML = P.nowExploring.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
  $("#collab").innerHTML = P.collaborate.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");

  $("#exp").innerHTML = P.experience.map(function (e, i) {
    return '<li class="release reveal' + (i === 0 ? " current" : "") + '">' +
      '<div class="rel-meta"><span class="rel-ver">' + esc(e.version) + '</span><span class="rel-period">' + esc(e.period) + "</span></div>" +
      '<div class="rel-body"><h3 class="rel-title">' + esc(e.title) + (i === 0 ? '<span class="rel-tag">latest</span>' : '<span class="rel-tag">' + esc(e.tag) + "</span>") + "</h3>" +
      '<p class="rel-org">' + esc(e.org) + "</p>" +
      '<ul class="rel-notes">' + e.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div></li>";
  }).join("");

  $("#skills").innerHTML = Object.keys(P.skills).map(function (group) {
    return '<div class="card reveal"><h3 class="mono small-head">// ' + esc(group.toLowerCase()) + "</h3>" +
      P.skills[group].map(function (s) {
        var on = Math.round(s[1] / 25);
        var bars = "";
        for (var i = 1; i <= 4; i++) bars += '<i class="' + (i <= on ? "on" : "") + '" style="transition-delay:' + i * 90 + 'ms"></i>';
        return '<div class="sig-row"><span>' + esc(s[0]) + '</span><span class="bars' + (on < 4 ? " mid" : "") + '" role="img" aria-label="' + on + ' of 4 bars">' + bars + "</span></div>";
      }).join("") + "</div>";
  }).join("");

  $("#counters").innerHTML = P.innovation.map(function (c) {
    return '<div class="counter reveal"><b data-n="' + c.n + '">0</b><span>' + esc(c.label) + "</span></div>";
  }).join("");
  $("#certs").innerHTML = P.certifications.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
  $("#edu").innerHTML = P.education.map(function (e) {
    return "<li><b>" + esc(e.degree) + "</b> · " + esc(e.period) + "<small>" + esc(e.field) + ", " + esc(e.school) + "</small></li>";
  }).join("");
  $("#offline-grid").innerHTML = P.offline.map(function (o) {
    return '<div class="off reveal"><span class="emo" aria-hidden="true">' + o.icon + "</span><h3>" + esc(o.title) + "</h3><p>" + esc(o.text) + "</p></div>";
  }).join("");
  $("#links").innerHTML = P.links.map(function (l) {
    return '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener me">' + esc(l.label) + ' <span class="mono" aria-hidden="true">↗</span></a></li>';
  }).join("") + '<li><a href="' + esc(P.resume) + '" target="_blank" rel="noopener">Résumé (PDF) <span class="mono" aria-hidden="true">↓</span></a></li>';

  /* ───────── rotating tagline (typewriter) ───────── */
  (function () {
    var el = $("#rotator"), words = P.rotating, w = 0, c = 0, del = false;
    if (reduced) { el.textContent = words.join(" · "); return; }
    (function step() {
      var word = words[w];
      c += del ? -1 : 1;
      el.textContent = word.slice(0, c);
      var wait = del ? 40 : 85;
      if (!del && c === word.length) { del = true; wait = 1600; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; wait = 300; }
      setTimeout(step, wait);
    })();
  })();

  /* ───────── reveal on scroll + counters + active nav ───────── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      var b = en.target.querySelector("b[data-n]");
      if (b) {
        var n = +b.dataset.n, t0 = performance.now();
        (function f(t) { var k = Math.min(1, (t - t0) / 1200); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
      }
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  var navLinks = document.querySelectorAll(".nav a");
  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(function (s) { navIO.observe(s); });

  /* ───────── theme ───────── */
  $("#theme-toggle").addEventListener("click", function () {
    var root = document.documentElement;
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("vb-theme", next); } catch (e) {}
  });
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  /* ───────── HERO MESH: IoT devices relaying packets up to a cloud hub ───────── */
  var pps = 0, ppsHistory = [];
  (function mesh() {
    var cv = $("#mesh"), ctx = cv.getContext("2d"), W, H, dpr, nodes = [], hub, packets = [], mouse = { x: -999, y: -999 };
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, Math.max(28, (W * H) / 16000)));
      hub = { x: W * 0.86, y: H * 0.16, hub: true, glow: 0 };
      nodes = [hub];
      for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, glow: 0 });
      link();
    }
    // each device forwards to the closest neighbour that is nearer to the hub
    function link() {
      nodes.forEach(function (n) {
        if (n.hub) return;
        var dh = dist(n, hub), best = hub, bd = dh;
        nodes.forEach(function (o) {
          if (o === n) return;
          var d = dist(n, o);
          if (dist(o, hub) < dh - 10 && d < bd && d < 220) { bd = d; best = o; }
        });
        n.parent = best;
      });
    }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function spawn() {
      var n = nodes[1 + Math.floor(Math.random() * (nodes.length - 1))];
      packets.push({ at: n, to: n.parent, t: 0, color: Math.random() < 0.25 ? "amber" : "accent" });
    }
    var arrived = 0;
    setInterval(function () { pps = arrived; arrived = 0; ppsHistory.push(pps); if (ppsHistory.length > 60) ppsHistory.shift(); var el = $("#pps"); if (el) el.textContent = pps; }, 1000);

    var frame = 0;
    function draw() {
      frame++;
      var acc = cssVar("--accent"), amb = cssVar("--amber"), line = cssVar("--line"), txt = cssVar("--muted");
      ctx.clearRect(0, 0, W, H);
      if (frame % 90 === 0) link();
      // move devices slightly
      nodes.forEach(function (n) {
        if (n.hub) return;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        var md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (md < 140) n.glow = Math.max(n.glow, 1 - md / 140);
      });
      // edges
      ctx.lineWidth = 1;
      nodes.forEach(function (n) {
        if (!n.parent) return;
        ctx.strokeStyle = line; ctx.globalAlpha = 0.55 + n.glow * 0.45;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.parent.x, n.parent.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // packets hop toward the hub
      if (Math.random() < 0.35) spawn();
      for (var i = packets.length - 1; i >= 0; i--) {
        var p = packets[i];
        p.t += 0.03;
        if (p.t >= 1) {
          p.to.glow = 1;
          if (p.to.hub) { arrived++; packets.splice(i, 1); continue; }
          p.at = p.to; p.to = p.at.parent || hub; p.t = 0;
        }
        var x = p.at.x + (p.to.x - p.at.x) * p.t, y = p.at.y + (p.to.y - p.at.y) * p.t;
        ctx.fillStyle = p.color === "amber" ? amb : acc;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
      }
      // nodes
      nodes.forEach(function (n) {
        n.glow *= 0.94;
        if (n.hub) {
          var r = 16 + n.glow * 8;
          ctx.strokeStyle = acc; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(n.x, n.y, r + 14, 0, 6.283); ctx.stroke();
          ctx.globalAlpha = 1; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(n.x, n.y, 6 + n.glow * 2, 0, 6.283); ctx.fill();
          ctx.font = "11px JetBrains Mono, monospace"; ctx.fillStyle = txt; ctx.fillText("azure-iot-hub", n.x - 40, n.y + r + 28);
          return;
        }
        ctx.fillStyle = n.glow > 0.05 ? acc : txt;
        ctx.globalAlpha = 0.5 + n.glow * 0.5;
        ctx.fillRect(n.x - 2, n.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      if (!reduced) requestAnimationFrame(draw);
    }
    window.addEventListener("resize", build);
    cv.parentElement.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
    build(); draw();
  })();

  /* ───────── telemetry sparkline ───────── */
  (function spark() {
    var cv = $("#spark"), ctx = cv.getContext("2d");
    function draw() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var data = ppsHistory.length ? ppsHistory : [0], max = Math.max.apply(null, data.concat([10]));
      var step = W / 59, acc = cssVar("--accent");
      ctx.beginPath();
      data.forEach(function (v, i) { var x = W - (data.length - 1 - i) * step, y = H - 6 - (v / max) * (H - 14); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.lineTo(W, H); ctx.lineTo(W - (data.length - 1) * step, H); ctx.closePath();
      ctx.globalAlpha = 0.15; ctx.fillStyle = acc; ctx.fill(); ctx.globalAlpha = 1;
    }
    setInterval(draw, 1000); draw();
  })();

  /* ───────── live GitHub repos ───────── */
  (function repos() {
    var box = $("#repos");
    fetch("https://api.github.com/users/" + P.githubUser + "/repos?sort=pushed&per_page=100")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        list = list.filter(function (r) { return !r.fork && r.name.toLowerCase() !== P.githubUser + ".github.io" && r.name.toLowerCase() !== P.githubUser; })
          .sort(function (a, b) { return (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)); })
          .slice(0, 6);
        if (!list.length) throw new Error("empty");
        box.innerHTML = list.map(function (r) {
          return '<a class="repo reveal in" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' +
            "<h3>" + esc(r.name) + "</h3><p>" + esc(r.description || "No description yet.") + "</p>" +
            '<div class="repo-meta">' + (r.language ? '<span><span class="lang-dot"></span>' + esc(r.language) + "</span>" : "") +
            "<span>★ " + r.stargazers_count + "</span><span>updated " + new Date(r.pushed_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) + "</span></div></a>";
        }).join("");
      })
      .catch(function () {
        box.innerHTML = '<p class="muted">Couldn\'t reach GitHub right now — browse everything at <a href="https://github.com/' + esc(P.githubUser) + '">github.com/' + esc(P.githubUser) + "</a>.</p>";
      });
  })();

  /* ───────── terminal easter egg ───────── */
  (function terminal() {
    var term = $("#term"), body = $("#term-body"), input = $("#term-in"), hist = [], hi = 0, lastFocus;
    function out(html) { body.insertAdjacentHTML("beforeend", html + "\n"); body.scrollTop = body.scrollHeight; }
    var u = function () { var x = uptime(); return x.y + " years, " + x.m + " months, " + x.d + " days"; };
    var cmds = {
      help: function () { return '<span class="c">available commands</span>\n  whoami      who is this?\n  experience  career changelog\n  skills      signal strength report\n  stack       what I build with\n  innovation  patents & disclosures\n  contact     ways to reach me\n  resume      open my résumé\n  uptime      how long I\'ve been shipping\n  ping        test connectivity\n  cook        fun fact\n  theme       toggle light / dark\n  clear       clear screen\n  exit        close terminal'; },
      whoami: function () { return '<span class="a">' + esc(P.name) + "</span> — " + esc(P.headline) + "\n" + esc(P.about[0]); },
      experience: function () { return P.experience.map(function (e) { return '<span class="c">' + e.version + '</span>  ' + esc(e.title) + ' <span class="m">@ ' + esc(e.org) + " · " + esc(e.period) + "</span>"; }).join("\n"); },
      skills: function () { return Object.keys(P.skills).map(function (g) { return '<span class="a">' + esc(g) + "</span>\n" + P.skills[g].map(function (s) { var n = Math.round(s[1] / 25); return "  " + "▮".repeat(n) + "▯".repeat(4 - n) + "  " + esc(s[0]); }).join("\n"); }).join("\n"); },
      stack: function () { return "C# · .NET · Azure IoT Hub · IoT Edge · Web Apps & APIs · Microservices\nC/C++ · ESP8266/ESP32 · CAN · MODBUS · PROFINET · WPF/WCF\nGit · TFS · Azure DevOps · Atlassian · Scaled Agile"; },
      innovation: function () { return P.innovation.map(function (i) { return '  <span class="c">' + i.n + "</span> " + esc(i.label); }).join("\n"); },
      contact: function () { return P.links.map(function (l) { return "  " + esc(l.label).padEnd(15) + '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.url) + "</a>"; }).join("\n"); },
      resume: function () { window.open(P.resume, "_blank", "noopener"); return "opening résumé…"; },
      uptime: function () { return "up " + u() + " since " + P.careerStart + " · load average: curious, curious, caffeinated"; },
      ping: function () { return "PING vishal (pune.in): 56 data bytes\n64 bytes: icmp_seq=0 ttl=64 time=0.42 ms\n64 bytes: icmp_seq=1 ttl=64 time=0.39 ms\n--- reply: <span class=\"c\">let's talk → linkedin.com/in/bhattvishal</span>"; },
      cook: function () { return "🍳 fun fact: I can cook very well. Ask me for a recipe."; },
      theme: function () { $("#theme-toggle").click(); return "theme → " + document.documentElement.dataset.theme; },
      ls: function () { return "about  career/  skills/  projects/  offline/  resume.pdf"; },
      sudo: function (a) { return /hire/.test(a) ? '<span class="c">permission granted.</span> Opening LinkedIn…' + (window.open("https://www.linkedin.com/in/bhattvishal/", "_blank", "noopener"), "") : "nice try. 🙂 try: sudo hire vishal"; },
      clear: function () { body.innerHTML = ""; return null; },
      exit: function () { close(); return null; },
    };
    function open() {
      lastFocus = document.activeElement; term.hidden = false;
      if (!body.innerHTML) out('<span class="m">vishal-os ' + $("#fw").textContent + ' · connected from ' + esc(P.location) + '</span>\nType <span class="c">help</span> to list commands.\n');
      input.focus();
    }
    function close() { term.hidden = true; if (lastFocus) lastFocus.focus(); }
    $("#term-open").addEventListener("click", open);
    $("#cta-term").addEventListener("click", open);
    $("#term-close").addEventListener("click", close);
    term.addEventListener("click", function (e) { if (e.target === term) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "`" && term.hidden && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
      else if (e.key === "Escape" && !term.hidden) close();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
      if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; e.preventDefault(); }
    });
    $("#term-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = input.value.trim(); input.value = "";
      if (!raw) return;
      hist.push(raw); hi = hist.length;
      out('<span class="c">vishal@pune:~$</span> ' + esc(raw));
      var parts = raw.split(/\s+/), fn = cmds[parts[0].toLowerCase()];
      var res = fn ? fn(parts.slice(1).join(" ")) : "command not found: " + esc(parts[0]) + " — try <span class=\"c\">help</span>";
      if (res !== null) out(res + "\n");
    });
  })();
})();
