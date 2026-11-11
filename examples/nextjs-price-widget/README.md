# Next.js price widget

A Next.js App Router page that renders a card's price as a server component, plus a route handler that returns the same as JSON for your own front end. The API key is read on the server only and every answer is cached for an hour.

```
app/page.tsx                 /?q=charizard%20ex%20199/165 or /?id=517045
app/components/PriceCard.tsx server component: image, price, 30-day change, "Prices: TickerMint" link
app/api/price/route.ts       GET /api/price?q=... -> { name, price, attribution: { text, url, html } }
lib/tickermint.ts            server-side fetch helpers and types
```

```sh
npm install
cp .env.example .env.local   # TICKERMINT_API_KEY is optional (25 lookups a day per IP without it)
npm run dev                  # http://localhost:3000/?q=umbreon%20vmax%20215/203
```

Live check (2026-11-01, `next build` + `next start`, no key):

```
GET /api/price?q=umbreon%20vmax%20215/203
{"product_id":246723,"name":"Umbreon VMAX (Alternate Art Secret)","set_name":"SWSH07: Evolving Skies",
 "price":{"printing":"Holofoil","market":"2209.75","asOf":"2026-10-31","changePct30d":-3.61},
 "attribution":{"text":"Prices: TickerMint","url":"https://tickermint.cards/card/246723/umbreon-vmax-alternate-art-secret-215",...}}

GET /?q=charizard%20ex%20199/165
Charizard ex - 199/165 | SV: Scarlet & Violet 151 #199/165 | $300.29 | Holofoil, 2026-10-31 -13.0% 30d | Prices: TickerMint
```

Rules this example follows (copy them into your app):

- `TICKERMINT_API_KEY` stays server side. Never `NEXT_PUBLIC_TICKERMINT_API_KEY`.
- `fetch(url, { next: { revalidate: 3600 } })`: prices update once a day, so a one-hour cache is plenty.
- The price card always shows "Prices: TickerMint" linked to the card page (required on every plan below API Platform).
- Errors surface the API's `detail` and `upgrade_url`.

To get a key, start a plan (7-day trial, card required) at https://tickermint.cards/developers#plan. A store, a paid app or a site with ads is commercial use: API Pro ($49/mo) or above. See [Which plan do I need?](../../README.md#which-plan-do-i-need).
