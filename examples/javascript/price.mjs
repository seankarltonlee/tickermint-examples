#!/usr/bin/env node
// Look up a trading card's latest market price and 30-day change with the TickerMint API.
//
//   node price.mjs "charizard ex 199/165"
//   node price.mjs "luffy op05-119" one-piece
//
// Node 18+ (built-in fetch), no dependencies. Set TICKERMINT_API_KEY for your
// own quota; without it you get 25 lookups a day per IP. A key comes with a
// plan (7-day trial, card required): https://tickermint.cards/developers#plan
// Run it server side: the API does not accept browser calls from other websites.

const API = "https://api.tickermint.cards";

async function get(path, params = {}) {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const headers = { "User-Agent": "tickermint-examples-js/1.0", Accept: "application/json" };
  if (process.env.TICKERMINT_API_KEY) headers["X-API-Key"] = process.env.TICKERMINT_API_KEY;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(`TickerMint API ${res.status}: ${typeof body.detail === "string" ? body.detail : res.statusText}`);
    Object.assign(err, {
      status: res.status,
      code: body.error ?? null,
      upgradeUrl: body.upgrade_url ?? null,
      requiredPlan: body.required_plan ?? null,
      retryAfter: Number(res.headers.get("retry-after")) || null,
    });
    throw err;
  }
  return res.json();
}

const [query, game] = process.argv.slice(2);
if (!query) {
  console.error('usage: node price.mjs "card name" [game]');
  process.exit(1);
}

try {
  const [card] = await get("/products/search", { q: query, game });
  if (!card) {
    console.log(`No card found for "${query}"`);
    process.exit(1);
  }
  // { "Holofoil": [{ snapshot_date, low, market }, ...] }, oldest first; prices are decimal strings
  const history = await get(`/products/${card.product_id}/prices`);

  console.log(`${card.name} (${card.set_name}, ${card.game})`);
  console.log(card.market ? `Market price: $${card.market}` : "Market price: not priced today");
  for (const [printing, points] of Object.entries(history)) {
    const priced = points.filter((p) => p.market !== null).slice(-30);
    if (priced.length < 2) continue;
    const first = Number(priced[0].market);
    const last = priced.at(-1);
    const change = first ? ((Number(last.market) - first) / first) * 100 : 0;
    console.log(`  ${printing}: $${last.market} on ${last.snapshot_date}, ${change >= 0 ? "+" : ""}${change.toFixed(1)}% since ${priced[0].snapshot_date}`);
  }

  // Attribution: required on every plan below API Platform.
  console.log(`Prices: TickerMint ${card.tickermint_url ?? `https://tickermint.cards/card/${card.product_id}`}`);
} catch (e) {
  console.error(e.message);
  if (e.upgradeUrl) console.error(`Fix: ${e.upgradeUrl}`);
  process.exit(2);
}
