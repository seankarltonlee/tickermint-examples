# TickerMint API examples

[TickerMint](https://tickermint.cards/developers) is a REST API (plus an MCP server) of daily TCGplayer market prices for about 130,000 Pokemon, One Piece, Lorcana, Riftbound, Gundam and Yu-Gi-Oh cards and sealed products, with daily history back to 2024-02-08.
This repo has copy-paste examples and the rules a coding agent needs to wire it in correctly the first time.

- Base URL: `https://api.tickermint.cards`
- Auth: optional header `X-API-Key: $TICKERMINT_API_KEY` (or `?key=`). No key works for trying it.
- Product ids are TCGplayer product ids. Prices are raw (ungraded) and are **decimal strings** in JSON (`"300.29"`), `null` when unpriced.
- Prices update once a day: cache answers for at least an hour.
- Show a "Prices: TickerMint" link to `https://tickermint.cards/card/{product_id}` next to prices (all plans below API Platform).

## Which plan do I need?

Usage is counted in card lookups (one per card returned; errors count zero). Live numbers: [pricing.json](https://tickermint.cards/pricing.json), [pricing.md](https://tickermint.cards/docs/pricing.md), or `GET https://api.tickermint.cards/meta` (`quota`).

| Your use case | Plan | Lookups | History | Price |
|---|---|---|---|---|
| Trying the API, a one-off script | No key | 100 a day per IP | 30 days | free |
| Personal project, your own spreadsheet, a hobby Discord bot, a school project | Free key (email only) | 1,000 a day | 90 days | free |
| Personal or non-commercial app that needs full history or bulk endpoints | Developer | 100,000 a month | full, since 2024-02-08 | $19/mo |
| **Anything commercial**: a store, repricing or buylists, a paid app or bot, an app with ads or subscriptions, client work | API Pro (first commercial plan) | 250,000 a month | full, plus webhooks | $49/mo |
| A larger commercial product | API Business | 1,500,000 a month | full | $249/mo |
| Commercial product that does not want to show the attribution link | API Platform | 5,000,000 a month | full | $599/mo |
| More volume, redistribution or a custom license | Enterprise | by agreement | | hello@tickermint.cards |

Yearly billing is 2 months free. Every paid plan starts with a 7-day trial (card required). Get a key at [tickermint.cards/developers#keys](https://tickermint.cards/developers#keys) (email login).

What no plan allows: copying or mirroring the catalog or price history as a dataset for redistribution, or reselling it as a competing price service (Enterprise by agreement only). Full terms: [tickermint.cards/developers#terms](https://tickermint.cards/developers#terms).

## Quickstart

### curl

```sh
# search by name (optionally &game=pokemon|one-piece|lorcana|riftbound|gundam|yugioh)
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

Drop the `-H` line to use the keyless trial.

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

Or the typed client: `pip install https://tickermint.cards/sdk/tickermint-0.2.0-py3-none-any.whl` ([docs](https://tickermint.cards/developers/python)).

### JavaScript / TypeScript (Node 18+, server side)

```js
const headers = { "User-Agent": "my-app/1.0" };
if (process.env.TICKERMINT_API_KEY) headers["X-API-Key"] = process.env.TICKERMINT_API_KEY;
const res = await fetch("https://api.tickermint.cards/products/search?q=" + encodeURIComponent("charizard ex 199/165"), { headers });
const [card] = await res.json();
console.log(card.name, card.market, `Prices: TickerMint ${card.tickermint_url}`);
```

Or the typed client: `npm install https://tickermint.cards/sdk/tickermint-0.2.0.tgz` ([docs](https://tickermint.cards/developers/javascript)). Call the API from a server, route handler or script: it does not accept browser (CORS) calls from other sites, and your key must stay server side.

### MCP (Claude, ChatGPT, Cursor, any MCP client)

Remote server, streamable HTTP, no auth: `https://api.tickermint.cards/mcp`

```json
{ "mcpServers": { "tickermint": { "type": "http", "url": "https://api.tickermint.cards/mcp" } } }
```

Claude Code: `claude mcp add --transport http tickermint https://api.tickermint.cards/mcp`, or install the plugin below.

## Attribution (required)

On the no-key, free, Developer, API Pro and API Business plans, show a visible **"Prices: TickerMint"** link next to the prices, pointing to the card page the price came from:

```html
Prices: <a href="https://tickermint.cards/card/517045">TickerMint</a>
```

Use the `tickermint_url` field from product responses when present, otherwise build `https://tickermint.cards/card/{product_id}`. API Platform and Enterprise do not need it.

## Errors

Errors are JSON with a human-readable `detail`. On 401, 402, 403 and 429 the body also carries machine-readable fields:

```json
{"error": "quota_exceeded", "detail": "...", "required_plan": "api_pro",
 "upgrade_url": "https://tickermint.cards/developers#plan", "docs_url": "...", "pricing_url": "https://tickermint.cards/pricing.json",
 "quota": {"plan": "free_key", "limit": 1000, "used": 1000, "period": "day", "resets_at": "..."}}
```

Show `detail` to the user and link `upgrade_url`. On 429, wait `Retry-After` seconds. Older answers may carry only `detail`. Every metered answer has `X-Quota-Limit`, `X-Quota-Remaining`, `X-Quota-Reset` (unix time) and `X-Quota-Plan` headers.

## Common endpoints

| Endpoint | Returns |
|---|---|
| `GET /products/search?q=&game=` | matching cards and sealed products with today's `market` |
| `GET /products/{id}` | one product: name, set, number, rarity, image, game data |
| `GET /products/{id}/prices` | daily `{snapshot_date, low, market}` per printing |
| `GET /products/{id}/ath` | all-time high and low per printing |
| `GET /cards/{pokemontcg.io id}` | products for a pokemontcg.io id such as `sv3pt5-199` (drop-in for stored ids) |
| `GET /sets?game=`, `GET /sets/{group_id}` | sets with values; one set's cards with prices |
| `GET /desk/movers?game=&days=` | biggest gainers and losers over 1 to 365 days |
| `GET /sheets/price?q=&field=` | one CSV cell: `market`, `low`, `name`, `url`, `id` or `date` |
| `GET /products/{id}.csv`, `GET /sets/{group_id}.csv` | CSV rows (key needed) |

Full schema: [openapi.json](https://api.tickermint.cards/openapi.json).

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

Every example reads `TICKERMINT_API_KEY` (optional for the keyless trial) and shows the attribution link.

## License

The code in this repo is MIT ([LICENSE](LICENSE)). The price data you get from the API is covered by the [TickerMint API terms](https://tickermint.cards/developers#terms), not by this license.

Questions or a plan that does not fit: hello@tickermint.cards. Issues: [github.com/seankarltonlee/tickermint-examples/issues](https://github.com/seankarltonlee/tickermint-examples/issues).
