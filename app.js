import { TOPICS } from "./reviews.js";
import { suggest } from "./generator.js";

// Google "write a review" box for The Tasey hotel (Place ID from its Google listing).
// To swap it, paste the "Ask for reviews" link from Google Business Profile here.
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJP3B1WyqxbTkROyWe-jVb9fY";
const WHATSAPP_NUMBER = "917073873670";
const STAR_LABELS = ["", "Very bad", "Not good", "Okay", "Good", "Loved it"];
const SEEN_KEY = "tasey-seen";

const $ = (sel) => document.querySelector(sel);
const state = { stars: 0, topics: [], picked: -1, ideas: [] };

// Remembers which hand-written reviews this phone has seen, so a guest who
// scans twice gets different ideas. Works without storage too.
function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveSeen(ids) {
  try {
    const seen = loadSeen();
    ids.forEach((id) => id && seen.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-150)));
  } catch {}
}

function renderStars() {
  const box = $(".stars");
  box.innerHTML = "";
  for (let n = 1; n <= 5; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star" + (n <= state.stars ? " on" : "");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(n === state.stars));
    b.setAttribute("aria-label", `${n} star${n > 1 ? "s" : ""}, ${STAR_LABELS[n]}`);
    b.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>';
    b.addEventListener("click", () => setStars(n));
    box.appendChild(b);
  }
  $(".star-label").textContent = STAR_LABELS[state.stars];
}

function setStars(n) {
  const wasHappy = state.stars >= 4;
  state.stars = n;
  renderStars();
  const happy = n >= 4;
  $("#happy").hidden = !happy;
  $("#sad").hidden = happy;
  $("#action-bar").hidden = !happy;
  document.body.classList.toggle("has-bar", happy);
  if (happy) refreshIdeas();
  if (!wasHappy || !happy) {
    (happy ? $("#happy") : $("#sad")).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderChips() {
  const box = $(".chips");
  TOPICS.forEach(({ key, label }) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const on = !state.topics.includes(key);
      state.topics = on ? [...state.topics, key] : state.topics.filter((t) => t !== key);
      b.setAttribute("aria-pressed", String(on));
      refreshIdeas();
    });
    box.appendChild(b);
  });
}

function refreshIdeas() {
  state.ideas = suggest(state.stars, state.topics, loadSeen());
  saveSeen(state.ideas.map((i) => i.id));
  state.picked = -1;
  renderIdeas();
  $("#editor").value = "";
  updatePostButton();
}

function renderIdeas() {
  const box = $(".ideas");
  box.innerHTML = "";
  state.ideas.forEach((idea, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "idea" + (i === state.picked ? " picked" : "");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(i === state.picked));
    b.textContent = idea.text;
    b.addEventListener("click", () => {
      state.picked = i;
      $("#editor").value = idea.text;
      renderIdeas();
      updatePostButton();
    });
    box.appendChild(b);
  });
}

function updatePostButton() {
  $("#post").disabled = !$("#editor").value.trim();
}

function toast(msg, ms = 2400) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), ms);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older phones: copy through a hidden text box.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}

async function postToGoogle() {
  const text = $("#editor").value.trim();
  if (!text) return;
  const ok = await copy(text);
  toast(
    ok
      ? `Review copied. On Google, tap ${state.stars} stars, then paste it in the box and post.`
      : "Couldn't copy. Please select the text and copy it, then post on Google.",
    4000
  );
  if (ok) {
    setTimeout(() => (window.location.href = GOOGLE_REVIEW_URL), 1600);
  } else {
    const editor = $("#editor");
    editor.focus();
    editor.select();
  }
}

function feedbackLink() {
  const msg = $("#feedback").value.trim();
  const text = `Guest feedback from the review page (${state.stars} star${state.stars > 1 ? "s" : ""}):\n${msg || "(no details written)"}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

renderStars();
renderChips();
$("#editor").addEventListener("input", updatePostButton);
$("#more").addEventListener("click", refreshIdeas);
$("#post").addEventListener("click", postToGoogle);
$("#own").href = GOOGLE_REVIEW_URL;
$("#google-anyway").href = GOOGLE_REVIEW_URL;
$("#send-feedback").addEventListener("click", (e) => {
  e.currentTarget.href = feedbackLink();
});
