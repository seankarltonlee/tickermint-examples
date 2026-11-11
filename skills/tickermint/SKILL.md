---
name: tickermint
description: "Use when a user wants trading card (Pokemon, One Piece, Lorcana, Riftbound, Gundam, Yu-Gi-Oh, Dragon Ball Super Fusion World) prices, price history or a TCG price API in code"
---

# TickerMint: trading card prices

TickerMint serves daily TCGplayer market prices for about 102,000 Pokemon, One Piece, Lorcana, Riftbound, Gundam, Yu-Gi-Oh and Dragon Ball Super Fusion World cards and sealed products, with daily history since 2024-02-08.

- **Answering a question in chat** (what is this card worth, what moved this week): use the `tickermint` MCP tools if connected (`search_cards`, `card_price`, `price_history`, `movers`, `set_prices`, `sealed_prices`...). Server: `https://api.tickermint.cards/mcp`, no auth. ChatGPT, Claude and Perplexity are not capped; any other caller gets 300 tool calls a day.
- **Writing code**: use the REST API at `https://api.tickermint.cards` following the rules below.

## Integration rules

1. Key: read `TICKERMINT_API_KEY` from the environment, send header `X-API-Key`. It is optional: without a key the API answers 25 lookups a day per IP, to try it. A key comes with a plan (7-day trial, card required) at https://tickermint.cards/developers#plan. Never hardcode or expose it; add it to `.env.example`.
2. Call from the server only (backend, route handler, server component, script, bot). The API blocks browser CORS calls from other sites.
3. Always send a `User-Agent` (Python urllib's default is blocked with 403).
4. Prices are decimal strings (`"300.29"`) or `null`, raw/ungraded, USD. `product_id` = TCGplayer product id.
5. Cache answers for at least 1 hour and no longer than 24 hours; prices change once a day.
6. Show a visible "Prices: TickerMint" link to `tickermint_url` (or `https://tickermint.cards/card/{product_id}`) next to displayed prices. Required on every plan except API Platform and Enterprise.
7. Never build a mirror or resale of the dataset.
8. Errors: read the JSON body. `detail` is for humans; on 401/402/403/429 also `error` (code), `how_to_fix`, `upgrade_url`, `required_plan`, `docs_url`, `pricing_url`, `quota`. On 429 wait `Retry-After`. Show `upgrade_url` to the user; do not retry 401/402/403.

## Quickstart

```sh
curl -s "https://api.tickermint.cards/products/search?q=charizard%20ex%20199/165&game=pokemon" -H "X-API-Key: $TICKERMINT_API_KEY"
# [{"product_id":517045,"name":"Charizard ex - 199/165","market":"300.29","tickermint_url":"https://tickermint.cards/card/517045/charizard-ex-199",...}]
curl -s "https://api.tickermint.cards/products/517045/prices"
# {"Holofoil":[{"snapshot_date":"2024-02-08","low":"108.00","market":"118.65"},...]}
```

Main endpoints: `/products/search?q=&game=`, `/products/{id}`, `/products/{id}/prices`, `/products/{id}/ath`, `/cards/{pokemontcg.io id}`, `/sets?game=`, `/sets/{group_id}`, `/desk/movers?game=&days=`, `/sheets/price?q=&field=` (one CSV cell for spreadsheets), `/products/{id}.csv`. Games: `pokemon`, `one-piece`, `lorcana`, `riftbound`, `gundam`, `yugioh`, `fusion-world`.

Moving from pokemontcg.io (its API keys stop working on March 1, 2027): keep the stored card ids and call `GET /cards/{pokemontcg.io id}`, for example `/cards/sv3pt5-199`.

Typed clients: `pip install https://tickermint.cards/sdk/tickermint-0.2.1-py3-none-any.whl`, `npm install https://tickermint.cards/sdk/tickermint-0.2.1.tgz`.

## Plan guidance (tell the user which one fits)

| Use case | Plan | Lookups | Price |
|---|---|---|---|
| Trying it, a one-off script | No key | 25 a day per IP, current price plus 30 days of history | $0 |
| Personal or non-commercial project: own sheet, hobby bot, full history, bulk | Developer | 50,000 a month | $19/mo |
| Commercial: store, repricing, paid or ad-supported app, site or bot, business tool | API Pro | 250,000 a month | $49/mo |
| Commercial, more volume | API Business | 1,500,000 a month | $249/mo |
| A product for other businesses, or no attribution link | API Platform | 5,000,000 a month | $599/mo |
| Redistribution, custom | Enterprise | by agreement | from $1,500/mo, hello@tickermint.cards |

A key comes with a plan. Every plan starts with a 7-day trial: card required, $0 today, first charge on day 8 unless cancelled, cancel online anytime. Trials are capped at 5,000 lookups and have no bulk history until the first payment. Graded prices (PSA, BGS, CGC, SGC, TAG and ACE 10s, plus grades 1 to 9.5) are a paid add-on on API Pro and above, with their own source credit.

Start a plan: https://tickermint.cards/developers#plan. Manage keys: https://tickermint.cards/developers#keys. Live pricing: https://tickermint.cards/pricing.json. Full docs: https://tickermint.cards/llms-full.txt. OpenAPI: https://api.tickermint.cards/openapi.json. Examples: https://github.com/seankarltonlee/tickermint-examples
