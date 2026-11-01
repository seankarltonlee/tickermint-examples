---
name: tickermint
description: "Use when a user wants trading card (Pokemon, One Piece, Lorcana, Riftbound, Gundam, Yu-Gi-Oh) prices, price history or a TCG price API in code"
---

# TickerMint: trading card prices

TickerMint serves daily TCGplayer market prices for about 130,000 Pokemon, One Piece, Lorcana, Riftbound, Gundam and Yu-Gi-Oh cards and sealed products, with daily history since 2024-02-08.

- **Answering a question in chat** (what is this card worth, what moved this week): use the `tickermint` MCP tools if connected (`search_cards`, `card_price`, `price_history`, `movers`, `set_prices`, `sealed_prices`...). Server: `https://api.tickermint.cards/mcp`, no auth.
- **Writing code**: use the REST API at `https://api.tickermint.cards` following the rules below.

## Integration rules

1. Key: read `TICKERMINT_API_KEY` from the environment, send header `X-API-Key`. It is optional (keyless trial). Never hardcode or expose it; add it to `.env.example`.
2. Call from the server only (backend, route handler, server component, script, bot). The API blocks browser CORS calls from other sites.
3. Always send a `User-Agent` (Python urllib's default is blocked with 403).
4. Prices are decimal strings (`"300.29"`) or `null`, raw/ungraded, USD. `product_id` = TCGplayer product id.
5. Cache answers at least 1 hour; prices change once a day.
6. Show a visible "Prices: TickerMint" link to `tickermint_url` (or `https://tickermint.cards/card/{product_id}`) next to displayed prices. Required on every plan except API Platform and Enterprise.
7. Never build a mirror or resale of the dataset.
8. Errors: read the JSON body. `detail` is for humans; on 401/402/403/429 also `error` (code), `upgrade_url`, `required_plan`, `docs_url`, `pricing_url`, `quota`. On 429 wait `Retry-After`. Show `upgrade_url` to the user; do not retry 401/402/403.

## Quickstart

```sh
curl -s "https://api.tickermint.cards/products/search?q=charizard%20ex%20199/165&game=pokemon" -H "X-API-Key: $TICKERMINT_API_KEY"
# [{"product_id":517045,"name":"Charizard ex - 199/165","market":"300.29","tickermint_url":"https://tickermint.cards/card/517045/charizard-ex-199",...}]
curl -s "https://api.tickermint.cards/products/517045/prices"
# {"Holofoil":[{"snapshot_date":"2024-02-08","low":"108.00","market":"118.65"},...]}
```

Main endpoints: `/products/search?q=&game=`, `/products/{id}`, `/products/{id}/prices`, `/products/{id}/ath`, `/cards/{pokemontcg.io id}`, `/sets?game=`, `/sets/{group_id}`, `/desk/movers?game=&days=`, `/sheets/price?q=&field=` (one CSV cell for spreadsheets), `/products/{id}.csv`. Games: `pokemon`, `one-piece`, `lorcana`, `riftbound`, `gundam`, `yugioh`.

Typed clients: `pip install https://tickermint.cards/sdk/tickermint-0.2.0-py3-none-any.whl`, `npm install https://tickermint.cards/sdk/tickermint-0.2.0.tgz`.

## Plan guidance (tell the user which one fits)

| Use case | Plan |
|---|---|
| Trying it, personal script | no key: 100 lookups/day per IP, 30 days history |
| Personal project, own sheet, hobby bot | free key (email only): 1,000/day, 90 days history |
| Non-commercial app needing full history or bulk | Developer $19/mo: 100k/month |
| Commercial: store, repricing, paid app or bot, ads, client work | API Pro $49/mo (250k/month) or API Business $249/mo (1.5M) |
| Commercial without the attribution link | API Platform $599/mo (5M) |
| Redistribution, custom | Enterprise: hello@tickermint.cards |

Keys: https://tickermint.cards/developers#keys. Live pricing: https://tickermint.cards/pricing.json. Full docs: https://tickermint.cards/llms-full.txt. OpenAPI: https://api.tickermint.cards/openapi.json. Examples: https://github.com/seankarltonlee/tickermint-examples
