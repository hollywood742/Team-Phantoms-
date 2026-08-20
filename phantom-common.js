/* ============================================================
   phantom-common.js
   Shared logic for index.html / roster.html / events.html.
   Edit this file once and the change applies to every page that
   imports it — that's the whole point of splitting it out.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ---------------- Firebase ---------------- */
export const firebaseConfig = {
  apiKey: "AIzaSyC6i3NNQKLYc1tDD3txmpdGJpctFqTM-nI",
  authDomain: "the-phantoms-2026.firebaseapp.com",
  projectId: "the-phantoms-2026",
  storageBucket: "the-phantoms-2026.firebasestorage.app",
  messagingSenderId: "362336193601",
  appId: "1:362336193601:web:a9cbfd8c293df8b9d58ac0",
};
export const EDITOR_EMAIL = "gomezivj@gmail.com";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const docRef = doc(db, "site", "phantom");

/* ---------------- rank system ---------------- */
export const TIERS = [
  { key: "unranked", label: "Unranked", color: "#4b5563", divisions: [""] },
  { key: "bronze", label: "Bronze", color: "#c17a3d", divisions: ["I","II","III"] },
  { key: "silver", label: "Silver", color: "#b8c0c8", divisions: ["I","II","III"] },
  { key: "gold", label: "Gold", color: "#e0b23d", divisions: ["I","II","III"] },
  { key: "platinum", label: "Platinum", color: "#5fc4d9", divisions: ["I","II","III"] },
  { key: "diamond", label: "Diamond", color: "#5b9dff", divisions: ["I","II","III"] },
  { key: "champion", label: "Champion", color: "#c9b8f5", divisions: ["I","II","III"] },
  { key: "grand-champion", label: "Grand Champion", color: "#f2607a", divisions: ["I","II","III"] },
  { key: "ssl", label: "Supersonic Legend", color: "#e8e6f5", divisions: [""] },
];
export const tierByKey = (k) => TIERS.find((t) => t.key === k) || TIERS[0];

export const PLAYLISTS = [
  { key: "1v1", label: "1v1 Duel" },
  { key: "2v2", label: "2v2 Doubles" },
  { key: "3v3", label: "3v3 Standard" },
];
export function playlistRank(p, key) {
  return (p.ranks && p.ranks[key]) || { tier: "unranked", division: "", mmr: "" };
}

export const PLATFORMS = ["Steam", "PlayStation", "Xbox", "Epic"];

/* The stat fields shown in a player's profile modal.
   Add/remove/rename a row here and it updates on every page. */
export const STAT_ROWS = [
  ["Wins", "wins"],
  ["Goals", "goals"],
  ["Assists", "assists"],
  ["Saves", "saves"],
  ["Shots", "shots"],
  ["MVPs", "mvps"],
];

export function blankPlayer() {
  return {
    name: "New Player",
    captain: false,
    platform: "Steam",
    avatarDataUrl: null,
    ranks: {
      "1v1": { tier: "unranked", division: "", mmr: "" },
      "2v2": { tier: "unranked", division: "", mmr: "" },
      "3v3": { tier: "unranked", division: "", mmr: "" },
    },
    stats: { wins: 0, goals: 0, assists: 0, saves: 0, shots: 0, mvps: 0 },
  };
}

