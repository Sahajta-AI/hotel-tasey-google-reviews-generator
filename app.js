import { TOPICS } from "./reviews.js";
import { suggest } from "./generator.js";

// Google "write a review" box for The Tasey hotel (Place ID from its Google listing).
// To swap it, paste the "Ask for reviews" link from Google Business Profile here.
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJP3B1WyqxbTkROyWe-jVb9fY";
const WHATSAPP_NUMBER = "917073873670";
const STAR_LABELS = ["", "Very bad", "Not good", "Okay", "Good", "Loved it"];
const ISSUES = ["Room", "Cleanliness", "Food", "Staff", "Noise", "Check-in", "Other"];
const STEPS = { rate: 1, like: 2, pick: 3, ready: 4 };
// The hotel's food highlights get a full-width tile with a short note.
const TILE_NOTES = { veg: "Our kitchen is 100% vegetarian", jain: "No onion, no garlic, no root vegetables" };
const SEEN_KEY = "tasey-seen";
const DONE_KEY = "tasey-done";

const ICONS = {
  veg: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3"/>',
  jain: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7.5c0-1.5 1-2 1-3.5"/><path d="M12 7.5c0-1.5 1-2 1-3.5"/><path d="M16 7.5c0-1.5 1-2 1-3.5"/>',
  rooms: '<path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 16h18"/><path d="M12 5v5"/>',
  food: '<path d="M4 3v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3"/><path d="M7 3v18"/><path d="M20 15V3a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h2zm0 0v6"/>',
  pool: '<path d="M2 8c1.7 1.3 3.3 1.3 5 0s3.3-1.3 5 0 3.3 1.3 5 0 3.3-1.3 5 0"/><path d="M2 13c1.7 1.3 3.3 1.3 5 0s3.3-1.3 5 0 3.3 1.3 5 0 3.3-1.3 5 0"/><path d="M2 18c1.7 1.3 3.3 1.3 5 0s3.3-1.3 5 0 3.3 1.3 5 0 3.3-1.3 5 0"/>',
  staff: '<path d="M3 19h18"/><path d="M5 16a7 7 0 0 1 14 0"/><path d="M12 6V4"/><path d="M10 4h4"/>',
  clean: '<path d="M11 3l1.8 4.7L17.5 9.5l-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M18 14v6"/><path d="M15 17h6"/>',
  views: '<path d="M2 20l6.5-10 4.5 6.5 3-4 6 7.5z"/><circle cx="17" cy="6" r="2"/>',
  location: '<path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0z"/><circle cx="12" cy="10" r="2.6"/>',
  events: '<path d="M8 21h8"/><path d="M12 15v6"/><path d="M7 3h10l-.6 6.2A4.4 4.4 0 0 1 12 13a4.4 4.4 0 0 1-4.4-3.8z"/><path d="M7.4 7h9.2"/>',
  value: '<path d="M6 4h12"/><path d="M6 9h12"/><path d="M6 14h3c6 0 6-10 0-10"/><path d="M6 14l8 7"/>',
  family: '<circle cx="9" cy="7" r="3.2"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20"/><path d="M16 4.3a3.2 3.2 0 0 1 0 5.9"/><path d="M21 20v-1.5a4.5 4.5 0 0 0-3-4.2"/>',
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const svgStar = (on = true) => `<svg viewBox="0 0 24 24" class="${on ? "" : "off"}" aria-hidden="true"><use href="#star"/></svg>`;
const buzz = () => navigator.vibrate?.(8);

const state = { stars: 0, visit: "", topics: [], ideas: [], picked: -1, ideasFor: "", issues: [], screen: "rate" };

// ---------- Storage (both optional; the page works without them) ----------

function readSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
}
function rememberSeen(ids) {
  try {
    const seen = readSeen();
    ids.forEach((id) => id && seen.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-150)));
  } catch {}
}
function rememberDone(kind) {
  try {
    sessionStorage.setItem(DONE_KEY, JSON.stringify({ kind, stars: state.stars, text: $("#editor").value, at: Date.now() }));
  } catch {}
}
function readDone() {
  try {
    const d = JSON.parse(sessionStorage.getItem(DONE_KEY) || "null");
    return d && Date.now() - d.at < 2 * 60 * 60 * 1000 ? d : null;
  } catch { return null; }
}

// ---------- Screens ----------

