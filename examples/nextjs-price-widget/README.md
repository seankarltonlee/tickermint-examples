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
cp .env.example .env.local   # TICKERMINT_API_KEY is optional for the keyless trial
npm run dev                  # http://localhost:3000/?q=umbreon%20vmax%20215/203
```

Rules this example follows (copy them into your app):

- `TICKERMINT_API_KEY` stays server side. Never `NEXT_PUBLIC_TICKERMINT_API_KEY`.
- `fetch(url, { next: { revalidate: 3600 } })`: prices update once a day, so a one-hour cache is plenty.
- The price card always shows "Prices: TickerMint" linked to the card page (required on every plan below API Platform).
- Errors surface the API's `detail` and `upgrade_url`.

A store, a paid app or a site with ads is commercial use: API Pro ($49/mo) or above. See [Which plan do I need?](../../README.md#which-plan-do-i-need).