/* ---------------- default site data (fallback shape) ---------------- */
export const DEFAULT_DATA = {
  nav: ["HOME", "ROSTER", "STATS", "TOURNAMENTS", "ABOUT"],
  discordUrl: "#",
  logoDataUrl: null,
  hero: { l1: "COMPETE.", l2: "IMPROVE.", l3: "REPRESENT.", desc: "All ranks welcome.\nOne community.\nEndless potential." },
  statsSub: "All competitive ranked & scrim games played together as Team Phantom",
  teamStats: [
    { icon: "🎮", label: "GAMES PLAYED", value: "158", sub: "" },
    { icon: "🏆", label: "WINS - LOSSES", value: "102 - 56", sub: "64.6% WIN RATE" },
    { icon: "⚽", label: "GOALS / GAME", value: "2.76", sub: "" },
    { icon: "", label: "GOALS ALLOWED / GAME", value: "1.58", sub: "" },
    { icon: "", label: "SHOTS / GAME", value: "9.3", sub: "" },
    { icon: "✋", label: "SAVES / GAME", value: "4.7", sub: "" },
    { icon: "🤝", label: "ASSISTS / GAME", value: "1.8", sub: "" },
  ],
  roster: [],
  tournamentStats: [
    { icon: "🏳️", label: "TOURNAMENTS ENTERED", value: "12", sub: "" },
    { icon: "🏆", label: "TOURNAMENT RECORD", value: "21 - 9", sub: "70% WIN RATE" },
    { icon: "👑", label: "TOURNAMENT WINS", value: "3", sub: "" },
    { icon: "🥈", label: "FINALS APPEARANCES", value: "4", sub: "" },
    { icon: "🥇", label: "BEST PLACEMENT", value: "1ST", sub: "" },
    { icon: "🔥", label: "CURRENT STREAK", value: "W5", sub: "" },
  ],
  nextTournament: { name: "Phantom Open #4", month: "MAY", day: "31" },
  tournamentHistory: [],
  events: [],
  footerEst: "EST. 2024",
};

/* ---------------- live store ---------------- */
export let state = structuredClone(DEFAULT_DATA);
export let isEditing = false;

let saveTimer = null;
let suppressSnapshot = false;
let changeListeners = [];

function notify() {
  changeListeners.forEach((fn) => fn());
}

/** Call once per page with your top-level render function.
    It runs automatically whenever auth state or the Firestore doc changes. */
export function initStore(onChange) {
  changeListeners.push(onChange);
  onAuthStateChanged(auth, (user) => {
    isEditing = !!user;
    notify();
  });
  onSnapshot(
    docRef,
    async (snap) => {
      if (suppressSnapshot) return;
      if (snap.exists()) {
        state = snap.data();
      } else if (isEditing) {
        state = structuredClone(DEFAULT_DATA);
        await setDoc(docRef, state);
      } else {
        state = structuredClone(DEFAULT_DATA);
      }
      notify();
    },
    (err) => {
      console.error(err);
      notify();
    }
  );
}

export function scheduleSave() {
  if (!isEditing) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    suppressSnapshot = true;
    try {
      await setDoc(docRef, state);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => (suppressSnapshot = false), 600);
  }, 400);
}

export async function signIn(password) {
  await signInWithEmailAndPassword(auth, EDITOR_EMAIL, password);
}
export async function signOutEditor() {
  await signOut(auth);
}

/* ---------------- path helpers ---------------- */
export function setPath(obj, path, value) {
  const parts = path.split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    if (o[key] === undefined || o[key] === null) o[key] = {};
    o = o[key];
  }
  const last = parts[parts.length - 1];
  o[/^\d+$/.test(last) ? Number(last) : last] = value;
}
export function getPath(obj, path) {
  return path.split(".").reduce((o, p) => (o == null ? undefined : o[/^\d+$/.test(p) ? Number(p) : p]), obj);
}

/* ---------------- editable-field rendering ---------------- */
export function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
export function editable(path, value, extraStyle = "") {
  if (!isEditing) return `<span>${esc(value)}</span>`;
  return `<input class="edit-input" data-path="${path}" value="${esc(value)}" style="${extraStyle}">`;
}
export function editableSelect(path, value, options) {
  const opts = options.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("");
  return `<select data-path="${path}" ${isEditing ? "" : "disabled"} style="background:${isEditing ? "#15121f" : "transparent"};color:inherit;border:1px solid ${isEditing ? "#2a2438" : "transparent"};border-radius:6px;padding:4px 6px;font:inherit;">${opts}</select>`;
}
export function normalizeUrl(raw) {
  const s = (raw || "").trim();
  if (!s || s === "#") return "#";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s;
}

