// Checks the review text: counts, AI-sounding words, near-duplicates,
// and how often 500 simulated guests would see the same text.
import { BANK, PARTS } from "../reviews.js";
import { suggest, TOPIC_WORDS } from "../generator.js";
import { TOPICS, PARTS as ALL_PARTS } from "../reviews.js";

const BANNED = /\b(delve|tapestry|vibrant|crucial|pivotal|seamless(ly)?|robust|nuanced|holistic|elevate[sd]?|unforgettable|testament|nestled|boasts?|exquisite|impeccable|hidden treasure|truly|indeed|moreover|furthermore|additionally|experience the|culinary|ambiance)\b|—/i;
let problems = 0;

const all = [];
for (const s of [5, 4]) {
  console.log(`${s} stars: ${BANK[s].length} written reviews`);
  for (const [t] of BANK[s]) all.push(t);
  const p = PARTS[s];
  for (const t of [...p.open, ...p.close, ...Object.values(p.topic).flat()]) all.push(t);
}

for (const t of all) {
  if (BANNED.test(t)) { console.log("AI-sounding:", t); problems++; }
}

const words = (t) => new Set(t.toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter((w) => w.length > 3));
const bank = [...BANK[5], ...BANK[4]].map(([t]) => t);
for (let i = 0; i < bank.length; i++) {
  for (let j = i + 1; j < bank.length; j++) {
    const a = words(bank[i]), b = words(bank[j]);
    const shared = [...a].filter((w) => b.has(w)).length;
    const score = shared / Math.min(a.size, b.size);
    if (score >= 0.8 && Math.min(a.size, b.size) >= 4) {
      console.log(`Too similar:\n  ${bank[i]}\n  ${bank[j]}`);
      problems++;
    }
  }
}

// 500 guests, each picks one random idea out of the 5 shown.
for (const s of [5, 4]) {
  const posted = new Map();
  for (let g = 0; g < 500; g++) {
    const ideas = suggest(s, [], new Set());
    const t = ideas[Math.floor(Math.random() * ideas.length)].text.toLowerCase().replace(/[.!]$/, "");
    posted.set(t, (posted.get(t) || 0) + 1);
  }
  const repeats = [...posted.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  console.log(`${s} stars, 500 guests: ${posted.size} different texts, ${repeats} repeats`);
}

// Guests who only came to eat must never get lines about rooms or staying over.
const STAY = /\b(stay(ed|ing|s)?|rooms?|nights|(one|two|a|3) nights?|check-?in|checkout|housekeeping|slept|woke|beds?|suite|balcony|mattress|washroom|bathroom|linen|towels?|lift)\b/i;
for (const s of [5, 4]) {
  const posted = new Map();
  for (let g = 0; g < 500; g++) {
    for (const idea of suggest(s, [], new Set(), 5, "dine")) {
      if (STAY.test(idea.text)) { console.log("Stay wording shown to a diner:", idea.text); problems++; }
    }
    const ideas = suggest(s, [], new Set(), 5, "dine");
    const t = ideas[Math.floor(Math.random() * ideas.length)].text.toLowerCase().replace(/[.!]$/, "");
    posted.set(t, (posted.get(t) || 0) + 1);
  }
  const repeats = [...posted.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  console.log(`${s} stars, 500 diners: ${posted.size} different texts, ${repeats} repeats`);
}

// Every topic line must name its topic, so the topic test below means something.
for (const st of [5, 4]) {
  for (const [key, lines] of Object.entries(ALL_PARTS[st].topic)) {
    for (const l of lines) if (!TOPIC_WORDS[key].test(l)) { console.log(`Line does not mention ${key}:`, l); problems++; }
  }
}

// Ideas must follow the topics a guest picks: with one topic, every idea
// mentions it; with more, every idea mentions at least two and each set
// covers all of them.
const keys = TOPICS.map((t) => t.key);
for (const visit of ["stay", "dine"]) {
  let ideasN = 0, miss = 0, setsMissing = 0;
  for (let g = 0; g < 1500; g++) {
    const pool = keys.filter((k) => !(visit === "dine" && k === "rooms"));
    const size = 1 + Math.floor(Math.random() * 4);
    const topics = shuffleList(pool).slice(0, size);
    const ideas = suggest(Math.random() < 0.7 ? 5 : 4, topics, new Set(), 5, visit);
    const covered = new Set();
    for (const i of ideas) {
      ideasN++;
      const hits = topics.filter((t) => TOPIC_WORDS[t].test(i.text));
      hits.forEach((h) => covered.add(h));
      if (hits.length < Math.min(topics.length, 2)) miss++;
    }
    if (covered.size < topics.length) setsMissing++;
  }
  console.log(`Topics (${visit}): ${miss} of ${ideasN} ideas off-topic, ${setsMissing} sets missing a picked topic`);
  if (miss > ideasN * 0.01 || setsMissing) problems++;
}

console.log(problems ? `${problems} problem(s)` : "No problems found");
process.exit(problems ? 1 : 0);

function shuffleList(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
