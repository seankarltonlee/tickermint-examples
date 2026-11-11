# TickerMint API examples

[TickerMint](https://tickermint.cards/developers) is a REST API (plus an MCP server) of daily TCGplayer market prices for about 102,000 Pokemon, One Piece, Lorcana, Riftbound, Gundam, Yu-Gi-Oh and Dragon Ball Super Fusion World cards and sealed products, with daily history back to 2024-02-08 (Yu-Gi-Oh since 2026-09-16, Dragon Ball Super Fusion World since 2026-10-14).
This repo has copy-paste examples and the rules a coding agent needs to wire it in correctly the first time.

- Base URL: `https://api.tickermint.cards`
- Auth: optional header `X-API-Key: $TICKERMINT_API_KEY` (or `?key=`). Without a key you get 25 card lookups a day per IP to try it. A key comes with a plan, and every plan starts with a 7-day trial (card required): [tickermint.cards/developers#plan](https://tickermint.cards/developers#plan).
- Product ids are TCGplayer product ids. Prices are raw (ungraded) and are **decimal strings** in JSON (`"300.29"`), `null` when unpriced.
- Prices update once a day: cache for at least 1 hour and no longer than 24 hours.
- Show a "Prices: TickerMint" link to `https://tickermint.cards/card/{product_id}` next to prices (all plans below API Platform).

## Which plan do I need?

Usage is counted in card lookups (one per card returned; errors count zero). Live numbers: [pricing.json](https://tickermint.cards/pricing.json), [pricing.md](https://tickermint.cards/docs/pricing.md), or `GET https://api.tickermint.cards/meta` (`quota`).

| Your use case | Plan | Lookups | History | Full history beyond 90 days | Commercial use | Price |
|---|---|---|---|---|---|---|
| Trying the API, a one-off script | No key | 25 a day per IP | current price plus 30 days | not included | no | $0 |
| Personal or non-commercial project: your own spreadsheet, a hobby Discord bot, a school or research project, bulk endpoints | Developer | 50,000 a month | full, since 2024-02-08 | 10,000 products a month | no | $19/mo or $190/yr |
| **Anything commercial**: a store, repricing or buylists, a paid or ad-supported app, site or bot, an internal tool at a business | API Pro (first commercial plan) | 250,000 a month | full, plus webhooks | 25,000 products a month | yes | $49/mo or $490/yr |
| Commercial and past API Pro volume, or you need to keep fetched data after cancelling | API Business | 1,500,000 a month | full | 60,000 products a month | yes | $249/mo or $2,490/yr |
| A product you run for other businesses, or one that cannot show the attribution link | API Platform | 5,000,000 a month | full | unlimited | yes | $599/mo or $5,990/yr |
| More volume, redistribution or a custom license | Enterprise | by agreement | full | unlimited | yes | from $1,500/mo, hello@tickermint.cards |

How to get a key: a key comes with a plan. Every plan starts with a 7-day trial, card required: $0 today, first charge on day 8 unless you cancel, cancel online anytime. Start at [tickermint.cards/developers#plan](https://tickermint.cards/developers#plan); the key is emailed after checkout. Manage keys at [tickermint.cards/developers#keys](https://tickermint.cards/developers#keys).

- Trials are capped at 5,000 lookups and have no bulk history until the first payment.
- Without a key: personal use only, single cards and search, with the attribution link.
- Developer is for personal and non-commercial use. Commercial use needs API Pro or above, whatever the volume.
- "Full history beyond 90 days" counts the different products whose full history you fetch in a calendar month (`/v1/bulk/history`, `/v1/bulk/day` for days older than 7 days, or a single-card history call reaching back more than 90 days). `?days=90` or less and today's bulk prices never count.
- Over the monthly quota there is a 10% grace, then HTTP 429 until the month resets. There is no overage billing.
- Yearly billing is 2 months free.
- Graded prices (PSA, BGS, CGC, SGC, TAG and ACE 10s, plus grades 1 to 9.5) are a paid add-on on API Pro and above ($149/mo or $1,490/yr). Every graded value carries its own source credit ("Prices from PriceCharting" with a link), which must stay visible.
- MCP server: ChatGPT, Claude and Perplexity are not capped; any other caller gets 300 tool calls a day.

What no plan allows: copying or mirroring the catalog or price history as a dataset for redistribution, or reselling it as a competing price service (Enterprise by agreement only). Full terms: [tickermint.cards/developers#terms](https://tickermint.cards/developers#terms).

## Quickstart

### curl

```sh
# search by name (optionally &game=pokemon|one-piece|lorcana|riftbound|gundam|yugioh|fusion-world)
curl -s "https://api.tickermint.cards/products/search?q=charizard%20ex%20199/165" \
  -H "X-API-Key: $TICKERMINT_API_KEY"
# -> [{"product_id":517045,"name":"Charizard ex - 199/165","set_name":"SV: Scarlet & Violet 151",
#      "game":"pokemon","market":"300.29","tickermint_url":"https://tickermint.cards/card/517045/charizard-ex-199", ...}]

# daily history by printing, oldest first
curl -s "https://api.tickermint.cards/products/517045/prices" -H "X-API-Key: $TICKERMINT_API_KEY"
# -> {"Holofoil":[{"snapshot_date":"2024-02-08","low":"108.00","market":"118.65"}, ...]}

# just the price, as one CSV cell (handy for shells and spreadsheets)
curl -s "https://api.tickermint.cards/sheets/price?q=charizard%20ex%20199/165"
# -> 300.29
```

Drop the `-H` line to call without a key (25 lookups a day per IP, current price plus 30 days of history).

### Python (standard library)

```python
import json, os, urllib.parse, urllib.request

def tickermint(path, **params):
    url = "https://api.tickermint.cards" + path + "?" + urllib.parse.urlencode(params)
    headers = {"User-Agent": "my-app/1.0"}  # required: urllib's default UA is blocked
    if os.environ.get("TICKERMINT_API_KEY"):
        headers["X-API-Key"] = os.environ["TICKERMINT_API_KEY"]
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=15) as r:
        return json.load(r)

card = tickermint("/products/search", q="charizard ex 199/165")[0]
print(card["name"], card["market"])  # market is a decimal string: use Decimal(card["market"])
print("Prices: TickerMint", card["tickermint_url"])
```

Or the typed client: `pip install https://tickermint.cards/sdk/tickermint-0.2.1-py3-none-any.whl` ([docs](https://tickermint.cards/developers/python)).

### JavaScript / TypeScript (Node 18+, server side)

```js
const headers = { "User-Agent": "my-app/1.0" };
if (process.env.TICKERMINT_API_KEY) headers["X-API-Key"] = process.env.TICKERMINT_API_KEY;
const res = await fetch("https://api.tickermint.cards/products/search?q=" + encodeURIComponent("charizard ex 199/165"), { headers });
const [card] = await res.json();
console.log(card.name, card.market, `Prices: TickerMint ${card.tickermint_url}`);
```

Or the typed client: `npm install https://tickermint.cards/sdk/tickermint-0.2.1.tgz` ([docs](https://tickermint.cards/developers/javascript)). Call the API from a server, route handler or script: it does not accept browser (CORS) calls from other sites, and your key must stay server side.

### MCP (Claude, ChatGPT, Cursor, any MCP client)

Remote server, streamable HTTP, read-only, no auth and no key: `https://api.tickermint.cards/mcp`. ChatGPT, Claude and Perplexity are not capped; any other caller gets 300 tool calls a day.

```json
{ "mcpServers": { "tickermint": { "type": "http", "url": "https://api.tickermint.cards/mcp" } } }
```

Claude Code: `claude mcp add --transport http tickermint https://api.tickermint.cards/mcp`, or install the plugin below.

## Attribution (required)

Without a key and on the Developer, API Pro and API Business plans, show a visible **"Prices: TickerMint"** link next to the prices, pointing to the card page the price came from:

```html
Prices: <a href="https://tickermint.cards/card/517045">TickerMint</a>
```

Use the `tickermint_url` field from product responses when present, otherwise build `https://tickermint.cards/card/{product_id}`. API Platform and Enterprise do not need it.

## Errors

Errors are JSON with a human-readable `detail`. On 401, 402, 403 and 429 the body also carries machine-readable fields:

```json
{"error": "quota_exceeded", "detail": "...", "how_to_fix": "...", "required_plan": "developer",
 "upgrade_url": "https://tickermint.cards/developers?ref=quota-single#plan",
 "docs_url": "https://tickermint.cards/docs/errors.md#quota-exceeded", "pricing_url": "https://tickermint.cards/pricing.json",
 "quota": {"plan": "no-key", "limit": 25, "used": 25, "period": "day", "resets_at": "2026-11-12T00:00:00+00:00"}}
```

This is the 429 a call without a key gets after 25 lookups in a day. Show `how_to_fix` (or `detail`) to the user and link `upgrade_url`. On 429, wait `Retry-After` seconds. Do not retry 401, 402 or 403 in a loop. A 403 with `error: trial_limit` means a bulk endpoint was called during an unpaid trial. Every metered answer has `X-Quota-Limit`, `X-Quota-Remaining`, `X-Quota-Reset` (unix time), `X-Quota-Period` and `X-Quota-Plan` headers. Reference: [errors.md](https://tickermint.cards/docs/errors.md).

## Common endpoints

| Endpoint | Returns |
|---|---|
| `GET /products/search?q=&game=` | matching cards and sealed products with today's `market` |
| `GET /products/{id}` | one product: name, set, number, rarity, image, game data |
| `GET /products/{id}/prices?days=` | daily `{snapshot_date, low, market}` per printing (30 days without a key, full history with a key) |
| `GET /products/{id}/ath` | all-time high and low per printing |
| `GET /cards/{pokemontcg.io id}` | products for a pokemontcg.io id such as `sv3pt5-199` (drop-in for stored ids) |
| `GET /sets?game=`, `GET /sets/{group_id}` | sets with values; one set's cards with prices |
| `GET /desk/movers?game=&days=` | biggest gainers and losers over 1 to 90 days |
| `GET /sheets/price?q=&field=` | one CSV cell: `market`, `low`, `name`, `url`, `id` or `date` |
| `GET /products/{id}.csv`, `GET /sets/{group_id}.csv` | CSV rows (key needed, any plan) |
| `GET /sheets/prices?q=&q=` | up to 50 names or ids as CSV (key needed, any plan) |
| `GET /v1/bulk/day`, `GET /v1/bulk/history`, `GET /v1/bulk/base-rates` | bulk prices and history (Developer and above, not during an unpaid trial) |
| `/v1/webhooks` | price-move and new-product webhooks (API Pro and above) |
| `GET /v1/graded/products/{id}` | graded prices (paid add-on on API Pro and above) |

`game` is one of `pokemon`, `one-piece`, `lorcana`, `riftbound`, `gundam`, `yugioh`, `fusion-world`. Full schema: [openapi.json](https://api.tickermint.cards/openapi.json).

## Moving from pokemontcg.io

pokemontcg.io API keys stop working on March 1, 2027 (2027-03-01), and new registrations are closed ([source](https://tickermint.cards/pokemon-tcg-api)). `GET /cards/{id}` takes the pokemontcg.io card id you already store (such as `sv3pt5-199` or `swsh7-215`; TCGdex ids such as `sv03.5-199` work too), so stored ids keep working. About 21,000 cards are mapped.

| pokemontcg.io | TickerMint | Notes |
|---|---|---|
| `GET /v2/cards?q=name:charizard` | `GET /products/search?q=charizard&game=pokemon` | name, number and set search, cards and sealed |
| `GET /v2/cards/{id}` | `GET /cards/{id}` | same id; returns the TCGplayer product(s) with today's market price |
| `GET /v2/sets` | `GET /sets?game=pokemon` | every set |
| `GET /v2/sets/{id}` plus its cards | `GET /sets/{group_id}` | the set's cards with prices in one call |
| `tcgplayer.prices` on a card | `GET /products/{product_id}/prices` | daily market history per printing, not only today (see [Quickstart](#quickstart)) |

Differences to plan for: ids in responses are TCGplayer product ids (`product_id`) and set ids are `group_id`; prices are decimal strings; one pokemontcg.io id can return more than one product.

Search cards by name (run 2026-11-11 UTC without a key, HTTP 200, response trimmed):

```sh
curl -s "https://api.tickermint.cards/products/search?q=charizard%20ex%20199/165&game=pokemon"
# [{"product_id":517045,"name":"Charizard ex - 199/165","group_id":23237,
#   "set_name":"SV: Scarlet & Violet 151","card_number":"199/165",
#   "rarity":"Special Illustration Rare","card_id":"sv03.5-199","game":"pokemon","market":"293.04",
#   "tickermint_url":"https://tickermint.cards/card/517045/charizard-ex-199", ...}]
```

Get a card by its pokemontcg.io id (run 2026-11-11 UTC without a key, HTTP 200, response trimmed):

```sh
curl -s "https://api.tickermint.cards/cards/sv3pt5-199"
# [{"product_id":517045,"name":"Charizard ex - 199/165","group_id":23237,
#   "set_name":"SV: Scarlet & Violet 151","card_number":"199/165","game":"pokemon",
#   "market":"293.04","printing":"Holofoil",
#   "attribution":{"text":"Prices: TickerMint","url":"https://tickermint.cards/card/517045/charizard-ex-199"},
#   "tickermint_url":"https://tickermint.cards/card/517045/charizard-ex-199", ...}]
```

Each call above is one lookup. Without a key you have 25 a day per IP, so cache answers while you port.

## Docs for agents and LLMs

- [AGENTS.md](AGENTS.md): integration rules for coding agents (Claude Code, Codex, Cursor, Copilot)
- [llms-full.txt](https://tickermint.cards/llms-full.txt): every endpoint, field and rule in one file; index at [llms.txt](https://tickermint.cards/llms.txt)
- [openapi.json](https://api.tickermint.cards/openapi.json)
- [pricing.json](https://tickermint.cards/pricing.json) and [pricing.md](https://tickermint.cards/docs/pricing.md): machine-readable plans
- MCP server: `https://api.tickermint.cards/mcp`
- Agent Skill: [skills/tickermint/SKILL.md](skills/tickermint/SKILL.md)

### Claude Code plugin (skill + MCP server)

```
/plugin marketplace add seankarltonlee/tickermint-examples
/plugin install tickermint@tickermint
```

## Examples

| Example | What it shows |
|---|---|
| [examples/python](examples/python) | standard-library script: search a card, print price, 30-day change and the attribution link |
| [examples/javascript](examples/javascript) | the same in Node 18+ `fetch` (ESM) and TypeScript with response types |
| [examples/google-sheets](examples/google-sheets) | `=IMPORTDATA` formulas and an Apps Script `=TICKERMINT("card")` function |
| [examples/discord-bot](examples/discord-bot) | discord.js v14 `/price <card>` slash command with a 30-day summary |
| [examples/nextjs-price-widget](examples/nextjs-price-widget) | Next.js App Router server component price card and a route handler, key server side only |

Every example reads `TICKERMINT_API_KEY` and shows the attribution link. The key is optional: without one each example runs on the 25 lookups a day per IP. To get a key, start a plan (7-day trial, card required) at [tickermint.cards/developers#plan](https://tickermint.cards/developers#plan).

## License

The code in this repo is MIT ([LICENSE](LICENSE)). The price data you get from the API is covered by the [TickerMint API terms](https://tickermint.cards/developers#terms), not by this license.

Questions or a plan that does not fit: hello@tickermint.cards. Issues: [github.com/seankarltonlee/tickermint-examples/issues](https://github.com/seankarltonlee/tickermint-examples/issues).
