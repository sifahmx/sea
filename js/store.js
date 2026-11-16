/*
 * Storage layer.
 *  - "server" mode: used automatically when the site is hosted on a PHP server with api.php.
 *    All devices share the same data.
 *  - "local" mode: fallback when opened directly from disk or on a host without PHP.
 *    Data is saved in this browser only (use Admin > Data & Backup to move it).
 */
window.Store = (() => {
  const LS = { settings: "stt_settings", trips: "stt_trips", pin: "stt_pin", staffAcc: "stt_staff_accounts", staffSession: "stt_staff_session" };
  const SS_PIN = "stt_admin_pin";
  const STAFF_DAYS = 30; // staff stay logged in on a device for 30 days
  let mode = "local";

  function staffSession() {
    const s = lsGet(LS.staffSession, null);
    if (!s || !s.name || (s.exp && s.exp < Date.now())) return null;
    return s;
  }
  function clearStaff() { try { localStorage.removeItem(LS.staffSession); } catch { /* ignore */ } }

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function merge(def, saved) {
    if (Array.isArray(def)) return Array.isArray(saved) ? saved : clone(def);
    if (def && typeof def === "object") {
      const out = {};
      for (const k of Object.keys(def)) out[k] = merge(def[k], saved ? saved[k] : undefined);
      return out;
    }
    return saved === undefined || saved === null ? def : saved;
  }

  function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { throw new Error("Browser storage is full. Use smaller images or move to server mode."); }
  }

  async function api(action, body) {
    const opts = { cache: "no-store", headers: {} };
    const pin = sessionStorage.getItem(SS_PIN);
    if (pin) opts.headers["X-Admin-Pin"] = pin;
    const st = staffSession();
    if (st && st.token) opts.headers["X-Staff-Token"] = st.token;
    if (body !== undefined) {
      opts.method = "POST";
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const r = await fetch("api.php?action=" + encodeURIComponent(action), opts);
    let j;
    try { j = await r.json(); } catch { throw new Error("Server error (" + r.status + ")"); }
    if (r.status === 401) clearStaff(); // staff session expired or PIN was reset
    if (!r.ok || !j.ok) {
      const err = new Error(j.error || "Request failed");
      err.status = r.status;
      throw err;
    }
    return j;
  }

  function sanitizeTrip(t) {
    const s = (v, n = 200) => String(v ?? "").trim().slice(0, n);
    const num = (v) => (v === "" || v === null || v === undefined || isNaN(+v) ? "" : +v);
    return {
      id: s(t.id, 40), no: t.no || 0,
      date: s(t.date, 10), boat: s(t.boat), department: s(t.department),
      start: s(t.start, 5), end: s(t.end, 5), hours: num(t.hours),
      details: s(t.details, 2000),
      staff: (Array.isArray(t.staff) ? t.staff : []).map((x) => s(x, 100)).filter(Boolean),
      fuelTopUp: num(t.fuelTopUp), fuelUsed: num(t.fuelUsed),
      submittedBy: s(t.submittedBy, 100),
      createdAt: t.createdAt || "", updatedAt: t.updatedAt || ""
    };
  }

  return {
    get mode() { return mode; },

    async init() {
      if (location.protocol.startsWith("http")) {
        try {
          const r = await fetch("api.php?action=ping", { cache: "no-store" });
          const j = await r.json();
          if (j && j.ok) mode = "server";
        } catch { /* no PHP available, stay local */ }
      }
    },

    async getSettings() {
      const saved = mode === "server" ? (await api("settings")).settings : lsGet(LS.settings, null);
      return merge(window.DEFAULTS, saved || {});
    },

    async saveSettings(settings) {
      if (mode === "server") await api("settings_save", { settings });
      else lsSet(LS.settings, settings);
    },

    async listTrips() {
      const trips = mode === "server" ? (await api("trips")).trips : lsGet(LS.trips, []);
      return trips.sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start) || b.no - a.no);
    },

    async saveTrip(trip) {
      const t = sanitizeTrip(trip);
      if (mode === "server") return (await api("trip_save", { trip: t })).trip;
      const trips = lsGet(LS.trips, []);
      const now = new Date().toISOString();
      const i = trips.findIndex((x) => x.id === t.id);
      if (t.id && i >= 0) {
        trips[i] = { ...trips[i], ...t, no: trips[i].no, submittedBy: trips[i].submittedBy || "", createdAt: trips[i].createdAt, updatedAt: now };
        lsSet(LS.trips, trips);
        return trips[i];
      }
      const who = staffSession();
      if (!who && !this.isAdmin()) throw new Error("Please log in to add a trip");
      t.submittedBy = who ? who.name : "Admin";
      t.id = uid();
      t.no = trips.reduce((m, x) => Math.max(m, x.no || 0), 0) + 1;
      t.createdAt = t.updatedAt = now;
      trips.push(t);
      lsSet(LS.trips, trips);
      return t;
    },

    async deleteTrip(id) {
      if (mode === "server") return api("trip_delete", { id });
      lsSet(LS.trips, lsGet(LS.trips, []).filter((x) => x.id !== id));
    },

    async clearTrips() {
      if (mode === "server") return api("trips_clear", {});
      lsSet(LS.trips, []);
    },

    async importAll(data) {
      const trips = (data.trips || []).map(sanitizeTrip);
      if (mode === "server") return api("import", { settings: data.settings || null, trips });
      if (data.settings) lsSet(LS.settings, data.settings);
      lsSet(LS.trips, trips);
    },

    /* ---- Admin PIN ---- */
    isAdmin() { return !!sessionStorage.getItem(SS_PIN); },
    logout() { sessionStorage.removeItem(SS_PIN); },

    async login(pin) {
      if (mode === "server") {
        await api("auth", { pin });
      } else if (pin !== (lsGet(LS.pin, null) || "1197")) {
        throw new Error("Incorrect PIN");
      }
      sessionStorage.setItem(SS_PIN, pin);
    },

    async changePin(newPin) {
      if (mode === "server") await api("pin_change", { newPin });
      else lsSet(LS.pin, newPin);
      sessionStorage.setItem(SS_PIN, newPin);
    },

    /* ---- Staff login ---- */
    currentStaff() { return staffSession(); },

    async staffLogin(name, pin) {
      let session;
      if (mode === "server") {
        const j = await api("staff_login", { name, pin });
        session = { name: j.name, token: j.token, exp: j.exp * 1000 };
      } else {
        const acc = lsGet(LS.staffAcc, {});
        if (!acc[name] || acc[name] !== pin) throw new Error("Incorrect name or PIN");
        session = { name, exp: Date.now() + STAFF_DAYS * 864e5 };
      }
      lsSet(LS.staffSession, session);
      return session;
    },

    async staffLogout() {
      if (mode === "server") { try { await api("staff_logout", {}); } catch { /* ignore */ } }
      clearStaff();
    },

    /* Admin: which staff names have a login PIN */
    async staffAccounts() {
      if (mode === "server") return (await api("staff_accounts", {})).names;
      return Object.keys(lsGet(LS.staffAcc, {}));
    },

    /* Admin: set (or remove, when pin is "") the login PIN for one or more staff */
    async setStaffPin(names, pin) {
      if (mode === "server") return api("staff_account_set", { names, newPin: pin });
      const acc = lsGet(LS.staffAcc, {});
      names.forEach((n) => { if (pin) acc[n] = pin; else delete acc[n]; });
      lsSet(LS.staffAcc, acc);
      const cur = staffSession();
      if (cur && names.includes(cur.name)) clearStaff();
    }
  };
})();
