// Picks review ideas for a guest. No server, no API keys: everything is
// random choice over the text in reviews.js.
import { BANK, PARTS } from "./reviews.js";

const rand = (n) => Math.floor(Math.random() * n);
const TRIP_OPENER = /^(stayed|visited|stopped|went|came|our first|had (lunch|dinner))/i;
// Words that only make sense for a guest who stayed the night.
const STAY_WORDS = /\b(stay(ed|ing|s)?|rooms?|nights|(one|two|a|3) nights?|check-?in|checkout|housekeeping|slept|woke|beds?|suite|balcony|mattress|washroom|bathroom|linen|towels?|lift)\b/i;
const forDiner = (text) => !STAY_WORDS.test(text);
// Only true for some guests, so used only when the guest picks them.
const NICHE = ["events", "jain"];
const pick = (arr) => arr[rand(arr.length)];

// Words that show a review really talks about a topic. Used to match
// hand-written reviews to the topics a guest picked, by what the text says.
export const TOPIC_WORDS = {
  veg: /pure veg|vegetarian|\bveg\b|shakahari/i,
  jain: /jain/i,
  rooms: /room|\bbeds?\b|suite|balcony|mattress|slept/i,
  food: /food|thali|\bdal\b|roti|curr|paneer|churma|meal|dinner|lunch|breakfast|khana|dish|menu|tandoor|\beat/i,
  pool: /pool|rooftop|jhumka|terrace/i,
  staff: /staff|team|service|reception|front desk|hospitality|manager|welcome|helpful|polite|looked after|waiter|cooperative/i,
  clean: /clean|spotless|hygien|saaf|tidy|well kept|neat|maintained/i,
  views: /view|hills?\b|aravali|peaceful|calm|green/i,
  location: /location|amer|fort|highway|nahargarh|parking|reach|find|jal mahal|close by|across the road/i,
  events: /function|party|birthday|hall|event|celebrat|anniversary|wedding|kitty/i,
  value: /value|price|rupee|\brates?\b|worth|deal|fair|reasonable/i,
  family: /famil(y|ies)|kids|kid\b|parents|children|grand|mother|daughter|\bson\b|elderly/i,
};
const mentions = (text, topics) => topics.filter((t) => TOPIC_WORDS[t]?.test(text));

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The review parts for this guest. `visit` is "stay", "dine" or "".
// Guests who only came to eat get no lines about rooms or staying over.
function partsFor(stars, visit) {
  const p = PARTS[stars];
  if (visit !== "dine") return p;
  const topic = {};
  for (const [key, lines] of Object.entries(p.topic)) {
    const ok = lines.filter(forDiner);
    if (key !== "rooms" && ok.length) topic[key] = ok;
  }
  return {
    open: [...p.open.filter(forDiner), ...p.dineOpen],
    topic,
    close: [...p.close.filter(forDiner), ...p.dineClose],
  };
}

// Joins an opener, topic lines and a closer into a new review.
// With picked topics, every idea uses all of them (up to 3), starting with
// `lead`, so a guest who picks one topic sees it in every idea.
export function compose(stars, topics = [], visit = "", lead = null) {
  const parts = partsFor(stars, visit);
  const usable = topics.filter((t) => parts.topic[t]);
  let chosen;

  if (usable.length) {
    const rest = shuffle(usable.filter((t) => t !== lead));
    chosen = (usable.includes(lead) ? [lead, ...rest] : rest).slice(0, 3);
    // A guest who liked the food may well mention the pure veg kitchen too.
    if (usable.includes("food") && !chosen.includes("veg") && chosen.length < 3 && parts.topic.veg && Math.random() < 0.25) {
      chosen.push("veg");
    }
    // With a single topic, half the ideas add one more everyday detail, so
    // guests who pick the same topic don't end up with the same text.
    else if (chosen.length === 1 && Math.random() < 0.5) {
      const extra = Object.keys(parts.topic).filter((t) => !NICHE.includes(t) && !chosen.includes(t));
      chosen.push(pick(extra));
    }
  } else {
    const general = Object.keys(parts.topic).filter((t) => !NICHE.includes(t));
    const pool = shuffle(general);
    // Pure veg is the hotel's main highlight: bring it up often.
    if (Math.random() < 0.2) {
      pool.splice(pool.indexOf("veg"), 1);
      pool.unshift("veg");
    }
    // Someone who came to eat mostly writes about the food.
    if (visit === "dine" && Math.random() < 0.7) {
      const first = pick(["food", "veg", "pool"]);
      pool.splice(pool.indexOf(first), 1);
      pool.unshift(first);
    }
    chosen = pool.slice(0, 1 + rand(3));
  }

  const out = [];
  if (Math.random() < 0.55) out.push(pick(parts.open));
  out.push(...chosen.map((t) => pick(parts.topic[t])));
  // Always end with at least two sentences, so short texts don't repeat.
  if (out.length < 2 || Math.random() < 0.5) out.push(pick(parts.close));
  return out.join(" ");
}