function show(name, { push = true } = {}) {
  const el = $(`[data-screen="${name}"]`);
  $$(".screen").forEach((s) => (s.hidden = s !== el));
  el.classList.remove("enter");
  void el.offsetWidth;
  el.classList.add("enter");

  const step = STEPS[name];
  $(".topbar").hidden = name === "rate" || name === "thanks";
  $("#step").textContent = step ? `${step} of 4` : "";
  $("#progress-bar").style.width = step ? `${(step / 4) * 100}%` : "100%";

  if (name === "like" || name === "sorry") renderRated();
  if (name === "pick" && state.ideasFor !== ideasKey()) refreshIdeas();
  if (name === "ready") prepareReady();

  window.scrollTo(0, 0);
  $("h1, h2", el)?.focus({ preventScroll: true });
  if (push) history.pushState({ screen: name }, "");
  state.screen = name;
}

window.addEventListener("popstate", (e) => show(e.state?.screen || "rate", { push: false }));
$("#back").addEventListener("click", () => history.back());

// ---------- 1. Rating ----------

function renderStars(popAt = 0) {
  const box = $(".stars");
  box.innerHTML = "";
  for (let n = 1; n <= 5; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star" + (n <= state.stars ? " on" : "") + (popAt && n <= popAt ? " pop" : "");
    b.style.setProperty("animation-delay", "0s");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(n === state.stars));
    b.setAttribute("aria-label", `${n} star${n > 1 ? "s" : ""}, ${STAR_LABELS[n]}`);
    b.innerHTML = svgStar();
    if (popAt && n <= popAt) b.firstChild.style.animationDelay = `${(n - 1) * 45}ms`;
    b.addEventListener("click", () => rate(n));
    box.appendChild(b);
  }
  $(".star-label").textContent = STAR_LABELS[state.stars];
}

let advanceTimer;
function rate(n) {
  state.stars = n;
  buzz();
  renderStars(n);
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => show(n >= 4 ? "like" : "sorry"), 650);
}

function renderRated() {
  const html = `<span class="mini-stars">${[1, 2, 3, 4, 5].map((n) => svgStar(n <= state.stars)).join("")}</span> You rated us ${state.stars} star${state.stars > 1 ? "s" : ""}`;
  $$(".eyebrow.rated").forEach((e) => (e.innerHTML = html));
}

// ---------- 2. Topics ----------

