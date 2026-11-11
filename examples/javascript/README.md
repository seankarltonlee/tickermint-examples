# JavaScript and TypeScript example

`price.mjs` (plain ESM) and `price.ts` (typed) search a card, print its latest TCGplayer market price, the 30-day change per printing and the required attribution link. Node 18+ built-in `fetch`, no runtime dependencies.

```sh
node price.mjs "charizard ex 199/165"
node price.mjs "luffy op05-119" one-piece

npm install            # only for TypeScript: typescript, tsx, @types/node
npx tsx price.ts "charizard ex 199/165"
npm run typecheck
```

Live output (2026-10-31 prices, no key):

```
Charizard ex - 199/165 (SV: Scarlet & Violet 151, pokemon)
Market price: $300.29
  Holofoil: $300.29 on 2026-10-31, -13.0% since 2026-10-02
Prices: TickerMint https://tickermint.cards/card/517045/charizard-ex-199
Monkey.D.Luffy (119) (SP) (A Fist of Divine Speed, one-piece)
Market price: $5749.97
  Foil: $5749.97 on 2026-10-31, +0.0% since 2026-10-02
Prices: TickerMint https://tickermint.cards/card/632503/monkey-d-luffy-119-sp-op05-119
```

Without a key you get 25 lookups a day per IP (each run costs 2). Set `TICKERMINT_API_KEY` for your own quota: a key comes with a plan, and every plan starts with a 7-day trial (card required) at https://tickermint.cards/developers#plan. Run this server side: the API does not accept browser calls from other sites, and a key in browser code leaks.

For a bigger project use the typed client: `npm install https://tickermint.cards/sdk/tickermint-0.2.1.tgz` ([docs](https://tickermint.cards/developers/javascript)).
