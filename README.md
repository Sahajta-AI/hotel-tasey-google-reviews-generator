# The Tasey Hotel review page

A one-page site that helps guests post a Google review for The Tasey Hotel, Amer, Jaipur.

Guest flow:

QR code → tap stars → "I stayed here" or "I came to eat" → pick what stood out (optional) → pick 1 of 5 review ideas → "Your review is ready" screen: edit the text, read the 3 Google steps → "Copy review & open Google" → Google review box opens → guest taps stars, pastes, posts → back on our page: thank-you screen.

Google does not let any website fill in its review box, so the guest always pastes the text. The "ready" screen shows the 3 steps before Google opens, so guests know what to do there.

Guests who give 1 to 3 stars see a feedback box. The message goes to the hotel on WhatsApp (+91 70738 73670). The "Post your review on Google" link stays on that screen too.

No server, no database and no API keys. Everything runs in the guest's browser.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css`, `app.js` | The review page: one screen per step |
| `img/facade.jpg` | The hotel lit up at night (the main photo on thetaseyhotel.com), used on the first screen and the poster |
| `reviews.js` | All review text: 187 five-star and 89 four-star reviews written by hand (28 by people who only came to eat) (35 about the pure veg kitchen, 21 about Jain food). Reviews talk about what the hotel offers; nearby sights only appear as landmarks, never as activities, plus openers, topic lines and closers |
| `generator.js` | Picks 5 ideas for each guest: 2 hand-written ones and 3 new ones built from the parts |
| `poster.html` | Printable A5 poster with the QR code for reception and rooms |
| `scripts/check-reviews.mjs` | Checks the text for AI-sounding words and near copies, and counts repeats over 500 test guests |
| `logo.png` | Hotel logo |

## How the ideas stay different

- Each set of 5 ideas has no sentence in common.
- Hand-written reviews get a random opener or closer most of the time.
- A small number of ideas are lower case or have no full stop at the end, like people type on phones.
- The page remembers on each phone which hand-written reviews it already showed.
- Test result: 500 guests at 5 stars give about 490 different texts. Guests who edit the text make it fully their own.

## Google link

`app.js` → `GOOGLE_REVIEW_URL` opens the "write a review" box directly:

`https://search.google.com/local/writereview?placeid=ChIJP3B1WyqxbTkROyWe-jVb9fY`

The Place ID belongs to "The Tasey hotel", Sisiyawas (Google listing `/g/11z_0qjm62`). If the hotel owner shares the "Ask for reviews" link from Google Business Profile (`g.page/r/.../review`), you can put that link here instead.

## Run it on your computer

```bash
python3 -m http.server 4321
```

Open http://localhost:4321. The poster is at http://localhost:4321/poster.html.

```bash
npm run check
```

## Deploy

Any static host works. On Vercel, import this repository with no build command and no settings. After the first deploy, open `/poster.html` on the live site and print it. The QR code uses the live address by itself. To put a different address in the QR code, type it in the box at the top of the poster page.

## Google review rules to keep in mind

- Do not offer gifts or discounts in exchange for reviews.
- Do not hide the Google option from unhappy guests. This page keeps the Google link on the low-rating screen for this reason.
- Staff must not post reviews from their own phones or accounts.

## Pure veg

The kitchen is pure vegetarian, and no other hotel or restaurant nearby is. It is the hotel's main highlight:

- "Pure veg food" is the first topic on the "What stood out?" screen, full width.
- When a guest picks no topic, or picks Food, about 1 in 3 ideas mention pure veg, and 9 in 10 guests see at least one. It is not in every idea, because many reviews with the same point look staged to Google.
- Review text never mentions meat, fish or eggs.

## Jain food

Jain food (no onion, no garlic, no root vegetables) is available.

- "Jain food" is the second topic, full width, under "Pure veg food".
- Reviews that tell a personal Jain story ("We are Jain and they prepared our meals...") only show when the guest picks "Jain food". A guest who did not eat Jain food should not post that.
- Other guests sometimes see a short note such as "Pure veg kitchen, and Jain food is available too."

## Guests and diners

Many people only come to eat. The home screen says "How was your visit?", and the next screen asks "I stayed here" or "I came to eat".

- "I came to eat" hides the Rooms topic and filters out every line about rooms or staying over. About 95% of ideas for diners are about the food or the rooftop cafe.
- Reviews written by diners ("Only came to eat, and it was worth it") never show to guests who stayed.
- `npm run check` tests 1,000 diners and fails if any idea mentions rooms or staying.

## Picked topics

The ideas follow what the guest taps on "What stood out?":

- One topic picked: every idea mentions it. Half of them add one everyday detail too, so guests who pick the same topic don't get the same text.
- Two or three picked: every idea mentions all of them.
- Four or more picked: every idea mentions at least two (usually three), and the 5 ideas together cover all of them.
- A hand-written review only shows if its text names the picked topics (`TOPIC_WORDS` in `generator.js`).
- `npm run check` tests 3,000 guests with random picks and fails if any idea drifts off their topics.
