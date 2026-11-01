// Picks review ideas for a guest. No server, no API keys: everything is
// random choice over the text in reviews.js.
import { BANK, PARTS } from "./reviews.js";

const rand = (n) => Math.floor(Math.random() * n);
const TRIP_OPENER = /^(stayed|visited|stopped|went|came|our first)/i;
const pick = (arr) => arr[rand(arr.length)];

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Joins an opener, 1-3 topic lines and a closer into a new review.
export function compose(stars, topics = []) {
  const parts = PARTS[stars];
  const usable = topics.filter((t) => parts.topic[t]);
  const pool = shuffle(usable.length ? usable : Object.keys(parts.topic));
  const count = Math.min(pool.length, 1 + rand(3));
  const lines = pool.slice(0, count).map((t) => pick(parts.topic[t]));

  const out = [];
  if (Math.random() < 0.55) out.push(pick(parts.open));
  out.push(...lines);
  // Always end with at least two sentences, so short texts don't repeat.
  if (out.length < 2 || Math.random() < 0.5) out.push(pick(parts.close));
  return out.join(" ");
}

// Gives a hand-written review an opener or closer some of the time, so the
// same review rarely shows up word for word for two guests.
export function decorate(stars, text) {
  const parts = PARTS[stars];
  const r = Math.random();
  if (r < 0.15) return text;
  const canClose = !/back|recommend|again|thank/i.test(text);
  // A short first sentence ("Nice hotel.") already works as an opener, so
  // only add a trip detail in front of it ("Stayed two nights.").
  const longStart = text.split(/[.!]/)[0].split(" ").length > 4;
  const openers = longStart ? parts.open : parts.open.filter((o) => TRIP_OPENER.test(o));
  if (r < 0.55 || !canClose) return `${pick(openers)} ${text}`;
  return `${text} ${pick(parts.close)}`;
}

// Small changes in writing habit, so the same text reads like different people.
export function voice(text) {
  let t = text;
  if (Math.random() < 0.1) t = t.toLowerCase();
  if (Math.random() < 0.25) t = t.replace(/[.]$/, "");
  return t;
}

// Returns `count` ideas: about 2 from the hand-written bank, the rest composed.
// `seen` holds bank ids this phone has already been shown.
export function suggest(stars, topics = [], seen = new Set(), count = 5) {
  const bank = (BANK[stars] || []).map(([text, tags], i) => ({
    id: `${stars}-${i}`,
    text,
    tags: tags.split(" ").filter(Boolean),
  }));

  const matches = (r) => !topics.length || r.tags.some((t) => topics.includes(t));
  let candidates = bank.filter((r) => matches(r) && !seen.has(r.id));
  if (candidates.length < 2) candidates = bank.filter((r) => !seen.has(r.id));
  if (candidates.length < 2) candidates = bank;

  // No sentence may appear in two ideas of the same set.
  const ideas = [];
  const used = new Set();
  const sentences = (t) => t.toLowerCase().replace(/[.!]$/, "").split(/[.!]\s+/);
  const add = (text, id = null) => {
    const parts = sentences(text);
    if (parts.some((s) => used.has(s))) return false;
    parts.forEach((s) => used.add(s));
    ideas.push({ id, text });
    return true;
  };

  for (const r of shuffle(candidates).slice(0, 2)) {
    let tries = 0;
    while (!add(voice(decorate(stars, r.text)), r.id) && ++tries < 10);
    if (tries === 10) add(r.text, r.id);
  }
  // Use the guest's topics first; if they are too narrow for 5 ideas, widen.
  for (let tries = 0; ideas.length < count && tries < 400; tries++) {
    add(voice(compose(stars, tries < 200 ? topics : [])));
  }
  return shuffle(ideas);
}