/* ---------------- roster row markup (shared by index + roster pages) ---------------- */
export function rosterRowHtml(p, i) {
  const r2 = playlistRank(p, "2v2");
  const tierLabel = tierByKey(r2.tier).label + (r2.division ? " " + r2.division : "");
  return `
    <tr>
      <td>
        <div class="player-cell">
          <div class="avatar" data-avatar-index="${i}" title="${isEditing ? "Click to change photo" : ""}" style="${p.avatarDataUrl ? `background-image:url('${p.avatarDataUrl}');background-size:cover;background-position:center;` : ""}">
            ${p.avatarDataUrl ? "" : "👻"}
            ${isEditing ? `<span class="avatar-edit-hint">✎</span>` : ""}
          </div>
          <div>
            <div class="player-name">
              <span class="tag">[PHNT] </span><button class="player-name-btn" data-player-index="${i}">${p.name}</button>
            </div>
            ${p.captain ? `<div class="captain-badge">CAPTAIN</div>` : ""}
          </div>
        </div>
      </td>
      <td style="position:relative;">
        <button class="rank-btn" data-rank-path="roster.${i}.ranks.2v2">
          <span class="rank-dot" style="background:${tierByKey(r2.tier).color}"></span>
          <span class="rank-label">${tierLabel}</span>
        </button>
        <div class="rank-mmr-row">
          ${editable(`roster.${i}.ranks.2v2.mmr`, r2.mmr ?? "", "width:56px;text-align:right;display:inline-block;")} MMR &middot; 2v2
        </div>
      </td>
      <td>${editableSelect(`roster.${i}.platform`, p.platform, PLATFORMS)}</td>
      <td><button class="icon-btn" data-remove="roster.${i}">✕</button></td>
    </tr>`;
}

/* ---------------- event row markup (shared by index + events pages) ---------------- */
export function eventRowHtml(ev, i) {
  return `
    <div class="event-row">
      <div class="event-date">
        <span class="mon">${editable(`events.${i}.month`, ev.month)}</span>
        <span class="day">${editable(`events.${i}.day`, ev.day)}</span>
      </div>
      <div style="flex:1;">
        <div class="event-title">${editable(`events.${i}.title`, ev.title)}</div>
        <div class="event-sub">${editable(`events.${i}.sub`, ev.sub)}</div>
      </div>
      <span class="event-ico">${ev.icon || "•"}</span>
      <button class="icon-btn" data-remove="events.${i}">✕</button>
    </div>`;
}

/* ---------------- rank picker popover ---------------- */
export function openRankPicker(btn, path, onDone) {
  document.querySelectorAll(".rank-popover").forEach((p) => p.remove());
  const pop = document.createElement("div");
  pop.className = "rank-popover";
  const current = getPath(state, path) || {};
  pop.innerHTML = TIERS.map(
    (t) => `
    <div class="rank-tier-label">${t.label.toUpperCase()}</div>
    <div>${t.divisions
      .map((d) => {
        const selected = current.tier === t.key && current.division === d;
        return `<button class="rank-opt ${selected ? "selected" : ""}" data-tier="${t.key}" data-division="${d}"><span class="rank-dot" style="background:${t.color}"></span><span>${d || t.label}</span></button>`;
      })
      .join("")}</div>
  `
  ).join("");
  pop.addEventListener("click", (e) => {
    const opt = e.target.closest(".rank-opt");
    if (!opt) return;
    setPath(state, path + ".tier", opt.dataset.tier);
    setPath(state, path + ".division", opt.dataset.division);
    pop.remove();
    scheduleSave();
    onDone?.();
  });
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect();
  pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 350) + "px";
  pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 310)) + "px";
}

/* ---------------- player profile modal ---------------- */
let currentPlayerModalIndex = null;
let modalRerender = null;

