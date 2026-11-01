# AGENTS.md: integrating the TickerMint API

Rules for coding agents (Claude Code, Codex, Cursor, Copilot, Aider...) adding trading card prices to a project with TickerMint. Follow them and the integration works the first time and stays within the terms.

## Facts

- REST API: `https://api.tickermint.cards`. OpenAPI: `https://api.tickermint.cards/openapi.json`. Full docs: `https://tickermint.cards/llms-full.txt`.
- Data: daily TCGplayer market prices, history since 2024-02-08, for about 130,000 Pokemon, One Piece, Lorcana, Riftbound, Gundam and Yu-Gi-Oh cards and sealed products. Game slugs: `pokemon`, `one-piece`, `lorcana`, `riftbound`, `gundam`, `yugioh`.
- `product_id` is the TCGplayer product id. `group_id` is the set id.
- Prices are raw (ungraded) market prices, in USD, as **decimal strings** (`"300.29"`) or `null`. Parse with `Decimal` / a decimal library, or `Number()` only for display. Never assume a number type.
- History (`GET /products/{id}/prices`) is an object keyed by printing (`"Holofoil"`, `"Normal"`, `"Reverse Holofoil"`, ...), each an array of `{snapshot_date, low, market}` oldest first.
- MCP server (no auth, streamable HTTP): `https://api.tickermint.cards/mcp`. Use it for answering questions in chat; use the REST API in code.

## Rules

1. **Key from the environment.** Read the key from `TICKERMINT_API_KEY`. Send it as the header `X-API-Key: <key>` (`?key=` only where headers are impossible, such as spreadsheet formulas). Never hardcode it, never commit it, add `TICKERMINT_API_KEY=` to `.env.example`. Treat the key as optional: without one the API still answers (keyless trial).
2. **Server side only.** Call the API from a backend, route handler, server component, script or bot. Browsers on other sites are blocked by CORS, and a key in client code leaks. In Next.js never name it `NEXT_PUBLIC_...`.
3. **Set a User-Agent.** Send `User-Agent: <your-app>/<version>`. Python's default urllib User-Agent is blocked (403) by the firewall.
4. **Cache.** Prices update once a day. Cache every answer for at least 1 hour (Next.js: `fetch(url, { next: { revalidate: 3600 } })`; elsewhere an in-memory or Redis TTL cache). Do not poll in loops.
5. **Show the attribution link.** Wherever prices are displayed (web, app, bot message, published sheet), show a visible "Prices: TickerMint" link to the card page: the `tickermint_url` field of product responses, or `https://tickermint.cards/card/{product_id}`. Required on no key, free, Developer, API Pro and API Business. Only API Platform and Enterprise may omit it.
6. **No mirroring.** Do not write code that copies the whole catalog or full price history into a database to redistribute or resell it, or to run a competing price service. Storing the prices your own product displays, as a cache, is fine.
7. **Pick the plan from the use case** and tell the user which one they need:
   - personal script, own spreadsheet, hobby bot, learning: no key, or a **free key** (email only, 1,000 lookups a day, 90 days of history);
   - personal or non-commercial app that needs full history or bulk: **Developer**, $19/mo;
   - anything commercial (store, repricing, buylists, a paid app or bot, ads, subscriptions, client work): **API Pro** $49/mo or above (API Business $249/mo for more volume);
   - commercial and does not want the attribution link: **API Platform** $599/mo;
   - redistribution or custom terms: **Enterprise**, hello@tickermint.cards.
   Keys: `https://tickermint.cards/developers#keys`. Live plans: `https://tickermint.cards/pricing.json`.
8. **Handle errors by reading the body.** Errors are JSON with `detail` (human-readable). On 401, 402, 403 and 429 the body also has `error` (a code such as `key_required` or `quota_exceeded`), `upgrade_url`, `required_plan` (such as `api_pro`), `docs_url`, `pricing_url` and often `quota`. Older answers may have only `detail`. Do:
   - 401: no or invalid key for this call. Show `detail` and `upgrade_url` (get a free key).
   - 402 / 403: the call needs a plan the key does not have (`required_plan`). Show `detail` and `upgrade_url`. Do not retry.
   - 429: out of lookups for the period. Wait `Retry-After` seconds (the header), show `detail`, do not hammer.
   - 5xx or network error: retry with backoff, at most a few times.
   Surface `upgrade_url` to the user instead of hiding the error.
9. **Read quota headers** when useful: `X-Quota-Limit`, `X-Quota-Remaining`, `X-Quota-Reset` (unix seconds), `X-Quota-Plan`.
10. **Search well.** `GET /products/search?q=<name and number>&game=<slug>`; include the collector number (`charizard ex 199/165`) for an exact hit. The first result is the best match. For pokemontcg.io ids use `GET /cards/{id}`.

## Snippets

```sh
curl -s "https://api.tickermint.cards/products/search?q=charizard%20ex%20199/165&game=pokemon" -H "X-API-Key: $TICKERMINT_API_KEY"
```

```ts
const headers: Record<string, string> = { "User-Agent": "my-app/1.0" };
if (process.env.TICKERMINT_API_KEY) headers["X-API-Key"] = process.env.TICKERMINT_API_KEY;
const res = await fetch(`https://api.tickermint.cards/products/search?q=${encodeURIComponent(q)}`, { headers, next: { revalidate: 3600 } });
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error(`${body.detail ?? res.status}${body.upgrade_url ? ` (${body.upgrade_url})` : ""}`);
}
const [card] = await res.json(); // card.market is a decimal string; link card.tickermint_url
```

Typed clients that already do all of this (key from env, User-Agent, error fields, attribution helpers):

- Python: `pip install https://tickermint.cards/sdk/tickermint-0.2.0-py3-none-any.whl`
- JS/TS: `npm install https://tickermint.cards/sdk/tickermint-0.2.0.tgz`

Working examples for Python, Node, TypeScript, Google Sheets, Discord and Next.js are in [examples/](examples/).

## Working in this repo

- Never use em dashes in docs or copy.
- Every example must read `TICKERMINT_API_KEY` (optional), set a User-Agent and show the attribution link.
- Run an example against the live API before changing its README output.