// Gives a hand-written review an opener or closer some of the time, so the
// same review rarely shows up word for word for two guests.
export function decorate(stars, text, visit = "") {
  const parts = partsFor(stars, visit);
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

// Returns `count` ideas: up to 2 from the hand-written bank, the rest composed.
// `seen` holds bank ids this phone has already been shown.
export function suggest(stars, topics = [], seen = new Set(), count = 5, visit = "") {
  const bank = (BANK[stars] || []).map(([text, tags], i) => ({
    id: `${stars}-${i}`,
    text,
    tags: tags.split(" ").filter(Boolean),
  }));

  const fitsVisit = (r) => (visit === "dine" ? forDiner(r.text) : !r.tags.includes("dine"));
  const fits = (r) => fitsVisit(r) && !r.tags.some((t) => NICHE.includes(t) && !topics.includes(t));
  const eatTopics = ["food", "veg", "pool"];

  // With picked topics, a hand-written review must talk about at least two of
  // them (or the one, if only one was picked). Otherwise it is left out.
  let candidates;
  if (topics.length) {
    const need = Math.min(topics.length, 2);
    const scored = bank
      .filter(fits)
      .map((r) => ({ ...r, hits: mentions(r.text, topics).length }))
      .filter((r) => r.hits >= need);
    const fresh = scored.filter((r) => !seen.has(r.id));
    candidates = (fresh.length >= 2 ? fresh : scored).sort((a, b) => b.hits - a.hits || Math.random() - 0.5);
    // Prefer the reviews that cover the most picked topics, with some variety.
    candidates = shuffle(candidates.filter((r) => r.hits === (candidates[0]?.hits ?? 0))).concat(
      shuffle(candidates.filter((r) => r.hits !== (candidates[0]?.hits ?? 0)))
    );
  } else {
    const matches = (r) => fits(r) && (visit !== "dine" || r.tags.some((t) => eatTopics.includes(t)));
    candidates = bank.filter((r) => matches(r) && !seen.has(r.id));
    if (candidates.length < 2) candidates = bank.filter(matches);
    candidates = shuffle(candidates);
    if (Math.random() < 0.35) {
      const veg = candidates.find((r) => r.tags.includes("veg"));
      if (veg) candidates = [veg, ...candidates.filter((r) => !r.tags.includes("veg"))];
    }
  }

  // No sentence may appear in two ideas of the same set.
  const ideas = [];
  const used = new Set();
  const covered = new Set();
  const sentences = (t) => t.toLowerCase().replace(/[.!]$/, "").split(/[.!]\s+/);
  const add = (text, id = null, strict = true) => {
    const parts = sentences(text);
    if (strict ? parts.some((s) => used.has(s)) : ideas.some((i) => i.text.toLowerCase() === text.toLowerCase())) return false;
    parts.forEach((s) => used.add(s));
    mentions(text, topics).forEach((t) => covered.add(t));
    ideas.push({ id, text });
    return true;
  };

  // Few matching hand-written reviews would mean many guests get the same
  // ones, so show fewer of them and build more ideas instead.
  const fromBank = candidates.length >= 10 ? 2 : candidates.length >= 4 ? 1 : 0;
  for (const r of candidates.slice(0, fromBank)) {
    let tries = 0;
    while (!add(voice(decorate(stars, r.text, visit)), r.id) && ++tries < 10);
    if (tries === 10) add(r.text, r.id);
  }

  // Composed ideas take turns leading with each picked topic, starting with
  // any topic the set has not mentioned yet. If the topic lines run out,
  // allow a repeated sentence rather than drift off the guest's topics.
  for (let tries = 0; ideas.length < count && tries < 500; tries++) {
    const missing = topics.filter((t) => !covered.has(t));
    const lead = missing.length ? missing[0] : topics.length ? topics[tries % topics.length] : null;
    add(voice(compose(stars, topics, visit, lead)), null, tries < 300);
  }
  return shuffle(ideas);
}