export function openPlayerModal(i, onDone) {
  currentPlayerModalIndex = i;
  modalRerender = onDone;
  renderPlayerModal();
  document.getElementById("player-modal-backdrop")?.classList.add("open");
}
export function closePlayerModal() {
  document.getElementById("player-modal-backdrop")?.classList.remove("open");
  currentPlayerModalIndex = null;
}
export function isPlayerModalOpen() {
  return currentPlayerModalIndex !== null;
}
export function renderPlayerModal() {
  const i = currentPlayerModalIndex;
  if (i === null || !state.roster[i]) return;
  const p = state.roster[i];
  const avatarEl = document.getElementById("player-modal-avatar");
  if (!avatarEl) return;
  if (p.avatarDataUrl) {
    avatarEl.style.backgroundImage = `url('${p.avatarDataUrl}')`;
    avatarEl.style.backgroundSize = "cover";
    avatarEl.style.backgroundPosition = "center";
    avatarEl.textContent = "";
  } else {
    avatarEl.style.backgroundImage = "none";
    avatarEl.textContent = "👻";
  }
  document.getElementById("player-modal-name-wrap").innerHTML = `
    <div style="font-size:16px;">${editable(`roster.${i}.name`, p.name)}</div>
    ${isEditing ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">Click photo to change</div>` : ""}
  `;
  document.getElementById("player-modal-ranks").innerHTML = PLAYLISTS.map((pl) => {
    const r = playlistRank(p, pl.key);
    const path = `roster.${i}.ranks.${pl.key}`;
    return `
      <div class="playlist-rank-row">
        <span class="playlist-label">${pl.label}</span>
        <button class="rank-btn" data-rank-path="${path}">
          <span class="rank-dot" style="background:${tierByKey(r.tier).color}"></span>
          <span class="rank-label">${tierByKey(r.tier).label}${r.division ? " " + r.division : ""}</span>
        </button>
        ${editable(`${path}.mmr`, r.mmr ?? "", "text-align:right;width:70px;display:inline-block;")} MMR
      </div>`;
  }).join("");
  const stats = p.stats || {};
  document.getElementById("player-modal-stats").innerHTML = `
    <div class="stat-list">
      ${STAT_ROWS.map(
        ([label, key]) => `
        <div class="stat-list-item">
          <span class="k">${label}</span>
          <span class="v">${editable(`roster.${i}.stats.${key}`, stats[key] ?? 0, "width:60px;text-align:right;")}</span>
        </div>`
      ).join("")}
    </div>
  `;
}
/** Call once per page (only if the page includes the player-modal markup). */
export function wirePlayerModal(rerender) {
  const closeBtn = document.getElementById("player-modal-close");
  const backdrop = document.getElementById("player-modal-backdrop");
  const avatarEl = document.getElementById("player-modal-avatar");
  if (!backdrop) return;
  closeBtn?.addEventListener("click", closePlayerModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target.id === "player-modal-backdrop") closePlayerModal();
  });
  avatarEl?.addEventListener("click", () => {
    if (!isEditing || currentPlayerModalIndex === null) return;
    pendingAvatarIndex = currentPlayerModalIndex;
    document.getElementById("avatar-upload-input")?.click();
  });
}

/* ---------------- avatar upload (shared) ---------------- */
let pendingAvatarIndex = null;
export function setPendingAvatarIndex(i) {
  pendingAvatarIndex = i;
}
/** Call once per page (only if the page includes an <input id="avatar-upload-input">). */
export function wireAvatarUpload(rerender) {
  const input = document.getElementById("avatar-upload-input");
  if (!input) return;
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || pendingAvatarIndex === null || !isEditing) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const sw = size / scale,
          sh = size / scale;
        const sx = (img.width - sw) / 2,
          sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        state.roster[pendingAvatarIndex].avatarDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        scheduleSave();
        rerender();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });
}

/* ---------------- global DOM wiring (shared by every page) ----------------
   Handles: text/number field commits, <select> commits, remove-row buttons,
   rank picker open, player-name click, avatar click, rank-popover dismiss.
   Call once per page with your top-level render function. */
export function wireGlobalInteractions(rerender) {
  document.addEventListener(
    "blur",
    (e) => {
      const t = e.target;
      if (t.matches && t.matches(".edit-input") && t.dataset.path) {
        setPath(state, t.dataset.path, t.value);
        scheduleSave();
      }
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.target.matches?.(".edit-input") && e.target.tagName === "INPUT" && e.key === "Enter") {
      e.target.blur();
      rerender();
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches?.("select[data-path]")) {
      setPath(state, e.target.dataset.path, e.target.value);
      scheduleSave();
      rerender();
    }
  });

  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm && isEditing) {
      const path = rm.dataset.remove;
      const lastDot = path.lastIndexOf(".");
      const arrName = path.slice(0, lastDot);
      const idx = Number(path.slice(lastDot + 1));
      state[arrName].splice(idx, 1);
      scheduleSave();
      rerender();
      return;
    }
    const rankBtn = e.target.closest(".rank-btn");
    if (rankBtn) {
      if (!isEditing) return;
      openRankPicker(rankBtn, rankBtn.dataset.rankPath, rerender);
      return;
    }
    const nameBtn = e.target.closest(".player-name-btn");
    if (nameBtn) {
      openPlayerModal(Number(nameBtn.dataset.playerIndex), rerender);
      return;
    }
    const avatarEl = e.target.closest(".avatar[data-avatar-index]");
    if (avatarEl) {
      if (!isEditing) return;
      pendingAvatarIndex = Number(avatarEl.dataset.avatarIndex);
      document.getElementById("avatar-upload-input")?.click();
      return;
    }
    if (!e.target.closest(".rank-popover") && !e.target.closest(".rank-btn")) {
      document.querySelectorAll(".rank-popover").forEach((p) => p.remove());
    }
  });
}

/* ---------------- login modal + lock icon (shared by every page) ---------------- */
export function wireLoginUI() {
  const backdrop = document.getElementById("login-backdrop");
  const lockFab = document.getElementById("lock-fab");
  if (!backdrop || !lockFab) return;
  lockFab.addEventListener("click", () => {
    if (isEditing) {
      signOutEditor();
      return;
    }
    backdrop.classList.add("open");
  });
  document.getElementById("login-cancel")?.addEventListener("click", () => backdrop.classList.remove("open"));
  document.getElementById("login-pass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("login-submit")?.click();
  });
  document.getElementById("login-submit")?.addEventListener("click", async () => {
    const pass = document.getElementById("login-pass").value;
    const errEl = document.getElementById("login-err");
    errEl.textContent = "";
    try {
      await signIn(pass);
      backdrop.classList.remove("open");
    } catch (e) {
      errEl.textContent = "Sign-in failed. Check your password.";
    }
  });
}

/** Updates the lock icon, "editing as..." footer text, and live/connecting dot.
    Call this inside your page's render() function. */
export function renderAuthChrome() {
  const lockFab = document.getElementById("lock-fab");
  if (lockFab) lockFab.textContent = isEditing ? "🔓" : "🔒";
  const info = document.getElementById("editor-info");
  if (info) {
    info.textContent = isEditing ? `Editing as ${EDITOR_EMAIL} — click any field to change it.` : "Sign in to edit this page.";
  }
  document.body.classList.toggle("editing", isEditing);
  const dot = document.getElementById("sync-dot");
  const text = document.getElementById("sync-text");
  if (dot) dot.classList.remove("off");
  if (text) text.textContent = "Live";
}

/** Updates the nav-bar Join Discord button's href on every page. */
export function renderDiscordButtons() {
  const url = normalizeUrl(state.discordUrl);
  document.querySelectorAll("[data-discord-btn]").forEach((el) => (el.href = url));
}
