// Checks the review text: counts, AI-sounding words, near-duplicates,
// and how often 500 simulated guests would see the same text.
import { BANK, PARTS } from "../reviews.js";
import { suggest } from "../generator.js";

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

console.log(problems ? `${problems} problem(s)` : "No problems found");
process.exit(problems ? 1 : 0);
