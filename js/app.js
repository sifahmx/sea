(function () {
  "use strict";

  /* ================= Helpers ================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const today = () => new Date().toLocaleDateString("en-CA");
  const thisMonth = () => today().slice(0, 7);

  function calcHours(s, e) {
    if (!s || !e) return "";
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    let m = eh * 60 + em - (sh * 60 + sm);
    if (m < 0) m += 1440; // trip passes midnight
    return Math.round((m / 60) * 100) / 100;
  }
  function fmtHrs(h) {
    if (h === "" || h == null || isNaN(h)) return "—";
    const m = Math.round(h * 60);
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  }
  function fmtDate(d) {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    return isNaN(dt) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function fmtTime(t) {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
  const initials = (n) => String(n || "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const num = (v, d = 2) => (v === "" || v == null || isNaN(v) ? "—" : (+v).toLocaleString(undefined, { maximumFractionDigits: d }));
  const sum = (arr, k) => arr.reduce((t, x) => t + (+x[k] || 0), 0);

  function toast(msg, type = "ok") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast show " + type;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (el.className = "toast"), 3200);
  }

  function setPath(obj, path, val) {
    const keys = path.split(".");
    let o = obj;
    keys.slice(0, -1).forEach((k) => (o = o[k]));
    o[keys[keys.length - 1]] = val;
  }
  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function resizeImage(file, maxW, type = "image/jpeg") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL(type, 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================= Icons ================= */
  const I = (p, extra = "") => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  const ICON = {
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    list: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    print: I('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
    lock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    home: I('<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    edit: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    trash: I('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
    download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>'),
    upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>'),
    left: I('<path d="m15 18-6-6 6-6"/>'),
    right: I('<path d="m9 18 6-6-6-6"/>'),
    up: I('<path d="m18 15-6-6-6 6"/>'),
    down: I('<path d="m6 9 6 6 6-6"/>'),
    check: I('<path d="M20 6 9 17l-5-5"/>'),
    clock: I('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    fuel: I('<path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M3 22h12M15 10h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V8l-3-3"/><path d="M7 7h4"/>'),
    boat: I('<path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M4 15 3 11h18l-2 4"/><path d="M8 11V7h7l3 4"/>'),
    users: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    menu: I('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
    phone: I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    mail: I('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    pin: I('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    user: I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    calendar: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    building: I('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>'),
    play: I('<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>'),
    stop: I('<circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" rx="1"/>'),
    hourglass: I('<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>'),
    note: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>'),
    dropPlus: I('<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/><path d="M12 11v6M9 14h6"/>'),
    drop: I('<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/>'),
    userCheck: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>'),
    hash: I('<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>'),
    login: I('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>')
  };

  const DEFAULT_LOGO = `<svg class="logo-mark" viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="13" fill="var(--primary)"/>
    <path d="M14 26l3.5-6h10l4 6z" fill="#fff" opacity=".9"/>
    <path d="M8 26h32l-4.5 6h-23z" fill="#fff"/>
    <path d="M7 37c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>
  </svg>`;

  const HERO_ART = `
    <svg class="hero-boat" viewBox="0 0 420 220" aria-hidden="true">
      <g class="bob">
        <path d="M118 112 152 78h104l34 34z" fill="#fff" opacity=".88"/>
        <path d="M166 86h30v18h-38zM204 86h44l14 18h-58z" fill="currentColor" opacity=".55"/>
        <path d="M24 112h372l-36 40H62z" fill="#fff"/>
        <path d="M62 152h298l-6 7H70z" fill="#fff" opacity=".5"/>
        <path d="M70 128h270" stroke="currentColor" stroke-width="4" opacity=".35" stroke-linecap="round"/>
      </g>
      <path d="M0 170c30 0 30-10 60-10s30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M20 196c30 0 30-10 60-10s30 10 60 10 30-10 60-10 30 10 60 10 30-10 60-10 30 10 60 10" stroke="#fff" stroke-width="4" fill="none" opacity=".2" stroke-linecap="round"/>
    </svg>`;

  const WAVES = `<svg class="hero-waves" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 64c120 28 240 42 360 28S600 30 720 30s240 46 360 52 240-24 360-36v74H0z" fill="#fff" opacity=".12"/>
      <path d="M0 88c160 20 320 24 480 8s320-44 480-36 320 40 480 36v24H0z" fill="var(--bg)"/>
    </svg>`;

  /* ================= State ================= */
  let S = null; // site settings
  let sliderTimer = null;
  const app = () => $("#app");

  function logoHTML() {
    return S.site.logo ? `<img class="logo-mark" src="${esc(S.site.logo)}" alt="">` : DEFAULT_LOGO;
  }

  function applyTheme() {
    const r = document.documentElement.style;
    r.setProperty("--primary", S.site.primary || "#0e7490");
    r.setProperty("--accent", S.site.accent || "#f59e0b");
    document.title = `${S.site.name} · ${S.site.tagline}`;
    $('meta[name="theme-color"]').setAttribute("content", S.site.primary);
  }

  /* ================= Header & Footer ================= */
  let NAV = [];
  const F = (k) => esc(S.labels.fields[k]);   // editable field label
  const P = (k) => esc(S.labels.pages[k]);    // editable page text

  function renderShell() {
    const n = S.labels.nav;
    NAV = [["", n.home], ["new", n.new], ["records", n.records], ["print", n.print]].map(([p, l]) => [p, esc(l)]);
    $("#site-header").innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="#/">${logoHTML()}
          <span class="brand-text"><strong>${esc(S.site.name)}</strong><small>${esc(S.site.tagline)}</small></span>
        </a>
        <button class="icon-btn menu-btn" aria-label="Menu" aria-expanded="false">${ICON.menu}</button>
        <nav class="nav" id="nav">
          ${NAV.map(([p, l]) => `<a href="#/${p}" data-nav="${p}">${l}</a>`).join("")}
          <a href="#/admin" data-nav="admin" class="nav-admin">${ICON.lock}<span>${esc(n.admin)}</span></a>
          ${staffNavHTML(n)}
          <a href="#/new" class="btn btn-primary btn-sm nav-cta">${ICON.plus} ${esc(n.cta)}</a>
        </nav>
      </div>`;

    const out = $("#staff-logout");
    if (out) out.onclick = async () => {
      await Store.staffLogout();
      toast("Logged out");
      renderShell();
      location.hash = "#/";
    };

    const btn = $(".menu-btn");
    btn.onclick = () => {
      const open = $("#site-header").classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      btn.innerHTML = open ? ICON.x : ICON.menu;
    };

    const f = S.footer;
    const contact = [
      f.phone && `<li>${ICON.phone}<a href="tel:${esc(f.phone)}">${esc(f.phone)}</a></li>`,
      f.email && `<li>${ICON.mail}<a href="mailto:${esc(f.email)}">${esc(f.email)}</a></li>`,
      f.address && `<li>${ICON.pin}<span>${esc(f.address)}</span></li>`
    ].filter(Boolean).join("");

    $("#site-footer").innerHTML = `
      <div class="container footer-grid">
        <div class="footer-brand">
          <a class="brand brand-lg" href="#/">${logoHTML()}
            <span class="brand-text"><strong>${esc(S.site.name)}</strong><small>${esc(S.site.tagline)}</small></span>
          </a>
          <p>${esc(f.about)}</p>
        </div>
        ${contact ? `<div><h4>Contact</h4><ul class="footer-contact">${contact}</ul></div>` : ""}
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} ${esc(S.site.name)}. ${esc(f.copyright)}</span>
        <span class="mode-pill" title="${Store.mode === "server" ? "Data is shared across all devices" : "Data is saved in this browser only"}">
          <i class="dot ${Store.mode}"></i>${Store.mode === "server" ? "Online database" : "Saved on this device"}
        </span>
      </div>`;
  }

  function staffNavHTML(n) {
    const me = Store.currentStaff();
    if (!me) return `<a href="#/login" data-nav="login" class="nav-login">${ICON.login}<span>${esc(n.login)}</span></a>`;
    return `<span class="nav-user" title="Logged in as ${esc(me.name)}">
        <span class="avatar">${esc(me.name.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</span>
        <span class="nav-user-name">${esc(me.name)}</span>
        <button class="icon-btn" id="staff-logout" title="Log out" aria-label="Log out">${ICON.logout}</button>
      </span>`;
  }

  function setActiveNav(path) {
    $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === path));
    $("#site-header").classList.remove("open");
    const b = $(".menu-btn");
    if (b) { b.innerHTML = ICON.menu; b.setAttribute("aria-expanded", "false"); }
  }

  /* ================= Router ================= */
  const routes = { "": pageHome, new: pageForm, edit: pageForm, records: pageRecords, print: pagePrint, admin: pageAdmin, login: pageStaffLogin };

  async function route() {
    clearInterval(sliderTimer);
    document.body.classList.remove("print-landscape");
    const [path = "", arg] = location.hash.replace(/^#\/?/, "").split("/");
    const fn = routes[path] || pageHome;
    setActiveNav(routes[path] ? path : "");
    try {
      await fn(arg ? decodeURIComponent(arg) : undefined);
    } catch (e) {
      console.error(e);
      app().innerHTML = `<section class="container page"><div class="card empty"><h2>Something went wrong</h2><p>${esc(e.message)}</p><a class="btn" href="#/">Go home</a></div></section>`;
    }
    const a = app();
    a.classList.remove("fade-in");
    void a.offsetWidth; // restart the animation
    a.classList.add("fade-in");
    window.scrollTo({ top: 0 });
  }

  /* ================= Home ================= */
  async function pageHome() {
    const trips = await Store.listTrips().catch(() => []);
    const month = trips.filter((t) => (t.date || "").startsWith(thisMonth()));
    const featureIcons = [ICON.plus, ICON.list, ICON.print];
    const featureTones = ["t-teal", "t-blue", "t-amber"];
    const unit = esc(S.site.fuelUnit);
    const monthName = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const me = Store.currentStaff();
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const tot = (cls, icon, label, value, sub) => `
      <div class="tot ${cls}"><span class="tot-ic">${icon}</span>
        <div><small>${label}</small><b>${value}</b><em>${sub}</em></div></div>`;
    const recent = trips.slice(0, 5);

    app().innerHTML = `
      <section class="container welcome">
        <span class="welcome-date">${ICON.calendar}${esc(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</span>
        <h1>${greet}${me ? `, ${esc(me.name.split(" ")[0])}` : ""}</h1>
      </section>

      <section class="container totals home-totals">
        ${tot("t-teal", ICON.boat, "Trips", month.length, monthName)}
        ${tot("t-blue", ICON.hourglass, "Trip hours", num(sum(month, "hours"), 1), monthName)}
        ${tot("t-amber", ICON.drop, "Fuel used", `${num(sum(month, "fuelUsed"), 0)} ${unit}`, monthName)}
        ${tot("t-green", ICON.list, "All trips", trips.length, "Since the start")}
      </section>

      <section class="container section section-tight">
        <div class="features">
          ${S.home.features.map((f, i) => `
            <a class="feature card ${featureTones[i % 3]}" href="${esc(f.link)}">
              <span class="feature-ic">${featureIcons[i % 3]}</span>
              <h3>${esc(f.title)}</h3>
              <p>${esc(f.text)}</p>
              <span class="feature-link">Open ${ICON.right}</span>
            </a>`).join("")}
        </div>
      </section>

      <section class="container section section-tight">
        <div class="card recent">
          <div class="recent-head">
            <h2>${ICON.clock} Recent trips</h2>
            <a class="btn btn-sm" href="#/records">View all ${ICON.right}</a>
          </div>
          ${recent.length ? `<ul class="recent-list">
            ${recent.map((t) => `<li>
              <span class="recent-ic">${ICON.boat}</span>
              <div class="recent-main">
                <b>${esc(t.boat)} <span class="badge">#${t.no}</span></b>
                <small>${esc(t.department)}</small>
              </div>
              <div class="recent-when">
                <b>${esc(fmtDate(t.date))}</b>
                <small>${esc(fmtTime(t.start))} – ${esc(fmtTime(t.end))}</small>
              </div>
              <span class="hrs-pill">${ICON.hourglass}${num(t.hours)} h</span>
              <div class="avatar-stack" title="${esc((t.staff || []).join(", "))}">
                ${(t.staff || []).slice(0, 4).map((n) => `<span class="avatar">${esc(initials(n))}</span>`).join("")}
                ${(t.staff || []).length > 4 ? `<span class="avatar more">+${t.staff.length - 4}</span>` : ""}
              </div>
            </li>`).join("")}
          </ul>` : `<div class="recent-empty"><p class="muted">No trips yet.</p><a class="btn btn-primary" href="#/new">${ICON.plus} Log the first trip</a></div>`}
        </div>
      </section>`;

  }

  function initSlider(count) {
    const track = $(".hero-track");
    if (!track || count < 2) return;
    const dots = $$(".hero-dots button");
    let i = 0;
    const go = (n) => {
      i = (n + count) % count;
      track.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      $$(".slide", track).forEach((s, k) => s.classList.toggle("current", k === i));
    };
    const play = () => { clearInterval(sliderTimer); sliderTimer = setInterval(() => go(i + 1), 6000); };
    $(".hero-arrow.prev").onclick = () => { go(i - 1); play(); };
    $(".hero-arrow.next").onclick = () => { go(i + 1); play(); };
    dots.forEach((d) => (d.onclick = () => { go(+d.dataset.i); play(); }));
    const hero = $(".hero");
    hero.onmouseenter = () => clearInterval(sliderTimer);
    hero.onmouseleave = play;
    let x0 = null;
    hero.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    hero.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); play(); }
      x0 = null;
    });
    go(0);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  }

  /* ================= Trip form ================= */
  async function pageForm(id) {
    let trip = null;
    if (id) {
      if (!Store.isAdmin()) return lockedMessage("Editing a trip needs the admin PIN.");
      trip = (await Store.listTrips()).find((t) => t.id === id);
      if (!trip) { toast("Trip not found", "err"); location.hash = "#/records"; return; }
    }
    const me = Store.currentStaff();
    if (!trip && !me && !Store.isAdmin()) { location.hash = "#/login/new"; return; }
    // a new trip starts with the logged-in staff member already selected
    const t = trip || { date: today(), staff: me && S.lists.staff.includes(me.name) ? [me.name] : [] };
    const L = S.lists;
    const known = new Set(L.staff);
    const otherStaff = (t.staff || []).filter((n) => !known.has(n));
    const opt = (list, v) => `<option value="">Select…</option>` + list.map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("") +
      (v && !list.includes(v) ? `<option selected>${esc(v)}</option>` : "");

    app().innerHTML = `
      <section class="page-hero"><div class="container">
        <h1>${trip ? `Edit Trip #${trip.no}` : esc(S.form.title)}</h1>
        <p>${esc(S.form.intro)}</p>
        ${!trip ? `<span class="who-pill">${ICON.user} ${me ? `Logged in as <b>${esc(me.name)}</b>` : "Adding as <b>Admin</b>"}</span>` : ""}
      </div></section>
      <section class="container page">
        <form id="trip-form" class="card form" novalidate>
          <div class="form-section">
            <h3><span class="step t-teal">${ICON.boat}</span> Trip</h3>
            <div class="grid g3">
              <label class="field"><span>${F("date")} *</span><input type="date" name="date" value="${esc(t.date)}" required></label>
              <label class="field"><span>${F("boat")} *</span><select name="boat" required>${opt(L.boats, t.boat)}</select></label>
              <label class="field"><span>${F("department")} *</span><select name="department" required>${opt(L.departments, t.department)}</select></label>
            </div>
          </div>

          <div class="form-section">
            <h3><span class="step t-blue">${ICON.clock}</span> Time</h3>
            <div class="grid g3">
              <label class="field"><span>${F("start")} *</span><input type="time" name="start" value="${esc(t.start)}" required></label>
              <label class="field"><span>${F("end")} *</span><input type="time" name="end" value="${esc(t.end)}" required></label>
              <div class="field"><span>${F("hours")}</span>
                <div class="hours-box" id="hours-box"><b id="hours-val">—</b><small id="hours-fmt"></small></div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3><span class="step t-amber">${ICON.note}</span> ${F("details")}</h3>
            <label class="field"><span>${F("details")}</span>
              <textarea name="details" rows="3" placeholder="Route, purpose, islands visited…">${esc(t.details)}</textarea>
            </label>
          </div>

          <div class="form-section">
            <h3><span class="step t-green">${ICON.users}</span> ${F("staff")} * <small class="muted" id="staff-count"></small></h3>
            <input type="search" class="staff-search" placeholder="Search staff…" aria-label="Search staff">
            <div class="chips" id="staff-chips">
              ${L.staff.map((n) => `<label class="chip"><input type="checkbox" name="staff" value="${esc(n)}" ${(t.staff || []).includes(n) ? "checked" : ""}><span>${ICON.check}${esc(n)}</span></label>`).join("")}
            </div>
            <label class="field mt"><span>${F("otherStaff")} <small class="muted">(separate with commas)</small></span>
              <input type="text" name="otherStaff" value="${esc(otherStaff.join(", "))}" placeholder="e.g. Ali Ahmed, Aishath Mohamed">
            </label>
          </div>

          <div class="form-section">
            <h3><span class="step t-amber">${ICON.fuel}</span> Fuel</h3>
            <div class="grid g2">
              <label class="field"><span>${F("fuelTopUp")} (${esc(S.site.fuelUnit)})</span><input type="number" name="fuelTopUp" min="0" step="0.01" inputmode="decimal" value="${esc(t.fuelTopUp)}" placeholder="0"></label>
              <label class="field"><span>${F("fuelUsed")} (${esc(S.site.fuelUnit)})</span><input type="number" name="fuelUsed" min="0" step="0.01" inputmode="decimal" value="${esc(t.fuelUsed)}" placeholder="0"></label>
            </div>
          </div>

          <div class="form-actions">
            <a class="btn btn-ghost" href="${trip ? "#/records" : "#/"}">Cancel</a>
            <button class="btn btn-primary btn-lg" type="submit">${ICON.check} ${trip ? "Save Changes" : "Submit Trip"}</button>
          </div>
        </form>
      </section>`;

    const form = $("#trip-form");
    const updHours = () => {
      const h = calcHours(form.start.value, form.end.value);
      $("#hours-val").textContent = h === "" ? "—" : `${h.toFixed(2)} hrs`;
      $("#hours-fmt").textContent = h === "" ? "Set start & end time" : fmtHrs(h);
    };
    const updCount = () => {
      const n = $$('input[name="staff"]:checked', form).length;
      $("#staff-count").textContent = n ? `· ${n} selected` : "";
    };
    form.start.oninput = form.end.oninput = updHours;
    form.onchange = updCount;
    $(".staff-search").oninput = (e) => {
      const q = e.target.value.toLowerCase();
      $$(".chip", form).forEach((c) => (c.hidden = !c.textContent.toLowerCase().includes(q)));
    };
    updHours(); updCount();

    form.onsubmit = async (e) => {
      e.preventDefault();
      $$(".invalid", form).forEach((x) => x.classList.remove("invalid"));
      const staff = $$('input[name="staff"]:checked', form).map((x) => x.value)
        .concat(form.otherStaff.value.split(",").map((x) => x.trim()).filter(Boolean));
      const data = {
        id: trip ? trip.id : "",
        date: form.date.value, boat: form.boat.value, department: form.department.value,
        start: form.start.value, end: form.end.value, hours: calcHours(form.start.value, form.end.value),
        details: form.details.value, staff,
        fuelTopUp: form.fuelTopUp.value, fuelUsed: form.fuelUsed.value
      };
      const missing = ["date", "boat", "department", "start", "end"].filter((k) => !data[k]);
      missing.forEach((k) => form[k].closest(".field").classList.add("invalid"));
      if (!staff.length) $("#staff-chips").classList.add("invalid");
      if (missing.length || !staff.length) {
        toast("Please fill in all required fields", "err");
        (form[missing[0]] || $(".staff-search")).focus();
        return;
      }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      try {
        const saved = await Store.saveTrip(data);
        if (trip) { toast("Trip updated"); location.hash = "#/records"; return; }
        showSuccess(saved);
      } catch (err) {
        if (err.status === 401) {
          // login expired or PIN was reset by admin: keep their data and ask to log in again
          toast("Your login has expired. Please log in again.", "err");
          renderShell();
          location.hash = "#/login/new";
          return;
        }
        toast(err.message, "err");
        btn.disabled = false;
      }
    };
  }

  /* ================= Staff login ================= */
  async function pageStaffLogin(next) {
    const me = Store.currentStaff();
    if (me) { location.hash = "#/" + (next || "new"); return; }
    app().innerHTML = `
      <section class="container page narrow">
        <form class="card login" id="staff-login" novalidate>
          <div class="login-logo">${logoHTML()}</div>
          <h1>${P("loginTitle")}</h1>
          <p class="muted">${P("loginText")}</p>
          <label class="field"><span>Your name</span>
            <select name="staffName" required>
              <option value="">Select your name…</option>
              ${S.lists.staff.map((n) => `<option>${esc(n)}</option>`).join("")}
            </select>
          </label>
          <label class="field"><span>PIN</span><input type="password" name="pin" inputmode="numeric" autocomplete="current-password" required></label>
          <button class="btn btn-primary btn-lg block" type="submit">${ICON.login} Log in</button>
          <p class="muted small">No PIN yet? Ask your admin to set one for you.</p>
        </form>
      </section>`;
    const f = $("#staff-login");
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.staffName.value) { toast("Please select your name", "err"); f.staffName.focus(); return; }
      if (!f.pin.value) { toast("Please enter your PIN", "err"); f.pin.focus(); return; }
      const btn = $('button[type="submit"]', f);
      btn.disabled = true;
      try {
        const s = await Store.staffLogin(f.staffName.value, f.pin.value);
        toast(`Welcome, ${s.name}`);
        renderShell();
        location.hash = "#/" + (next || "new");
      } catch (err) {
        toast(err.message, "err");
        btn.disabled = false;
        f.pin.select();
      }
    };
  }

  function showSuccess(t) {
    app().innerHTML = `
      <section class="container page narrow">
        <div class="card success">
          <div class="success-ic">${ICON.check}</div>
          <h1>${P("successTitle")}</h1>
          <p>Trip <b>#${t.no}</b> on ${esc(fmtDate(t.date))} with <b>${esc(t.boat)}</b> has been saved.</p>
          <dl class="summary">
            <div><dt>Total hours</dt><dd>${fmtHrs(t.hours)}</dd></div>
            <div><dt>Staff</dt><dd>${t.staff.length}</dd></div>
            <div><dt>Fuel used</dt><dd>${num(t.fuelUsed)} ${esc(S.site.fuelUnit)}</dd></div>
          </dl>
          <div class="btn-row center">
            <button class="btn btn-primary" id="log-another">${ICON.plus} Log another</button>
            <a class="btn" href="#/print/${encodeURIComponent(t.id)}">${ICON.print} Print slip</a>
            <a class="btn btn-ghost" href="#/records">${ICON.list} View records</a>
          </div>
        </div>
      </section>`;
    $("#log-another").onclick = () => { pageForm(); window.scrollTo({ top: 0 }); };
    window.scrollTo({ top: 0 });
  }

  function lockedMessage(msg) {
    app().innerHTML = `<section class="container page narrow"><div class="card empty">
      <div class="success-ic muted-ic">${ICON.lock}</div><h2>Admin only</h2><p>${esc(msg)}</p>
      <a class="btn btn-primary" href="#/admin">Unlock admin</a></div></section>`;
  }

  /* ================= Records ================= */
  const filters = { q: "", month: "", boat: "", dept: "" };

  async function pageRecords() {
    const all = await Store.listTrips();
    const admin = Store.isAdmin();
    const L = S.lists;
    const boats = [...new Set([...L.boats, ...all.map((t) => t.boat)])].filter(Boolean);
    const depts = [...new Set([...L.departments, ...all.map((t) => t.department)])].filter(Boolean);
    const sel = (list, v) => `<option value="">All</option>` + list.map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("");

    app().innerHTML = `
      <section class="page-hero"><div class="container">
        <h1>${P("recordsTitle")}</h1>
        <p>${P("recordsText")}</p>
      </div></section>
      <section class="container page wide">
        <div class="card toolbar no-print">
          <label class="field"><span>Search</span><input type="search" id="f-q" value="${esc(filters.q)}" placeholder="Staff, details, trip no…"></label>
          <label class="field"><span>Month</span><input type="month" id="f-month" value="${esc(filters.month)}"></label>
          <label class="field"><span>${F("boat")}</span><select id="f-boat">${sel(boats, filters.boat)}</select></label>
          <label class="field"><span>${F("department")}</span><select id="f-dept">${sel(depts, filters.dept)}</select></label>
          <div class="toolbar-actions">
            <button class="btn btn-ghost btn-sm" id="f-clear">Clear</button>
            <button class="btn btn-sm" id="b-csv">${ICON.download} Excel / CSV</button>
            <button class="btn btn-sm" id="b-print">${ICON.print} Print</button>
          </div>
        </div>
        <div class="print-only print-title">
          <h2>${esc(S.site.name)} — ${P("recordsTitle")}</h2><p id="print-filters"></p>
        </div>
        <div class="totals" id="totals"></div>
        <div id="records"></div>
      </section>`;

    const draw = () => {
      const q = filters.q.toLowerCase();
      const rows = all.filter((t) =>
        (!filters.month || (t.date || "").startsWith(filters.month)) &&
        (!filters.boat || t.boat === filters.boat) &&
        (!filters.dept || t.department === filters.dept) &&
        (!q || [t.no, t.boat, t.department, t.details, (t.staff || []).join(" "), t.date, t.submittedBy].join(" ").toLowerCase().includes(q))
      );
      draw.rows = rows;
      const unit = esc(S.site.fuelUnit);
      const tot = (cls, icon, label, value, sub) => `
        <div class="tot ${cls}"><span class="tot-ic">${icon}</span>
          <div><small>${label}</small><b>${value}</b>${sub ? `<em>${sub}</em>` : ""}</div></div>`;
      const hrs = sum(rows, "hours");
      $("#totals").innerHTML =
        tot("t-teal", ICON.boat, "Trips", rows.length, rows.length ? `${new Set(rows.map((r) => r.boat)).size} boats used` : "") +
        tot("t-blue", ICON.hourglass, "Total hours", num(hrs), rows.length ? fmtHrs(hrs) : "") +
        tot("t-green", ICON.dropPlus, F("fuelTopUp"), `${num(sum(rows, "fuelTopUp"))} ${unit}`, "") +
        tot("t-amber", ICON.drop, F("fuelUsed"), `${num(sum(rows, "fuelUsed"))} ${unit}`, "");
      $("#print-filters").textContent = [filters.month && `Month: ${filters.month}`, filters.boat && `Boat: ${filters.boat}`, filters.dept && `Department: ${filters.dept}`, filters.q && `Search: ${filters.q}`].filter(Boolean).join(" · ") || "All records";

      if (!rows.length) {
        $("#records").innerHTML = `<div class="card empty"><div class="success-ic muted-ic">${ICON.list}</div>
          <h2>${all.length ? "No matching trips" : "No trips yet"}</h2>
          <p>${all.length ? "Try changing the filters." : "Trips you submit will appear here."}</p>
          <a class="btn btn-primary" href="#/new">${ICON.plus} Log a Trip</a></div>`;
        return;
      }
      $("#records").innerHTML = `
        <div class="table-wrap card">
          <table class="table">
            <thead><tr>
              <th>${ICON.hash}No</th><th>${ICON.calendar}${F("date")}</th><th>${ICON.boat}${F("boat")}</th><th>${ICON.building}${F("department")}</th>
              <th>${ICON.clock}Time</th><th>${ICON.note}${F("details")}</th><th>${ICON.users}${F("staff")}</th>
              <th>${ICON.fuel}Fuel</th><th>${ICON.userCheck}${F("submittedBy")}</th><th class="no-print"></th>
            </tr></thead>
            <tbody>
              ${rows.map((t) => {
                const d = new Date(t.date + "T00:00:00");
                const weekday = isNaN(d) ? "" : d.toLocaleDateString("en-GB", { weekday: "long" });
                return `<tr>
                <td data-l="No"><span class="badge">#${t.no}</span></td>
                <td data-l="${F("date")}" class="nowrap"><div class="cell-2"><b>${esc(fmtDate(t.date))}</b><small>${weekday}</small></div></td>
                <td data-l="${F("boat")}" class="nowrap"><span class="boat-tag">${ICON.boat}${esc(t.boat)}</span></td>
                <td data-l="${F("department")}" class="dept"><span class="dept-tag">${esc(t.department)}</span></td>
                <td data-l="Time" class="nowrap">
                  <div class="time-cell">
                    <span class="time t-start" title="${F("start")}"><i></i>${esc(fmtTime(t.start))}</span>
                    <span class="time t-end" title="${F("end")}"><i></i>${esc(fmtTime(t.end))}</span>
                    <span class="hrs-pill" title="${F("hours")}">${ICON.hourglass}${num(t.hours)} h · ${fmtHrs(t.hours)}</span>
                  </div>
                </td>
                <td data-l="${F("details")}" class="details">${t.details ? `<span class="clamp">${esc(t.details)}</span>` : `<span class="muted">—</span>`}</td>
                <td data-l="${F("staff")}" class="staff"><div class="people">${(t.staff || []).map((n) => `<span class="person"><span class="avatar">${esc(initials(n))}</span>${esc(n)}</span>`).join("")}</div></td>
                <td data-l="Fuel" class="nowrap">
                  <div class="fuel-cell">
                    <span class="fuel f-up" title="${F("fuelTopUp")}">${ICON.dropPlus}${t.fuelTopUp === "" || t.fuelTopUp == null ? "—" : `${num(t.fuelTopUp)} ${unit}`}</span>
                    <span class="fuel f-used" title="${F("fuelUsed")}">${ICON.drop}${t.fuelUsed === "" || t.fuelUsed == null ? "—" : `${num(t.fuelUsed)} ${unit}`}</span>
                  </div>
                </td>
                <td data-l="${F("submittedBy")}" class="nowrap">${t.submittedBy ? `<span class="person plain"><span class="avatar sm">${esc(initials(t.submittedBy))}</span>${esc(t.submittedBy)}</span>` : `<span class="muted">—</span>`}</td>
                <td class="actions no-print">
                  <a class="icon-btn" title="Print slip" href="#/print/${encodeURIComponent(t.id)}">${ICON.print}</a>
                  ${admin ? `<a class="icon-btn" title="Edit" href="#/edit/${encodeURIComponent(t.id)}">${ICON.edit}</a>
                  <button class="icon-btn danger" title="Delete" data-del="${esc(t.id)}" data-no="${t.no}">${ICON.trash}</button>` : ""}
                </td>
              </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
        ${admin ? "" : `<p class="muted small no-print">${ICON.lock} Unlock <a href="#/admin">Admin</a> to edit or delete trips.</p>`}`;
    };

    const bind = (id, key, ev = "input") => ($("#" + id)[`on${ev}`] = (e) => { filters[key] = e.target.value; draw(); });
    bind("f-q", "q"); bind("f-month", "month"); bind("f-boat", "boat", "change"); bind("f-dept", "dept", "change");
    $("#f-clear").onclick = () => { Object.keys(filters).forEach((k) => (filters[k] = "")); pageRecords(); };
    $("#b-print").onclick = () => { document.body.classList.add("print-landscape"); window.print(); };
    $("#b-csv").onclick = () => exportCSV(draw.rows);
    $("#records").onclick = async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      if (!confirm(`Delete trip #${b.dataset.no}? This cannot be undone.`)) return;
      try { await Store.deleteTrip(b.dataset.del); toast("Trip deleted"); pageRecords(); }
      catch (err) { toast(err.message, "err"); }
    };
    draw();
  }

  function exportCSV(rows) {
    const f = S.labels.fields;
    const head = ["No", f.date, f.boat, f.department, f.start, f.end, f.details, f.hours, f.staff, `${f.fuelTopUp} (${S.site.fuelUnit})`, `${f.fuelUsed} (${S.site.fuelUnit})`, f.submittedBy];
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.map(cell).join(",")].concat(rows.map((t) =>
      [t.no, t.date, t.boat, t.department, t.start, t.end, t.details, t.hours, (t.staff || []).join("; "), t.fuelTopUp, t.fuelUsed, t.submittedBy].map(cell).join(",")));
    download(`trips-${filters.month || today()}.csv`, "﻿" + lines.join("\r\n"), "text/csv;charset=utf-8");
  }

  /* ================= Print forms (physical) ================= */
  let printMode = "slip";

  async function pagePrint(id) {
    let trip = null;
    if (id) trip = (await Store.listTrips()).find((t) => t.id === id) || null;

    app().innerHTML = `
      <section class="page-hero no-print"><div class="container">
        <h1>${trip ? `${P("slipTitle")} #${trip.no}` : P("printTitle")}</h1>
        <p>${trip ? "Print or save this trip as PDF." : P("printText")}</p>
      </div></section>
      <section class="container page">
        <div class="print-controls no-print">
          ${trip ? `<a class="btn btn-ghost" href="#/records">${ICON.left} Back to records</a>` : `
          <div class="segmented" role="tablist">
            <button data-m="slip" class="${printMode === "slip" ? "on" : ""}">Single trip slip</button>
            <button data-m="sheet" class="${printMode === "sheet" ? "on" : ""}">Monthly log sheet</button>
          </div>`}
          <button class="btn btn-primary" id="do-print">${ICON.print} Print${trip ? "" : " blank form"}</button>
        </div>
        <div class="paper-wrap"><div class="paper" id="paper"></div></div>
      </section>`;

    const draw = () => {
      const sheet = !trip && printMode === "sheet";
      document.body.classList.toggle("print-landscape", sheet);
      $("#paper").className = "paper" + (sheet ? " landscape" : "");
      $("#paper").innerHTML = sheet ? logSheetHTML() : slipHTML(trip);
    };
    $$(".segmented button").forEach((b) => (b.onclick = () => {
      printMode = b.dataset.m;
      $$(".segmented button").forEach((x) => x.classList.toggle("on", x === b));
      draw();
    }));
    $("#do-print").onclick = () => window.print();
    draw();
  }

  function paperHead(title, sub) {
    return `<div class="p-head">
      <div class="brand">${logoHTML()}<span class="brand-text"><strong>${esc(S.site.name)}</strong><small>${esc(S.site.tagline)}</small></span></div>
      <div class="p-title"><h2>${esc(title)}</h2><small>${sub}</small></div>
    </div>`;
  }

  function slipHTML(t) {
    const L = S.lists;
    const box = (on) => `<i class="cb ${on ? "on" : ""}"></i>`;
    const val = (v) => `<span class="p-line">${v ? esc(v) : "&nbsp;"}</span>`;
    const staff = t ? t.staff : [];
    const extra = t ? staff.filter((n) => !L.staff.includes(n)) : [];
    return `
      ${paperHead(S.labels.pages.slipTitle, t ? `Trip No. <b>#${t.no}</b>` : "Trip No. ________")}
      <div class="p-grid p3">
        <div class="p-f"><label>${F("date")}</label>${val(t && fmtDate(t.date))}</div>
        <div class="p-f"><label>${F("start")}</label>${val(t && fmtTime(t.start))}</div>
        <div class="p-f"><label>${F("end")}</label>${val(t && fmtTime(t.end))}</div>
        <div class="p-f"><label>${F("hours")}</label>${val(t && `${num(t.hours)} hrs (${fmtHrs(t.hours)})`)}</div>
        <div class="p-f"><label>${F("fuelTopUp")} (${esc(S.site.fuelUnit)})</label>${val(t && num(t.fuelTopUp))}</div>
        <div class="p-f"><label>${F("fuelUsed")} (${esc(S.site.fuelUnit)})</label>${val(t && num(t.fuelUsed))}</div>
      </div>

      <div class="p-block"><label>${F("boat")}</label>
        <div class="p-checks c4">${L.boats.map((b) => `<span>${box(t && t.boat === b)}${esc(b)}</span>`).join("")}</div>
      </div>

      <div class="p-block"><label>${F("department")}</label>
        <div class="p-checks c2 small">${L.departments.map((d) => `<span>${box(t && t.department === d)}${esc(d)}</span>`).join("")}</div>
      </div>

      <div class="p-block"><label>${F("staff")}</label>
        <div class="p-checks c3">${L.staff.map((n) => `<span>${box(staff.includes(n))}${esc(n)}</span>`).join("")}</div>
        <div class="p-f mt-s"><label>${F("otherStaff")}</label>${val(extra.join(", "))}</div>
      </div>

      <div class="p-block"><label>${F("details")}</label>
        ${t && t.details ? `<div class="p-text">${esc(t.details)}</div>` : `<span class="p-line"></span><span class="p-line"></span><span class="p-line"></span>`}
      </div>

      <div class="p-sign">
        <div><span class="p-line"></span><small>Captain / Driver</small></div>
        <div><span class="p-line"></span><small>Requested by</small></div>
        <div><span class="p-line"></span><small>Approved by</small></div>
      </div>`;
  }

  function logSheetHTML() {
    const cols = ["date", "boat", "department", "start", "end", "hours", "details", "staff", "fuelTopUp", "fuelUsed"].map(F).concat("Sign");
    return `
      ${paperHead(S.labels.pages.sheetTitle, `Month: ______________ &nbsp; ${F("boat")}: ______________`)}
      <table class="p-table">
        <colgroup><col style="width:7%"><col style="width:9%"><col style="width:12%"><col style="width:6%"><col style="width:6%"><col style="width:5%"><col style="width:18%"><col style="width:20%"><col style="width:6%"><col style="width:6%"><col style="width:5%"></colgroup>
        <thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${Array.from({ length: 12 }, () => `<tr>${cols.map(() => "<td></td>").join("")}</tr>`).join("")}</tbody>
      </table>
      <div class="p-sign">
        <div><span class="p-line"></span><small>Prepared by</small></div>
        <div><span class="p-line"></span><small>Checked by</small></div>
        <div><span class="p-line"></span><small>Approved by</small></div>
      </div>`;
  }

  /* ================= Admin ================= */
  let adminTab = "general";
  let draft = null;

  async function pageAdmin() {
    if (!Store.isAdmin()) return adminLogin();
    draft = clone(S);
    const tabs = [["general", "Branding"],["home", "Home Page"], ["labels", "Pages & Labels"], ["lists", "Lists"], ["staff", "Staff Logins"], ["footer", "Footer"], ["data", "Data & Backup"], ["security", "Security"]];

    app().innerHTML = `
      <section class="page-hero"><div class="container admin-head">
        <div><h1>Admin</h1><p>Edit any text, image, colour or list on the website.</p></div>
        <button class="btn btn-ghost-light btn-sm" id="logout">${ICON.logout} Lock</button>
      </div></section>
      <section class="container page admin">
        <nav class="admin-tabs" role="tablist">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${adminTab === k ? "on" : ""}">${l}</button>`).join("")}</nav>
        <div class="card admin-panel" id="panel"></div>
      </section>`;

    $("#logout").onclick = () => { Store.logout(); toast("Admin locked"); location.hash = "#/"; };
    $$(".admin-tabs button").forEach((b) => (b.onclick = () => {
      adminTab = b.dataset.tab;
      $$(".admin-tabs button").forEach((x) => x.classList.toggle("on", x === b));
      drawPanel();
    }));

    const panel = $("#panel");
    panel.oninput = (e) => {
      const el = e.target;
      if (el.dataset.path) setPath(draft, el.dataset.path, el.value);
      if (el.dataset.list) {
        draft.lists[el.dataset.list] = [...new Set(el.value.split("\n").map((x) => x.trim()).filter(Boolean))];
        const c = $(`[data-count="${el.dataset.list}"]`);
        if (c) c.textContent = draft.lists[el.dataset.list].length;
      }
    };
    panel.onchange = async (e) => {
      const el = e.target;
      if (el.dataset.img && el.files[0]) {
        try {
          const isLogo = el.dataset.img === "site.logo";
          setPath(draft, el.dataset.img, await resizeImage(el.files[0], isLogo ? 600 : 1800, isLogo ? "image/png" : "image/jpeg"));
          drawPanel();
        } catch { toast("Could not read that image", "err"); }
      }
    };
    panel.onclick = async (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const i = +b.dataset.i;
      const act = b.dataset.act;
      if (act === "save") return saveDraft();
      if (act === "clear-img") { setPath(draft, b.dataset.path, ""); drawPanel(); }
      if (act === "slide-add") { draft.hero.push({ title: "New slide", text: "", button: "", link: "#/new", image: "", gradient: window.DEFAULTS.hero[draft.hero.length % 3].gradient }); drawPanel(); }
      if (act === "slide-del" && confirm("Remove this slide?")) { draft.hero.splice(i, 1); drawPanel(); }
      if (act === "slide-up" && i > 0) { [draft.hero[i - 1], draft.hero[i]] = [draft.hero[i], draft.hero[i - 1]]; drawPanel(); }
      if (act === "slide-down" && i < draft.hero.length - 1) { [draft.hero[i + 1], draft.hero[i]] = [draft.hero[i], draft.hero[i + 1]]; drawPanel(); }
      if (act === "reset-section") {
        if (!confirm("Reset this section to the original content?")) return;
        b.dataset.keys.split(",").forEach((k) => (draft[k] = clone(window.DEFAULTS[k])));
        drawPanel();
      }
      if (act === "export") {
        const trips = await Store.listTrips();
        download(`sea-transport-backup-${today()}.json`, JSON.stringify({ version: 1, exported: new Date().toISOString(), settings: S, trips }, null, 2), "application/json");
      }
      if (act === "import") $("#import-file").click();
      if (act === "clear-trips") {
        if (prompt('Type DELETE to permanently remove ALL trip records.') !== "DELETE") return;
        try { await Store.clearTrips(); toast("All trips deleted"); } catch (err) { toast(err.message, "err"); }
      }
      if (act === "staff-set" || act === "staff-remove") {
        const name = b.dataset.name;
        const input = b.closest(".acc-row").querySelector("input");
        const pin = act === "staff-remove" ? "" : input.value.trim();
        if (act === "staff-set" && pin.length < 4) return toast("PIN must be at least 4 characters", "err");
        if (act === "staff-remove" && !confirm(`Remove login for ${name}? They will not be able to add trips.`)) return;
        try {
          await Store.setStaffPin([name], pin);
          toast(pin ? `PIN set for ${name}` : `Login removed for ${name}`);
          drawPanel();
        } catch (err) { toast(err.message, "err"); }
      }
      if (act === "staff-bulk") {
        const pin = $("#bulk-pin").value.trim();
        if (pin.length < 4) return toast("PIN must be at least 4 characters", "err");
        const names = $$(".acc-row[data-active='0']").map((r) => r.dataset.name);
        if (!names.length) return toast("Every staff member already has a login");
        if (!confirm(`Give this starting PIN to ${names.length} staff without a login?`)) return;
        try { await Store.setStaffPin(names, pin); toast(`Logins created for ${names.length} staff`); drawPanel(); }
        catch (err) { toast(err.message, "err"); }
      }
      if (act === "pin") {
        const a = $("#pin1").value, c = $("#pin2").value;
        if (a.length < 4) return toast("PIN must be at least 4 characters", "err");
        if (a !== c) return toast("PINs do not match", "err");
        try { await Store.changePin(a); toast("PIN changed"); $("#pin1").value = $("#pin2").value = ""; } catch (err) { toast(err.message, "err"); }
      }
    };
    drawPanel();
  }

  async function loadStaffAccounts() {
    const box = $("#acc-list");
    let active;
    try { active = new Set(await Store.staffAccounts()); }
    catch (err) { box.innerHTML = `<p class="muted">${esc(err.message)}</p>`; return; }
    if (!box.isConnected) return;
    const count = S.lists.staff.filter((n) => active.has(n)).length;
    box.innerHTML = `
      <p class="acc-summary"><b>${count}</b> of ${S.lists.staff.length} staff can log in</p>
      ${S.lists.staff.map((n) => {
        const on = active.has(n);
        return `<div class="acc-row" data-name="${esc(n)}" data-active="${on ? 1 : 0}">
          <div class="acc-name"><span class="avatar">${esc(n.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</span>
            <div><b>${esc(n)}</b><small class="status ${on ? "on" : ""}">${on ? "Can log in" : "No login yet"}</small></div></div>
          <input type="text" inputmode="numeric" autocomplete="off" placeholder="${on ? "New PIN" : "Set PIN"}" aria-label="PIN for ${esc(n)}">
          <div class="acc-btns">
            <button class="btn btn-sm btn-primary" data-act="staff-set" data-name="${esc(n)}">${on ? "Change" : "Set PIN"}</button>
            ${on ? `<button class="icon-btn danger" data-act="staff-remove" data-name="${esc(n)}" title="Remove login">${ICON.trash}</button>` : ""}
          </div>
        </div>`;
      }).join("")}`;
  }

  async function saveDraft() {
    try {
      await Store.saveSettings(draft);
      S = clone(draft);
      applyTheme();
      renderShell();
      setActiveNav("admin");
      toast("Changes saved — live on the website");
    } catch (err) { toast(err.message, "err"); }
  }

  function adminLogin() {
    app().innerHTML = `
      <section class="container page narrow">
        <form class="card login" id="login">
          <div class="success-ic">${ICON.lock}</div>
          <h1>Admin</h1>
          <p class="muted">Enter the admin PIN to edit the website.</p>
          <label class="field"><span>PIN</span><input type="password" name="pin" inputmode="numeric" autocomplete="current-password" required autofocus></label>
          <button class="btn btn-primary btn-lg block" type="submit">Unlock</button>        </form>
      </section>`;
    $("#login").onsubmit = async (e) => {
      e.preventDefault();
      try { await Store.login(e.target.pin.value); toast("Welcome, admin"); pageAdmin(); }
      catch (err) { toast(err.message, "err"); e.target.pin.select(); }
    };
  }

  const fText = (label, path, opts = {}) => `<label class="field ${opts.cls || ""}"><span>${label}</span>${opts.area
    ? `<textarea data-path="${path}" rows="${opts.rows || 2}">${esc(getPath(draft, path))}</textarea>`
    : `<input type="${opts.type || "text"}" data-path="${path}" value="${esc(getPath(draft, path))}" ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ""}>`}</label>`;

  const LINK_OPTS = [["#/new", "Log Trip page"], ["#/records", "Records page"], ["#/print", "Print Forms page"], ["#/", "Home"]];
  const fLink = (label, path) => {
    const v = getPath(draft, path) || "";
    const known = LINK_OPTS.some(([h]) => h === v);
    return `<label class="field"><span>${label}</span><select data-path="${path}">
      ${LINK_OPTS.map(([h, l]) => `<option value="${h}" ${h === v ? "selected" : ""}>${l}</option>`).join("")}
      ${!known && v ? `<option value="${esc(v)}" selected>${esc(v)}</option>` : ""}</select></label>`;
  };

  const fImage = (label, path, hint) => {
    const v = getPath(draft, path);
    return `<div class="field"><span>${label}</span>
      <div class="img-field">
        <div class="img-preview">${v ? `<img src="${esc(v)}" alt="">` : `<small>None</small>`}</div>
        <div class="img-btns">
          <label class="btn btn-sm">${ICON.upload} Upload<input type="file" accept="image/*" data-img="${path}" hidden></label>
          ${v ? `<button type="button" class="btn btn-ghost btn-sm" data-act="clear-img" data-path="${path}">Remove</button>` : ""}
          <small class="muted">${hint}</small>
        </div>
      </div></div>`;
  };

  const saveBar = (resetKeys) => `<div class="save-bar">
    ${resetKeys ? `<button class="btn btn-ghost btn-sm" data-act="reset-section" data-keys="${resetKeys}">Reset to original</button>` : "<span></span>"}
    <button class="btn btn-primary" data-act="save">${ICON.check} Save changes</button></div>`;

  function drawPanel() {
    const p = $("#panel");
    const d = draft;
    const T = {
      general: () => `
        <h2>Branding</h2>
        <div class="grid g2">
          ${fText("Website name", "site.name")}
          ${fText("Tagline", "site.tagline")}
        </div>
        ${fImage("Logo", "site.logo", "Square image works best. Leave empty for the built-in logo.")}
        <div class="grid g3">
          <label class="field"><span>Main colour</span><input type="color" data-path="site.primary" value="${esc(d.site.primary)}"></label>
          <label class="field"><span>Accent colour</span><input type="color" data-path="site.accent" value="${esc(d.site.accent)}"></label>
          ${fText("Fuel unit", "site.fuelUnit", { ph: "L" })}
        </div>
        <h3>Trip form</h3>
        <div class="grid g2">
          ${fText("Form title", "form.title")}
          ${fText("Form introduction", "form.intro")}
        </div>
        ${saveBar("site,form")}`,

      hero: () => `
        <h2>Hero Slider</h2>
        <p class="muted">Slides rotate every 6 seconds on the home page. Upload a photo or keep the ocean colour background.</p>
        ${d.hero.map((s, i) => `
          <div class="slide-edit">
            <div class="slide-edit-head">
              <b>Slide ${i + 1}</b>
              <div>
                <button type="button" class="icon-btn" data-act="slide-up" data-i="${i}" title="Move up">${ICON.up}</button>
                <button type="button" class="icon-btn" data-act="slide-down" data-i="${i}" title="Move down">${ICON.down}</button>
                <button type="button" class="icon-btn danger" data-act="slide-del" data-i="${i}" title="Remove">${ICON.trash}</button>
              </div>
            </div>
            <div class="grid g2">
              ${fText("Heading", `hero.${i}.title`)}
              ${fText("Text", `hero.${i}.text`)}
              ${fText("Button label (leave empty to hide)", `hero.${i}.button`)}
              ${fLink("Button goes to", `hero.${i}.link`)}
            </div>
            ${fImage("Background photo", `hero.${i}.image`, "Wide photo, at least 1600px.")}
          </div>`).join("")}
        <button type="button" class="btn btn-sm" data-act="slide-add">${ICON.plus} Add slide</button>
        ${saveBar("hero")}`,

      home: () => `
        <h2>Home Page</h2>
        ${d.home.features.map((f, i) => `<div class="slide-edit"><b>Card ${i + 1}</b>
          <div class="grid g2">${fText("Title", `home.features.${i}.title`)}${fLink("Links to", `home.features.${i}.link`)}</div>
          ${fText("Text", `home.features.${i}.text`, { area: true })}</div>`).join("")}
        ${saveBar("home")}`,

      labels: () => `
        <h2>Pages & Labels</h2>
        <p class="muted">Rename menu items, page titles and the field names used in the form, records, Excel export and paper forms.</p>
        <h3>Menu</h3>
        <div class="grid g3">
          ${[["home", "Home"], ["new", "Log Trip"], ["records", "Records"], ["print", "Print Forms"], ["admin", "Admin"], ["login", "Staff Login"], ["cta", "Header button"]]
            .map(([k, l]) => fText(l, `labels.nav.${k}`)).join("")}
        </div>
        <h3>Form fields</h3>
        <div class="grid g3">
          ${Object.keys(window.DEFAULTS.labels.fields).map((k) => fText(esc(window.DEFAULTS.labels.fields[k]), `labels.fields.${k}`)).join("")}
        </div>
        <h3>Pages</h3>
        <div class="grid g2">
          ${fText("Records page title", "labels.pages.recordsTitle")}
          ${fText("Records page text", "labels.pages.recordsText")}
          ${fText("Print page title", "labels.pages.printTitle")}
          ${fText("Print page text", "labels.pages.printText")}
          ${fText("Paper trip slip title", "labels.pages.slipTitle")}
          ${fText("Paper log sheet title", "labels.pages.sheetTitle")}
          ${fText("Message after submitting", "labels.pages.successTitle")}
          ${fText("Staff login title", "labels.pages.loginTitle")}
          ${fText("Staff login text", "labels.pages.loginText")}
        </div>
        ${saveBar("labels")}`,

      lists: () => `
        <h2>Lists</h2>
        <p class="muted">One item per line. Changes appear in the trip form and the paper forms. Duplicates are removed automatically.</p>
        <div class="grid g3 lists">
          ${[["staff", "Staff Names"], ["departments", "Departments"], ["boats", "Speedboats"]].map(([k, l]) => `
            <label class="field"><span>${l} <small class="muted">(<b data-count="${k}">${d.lists[k].length}</b>)</small></span>
            <textarea data-list="${k}" rows="18">${esc(d.lists[k].join("\n"))}</textarea></label>`).join("")}
        </div>
        ${saveBar("lists")}`,

      staff: () => `
        <h2>Staff Logins</h2>
        <p class="muted">Staff must log in with their name and PIN before they can add a trip. Set a PIN for each person below.
        Staff come from <b>Lists › Staff Names</b>. Changing or removing a PIN logs that person out.</p>
        <div class="bulk-row">
          <label class="field"><span>Quick setup: give a starting PIN to everyone without a login</span>
            <input type="text" id="bulk-pin" inputmode="numeric" placeholder="e.g. 2468" autocomplete="off"></label>
          <button class="btn" data-act="staff-bulk">${ICON.users} Create logins</button>
        </div>
        <div id="acc-list" class="acc-list"><p class="muted">Loading…</p></div>`,

      footer: () => `
        <h2>Footer</h2>
        ${fText("About text", "footer.about", { area: true })}
        <div class="grid g3">
          ${fText("Phone", "footer.phone", { type: "tel" })}
          ${fText("Email", "footer.email", { type: "email" })}
          ${fText("Address", "footer.address")}
        </div>
        ${fText("Copyright line", "footer.copyright")}
        ${saveBar("footer")}`,

      data: () => `
        <h2>Data & Backup</h2>
        <div class="info ${Store.mode}">
          <b>${Store.mode === "server" ? "Online database (shared)" : "Saved on this device only"}</b>
          <p>${Store.mode === "server"
            ? "Trips and settings are stored on the server in the data folder. Every phone and computer sees the same records."
            : "Trips are stored in this browser. Upload the website to a PHP host (with api.php) to share data across devices, or use backup/restore below to move data."}</p>
        </div>
        <div class="data-actions">
          <div><h3>Backup</h3><p class="muted">Download all trips and website settings as one file.</p>
            <button class="btn" data-act="export">${ICON.download} Download backup</button></div>
          <div><h3>Restore</h3><p class="muted">Replace all data with a backup file.</p>
            <button class="btn" data-act="import">${ICON.upload} Restore from file</button>
            <input type="file" id="import-file" accept="application/json,.json" hidden></div>
          <div><h3>Delete all trips</h3><p class="muted">Permanently remove every trip record.</p>
            <button class="btn btn-danger" data-act="clear-trips">${ICON.trash} Delete all trips</button></div>
        </div>`,

      security: () => `
        <h2>Security</h2>
        <p class="muted">The admin PIN protects website editing and editing/deleting trips. Anyone can submit a new trip.</p>
        <div class="grid g2 narrow-grid">
          <label class="field"><span>New PIN</span><input type="password" id="pin1" autocomplete="new-password"></label>
          <label class="field"><span>Confirm new PIN</span><input type="password" id="pin2" autocomplete="new-password"></label>
        </div>
        <button class="btn btn-primary" data-act="pin">Change PIN</button>`
    };
    p.innerHTML = T[adminTab]();
    if (adminTab === "staff") loadStaffAccounts();

    const imp = $("#import-file");
    if (imp) imp.onchange = async () => {
      const f = imp.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!Array.isArray(data.trips)) throw new Error("Not a valid backup file");
        if (!confirm(`Restore ${data.trips.length} trips${data.settings ? " and website settings" : ""}? Current data will be replaced.`)) return;
        await Store.importAll(data);
        S = await Store.getSettings();
        applyTheme(); renderShell(); toast("Backup restored"); pageAdmin();
      } catch (err) { toast(err.message, "err"); }
      imp.value = "";
    };
  }

  /* ================= Boot ================= */
  async function boot() {
    await Store.init();
    try { S = await Store.getSettings(); }
    catch (e) { console.error(e); S = clone(window.DEFAULTS); }
    applyTheme();
    renderShell();
    window.addEventListener("hashchange", route);
    route();
  }
  boot();
})();