function renderTiles() {
  const box = $(".tiles");
  TOPICS.forEach(({ key, label }) => {
    const b = document.createElement("button");
    b.type = "button";
    const note = TILE_NOTES[key] ? `<small>${TILE_NOTES[key]}</small>` : "";
    b.className = note ? "tile wide" : "tile";
    b.dataset.key = key;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key]}</svg><span>${label}${note}</span>`;
    b.addEventListener("click", () => {
      const on = !state.topics.includes(key);
      state.topics = on ? [...state.topics, key] : state.topics.filter((t) => t !== key);
      b.setAttribute("aria-pressed", String(on));
      buzz();
      updateLikeButton();
    });
    box.appendChild(b);
  });
  updateLikeButton();
}
function updateLikeButton() {
  const btn = $("#to-pick");
  btn.disabled = !state.visit;
  btn.textContent = !state.visit
    ? "Choose stay or meal above"
    : state.topics.length ? "See review ideas" : "Skip and see ideas";
}

// Stayed or came to eat. Diners don't see the Rooms topic, and their review
// ideas never talk about rooms or staying over.
function setVisit(visit) {
  state.visit = visit;
  buzz();
  $$(".visit button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.visit === visit)));
  const rooms = $('.tile[data-key="rooms"]');
  rooms.hidden = visit === "dine";
  if (rooms.hidden && state.topics.includes("rooms")) {
    state.topics = state.topics.filter((t) => t !== "rooms");
    rooms.setAttribute("aria-pressed", "false");
  }
  // Keep the two-column grid even: an odd last tile takes the full row.
  const small = $$(".tile:not(.wide)").filter((t) => !t.hidden);
  small.forEach((t, i) => t.classList.toggle("fill", small.length % 2 === 1 && i === small.length - 1));
  updateLikeButton();
}
$$(".visit button").forEach((b) => b.addEventListener("click", () => setVisit(b.dataset.visit)));
$("#to-pick").addEventListener("click", () => show("pick"));

// ---------- 3. Ideas ----------

const ideasKey = () => `${state.stars}|${state.visit}|${[...state.topics].sort().join(",")}`;

function refreshIdeas() {
  state.ideas = suggest(state.stars, state.topics, readSeen(), 5, state.visit);
  rememberSeen(state.ideas.map((i) => i.id));
  state.ideasFor = ideasKey();
  state.picked = -1;
  renderIdeas();
}

function renderIdeas() {
  const box = $(".ideas");
  box.innerHTML = "";
  state.ideas.forEach((idea, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "idea";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(i === state.picked));
    b.innerHTML = '<span class="tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
    b.append(idea.text);
    b.addEventListener("click", () => {
      state.picked = i;
      buzz();
      $$(".idea").forEach((el, j) => el.setAttribute("aria-checked", String(j === i)));
      $("#to-ready").disabled = false;
    });
    box.appendChild(b);
  });
  $("#to-ready").disabled = true;
}

$("#more").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  btn.classList.remove("spin");
  void btn.offsetWidth;
  btn.classList.add("spin");
  refreshIdeas();
});
$("#to-ready").addEventListener("click", () => {
  if (state.picked < 0) return;
  $("#editor").value = state.ideas[state.picked].text;
  show("ready");
});

// ---------- 4. Ready ----------

function growEditor() {
  const ed = $("#editor");
  ed.style.height = "auto";
  ed.style.height = `${ed.scrollHeight}px`;
}

function prepareReady() {
  $("#ready-stars").innerHTML = [1, 2, 3, 4, 5].map((n) => svgStar(n <= state.stars)).join("");
  $("#howto-stars").textContent = `${state.stars} stars`;
  resetPostButton();
  requestAnimationFrame(growEditor);
}

function resetPostButton() {
  const btn = $("#post");
  btn.classList.remove("done");
  btn.disabled = !$("#editor").value.trim();
  $(".btn-label", btn).textContent = "Copy review & open Google";
}

$("#editor").addEventListener("input", () => {
  growEditor();
  $("#post").disabled = !$("#editor").value.trim();
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older phones: copy through a hidden text box.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;top:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  }
}

function toast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), ms);
}

$("#post").addEventListener("click", async () => {
  const text = $("#editor").value.trim();
  if (!text) return;
  const btn = $("#post");
  if (!(await copy(text))) {
    toast("Couldn't copy by itself. Select the text, copy it, then open Google.", 4200);
    $("#editor").focus();
    $("#editor").select();
    return;
  }
  buzz();
  btn.classList.add("done");
  $(".btn-label", btn).textContent = "Copied. Opening Google…";
  rememberDone("review");
  // Show the thank-you screen first, so it's there when the guest comes back.
  setTimeout(() => {
    setThanks("review");
    show("thanks");
    window.location.href = GOOGLE_REVIEW_URL;
  }, 900);
});

// ---------- 5. Thanks ----------

function setThanks(kind) {
  const review = kind === "review";
  $("#thanks-title").textContent = review ? "Thank you" : "Thank you for telling us";
  $("#thanks-text").textContent = review
    ? "Your review helps others find The Tasey. We hope to welcome you back soon."
    : "The manager will look into it and get back to you soon.";
  $("#thanks-actions").hidden = !review;
}

$("#copy-again").addEventListener("click", async () => {
  const ok = await copy($("#editor").value.trim());
  toast(ok ? "Copied. Paste it in the box on Google." : "Couldn't copy. Please try again.");
});

$("#start-over").addEventListener("click", () => {
  try { sessionStorage.removeItem(DONE_KEY); } catch {}
  window.location.replace(window.location.pathname);
});

// ---------- Low rating ----------

function renderIssues() {
  const box = $(".issue-chips");
  ISSUES.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const on = !state.issues.includes(label);
      state.issues = on ? [...state.issues, label] : state.issues.filter((x) => x !== label);
      b.setAttribute("aria-pressed", String(on));
    });
    box.appendChild(b);
  });
}

$("#send-feedback").addEventListener("click", (e) => {
  const lines = [`Guest feedback from the review page (${state.stars} star${state.stars > 1 ? "s" : ""})`];
  if (state.issues.length) lines.push(`About: ${state.issues.join(", ")}`);
  lines.push($("#feedback").value.trim() || "(no details written)");
  e.currentTarget.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  rememberDone("feedback");
  setTimeout(() => {
    setThanks("feedback");
    show("thanks");
  }, 400);
});

// ---------- Start ----------

$("#google-again").href = GOOGLE_REVIEW_URL;
$("#google-anyway").href = GOOGLE_REVIEW_URL;
renderStars();
renderTiles();
renderIssues();

// A guest coming back from Google after a full reload still sees the thank-you.
const done = readDone();
if (done) {
  state.stars = done.stars;
  $("#editor").value = done.text || "";
  renderStars();
  setThanks(done.kind);
  history.replaceState({ screen: "rate" }, "");
  show("thanks");
} else {
  history.replaceState({ screen: "rate" }, "");
}

// Back-forward cache: the page comes back exactly as it was left.
window.addEventListener("pageshow", (e) => {
  if (e.persisted && state.screen === "ready") resetPostButton();
});
