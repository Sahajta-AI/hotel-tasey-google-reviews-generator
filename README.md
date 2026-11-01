# The Tasey Hotel review page

A one-page site that helps guests post a Google review for The Tasey Hotel, Amer, Jaipur.

Guest flow:

QR code → review page → tap stars → pick topics (optional) → pick 1 of 5 review ideas → edit if wanted → "Copy & post on Google" → Google review box opens → guest pastes, taps stars, posts.

Guests who give 1 to 3 stars see a feedback box. The message goes to the hotel on WhatsApp (+91 70738 73670). The "Post your review on Google" link stays on that screen too.

No server, no database and no API keys. Everything runs in the guest's browser.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css`, `app.js` | The review page |
| `reviews.js` | All review text: 134 five-star and 70 four-star reviews written by hand, plus openers, topic lines and closers |
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
