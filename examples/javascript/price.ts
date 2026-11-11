// TypeScript version of price.mjs, with the response types you need.
//
//   npx tsx price.ts "charizard ex 199/165"
//   (or: npx tsc && node dist/price.js "charizard ex 199/165")
//
// Node 18+, no runtime dependencies. Reads TICKERMINT_API_KEY when set; without
// it you get 25 lookups a day per IP. A key comes with a plan (7-day trial,
// card required): https://tickermint.cards/developers#plan
// Prefer the typed client for bigger projects: npm install https://tickermint.cards/sdk/tickermint-0.2.1.tgz

const API = "https://api.tickermint.cards";

/** Prices are decimal strings ("300.29"), null when unpriced. */
type Price = string | null;

interface Product {
  product_id: number; // the TCGplayer product id
  name: string;
  group_id: number;
  set_name: string;
  card_number: string | null;
  rarity: string | null;
  image_url: string | null;
  game: string;
  market: Price;
  /** the TickerMint card page: link the price to it */
  tickermint_url?: string;
}

interface PricePoint {
  snapshot_date: string; // YYYY-MM-DD
  low: Price;
  market: Price;
}

/** Daily prices keyed by printing, oldest first. */
type PriceHistory = Record<string, PricePoint[]>;

/** Error body on 401/402/403/429; older answers have only `detail`. */
interface ApiErrorBody {
  detail?: unknown;
  error?: string;
  required_plan?: string | null;
  upgrade_url?: string;
  docs_url?: string;
  pricing_url?: string;
}

class TickerMintError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
    readonly retryAfter: number | null,
  ) {
    super(`TickerMint API ${status}: ${typeof body.detail === "string" ? body.detail : JSON.stringify(body)}`);
  }
  get code() {
    return this.body.error ?? null;
  }
  get upgradeUrl() {
    return this.body.upgrade_url ?? null;
  }
  get requiredPlan() {
    return this.body.required_plan ?? null;
  }
}

async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const headers: Record<string, string> = { "User-Agent": "tickermint-examples-ts/1.0", Accept: "application/json" };
  const key = process.env.TICKERMINT_API_KEY;
  if (key) headers["X-API-Key"] = key;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new TickerMintError(res.status, body, Number(res.headers.get("retry-after")) || null);
  }
  return (await res.json()) as T;
}

export function attributionUrl(card: Pick<Product, "product_id" | "tickermint_url">): string {
  return card.tickermint_url ?? `https://tickermint.cards/card/${card.product_id}`;
}

async function main(): Promise<number> {
  const [query, game] = process.argv.slice(2);
  if (!query) {
    console.error('usage: price.ts "card name" [game]');
    return 1;
  }
  const [card] = await get<Product[]>("/products/search", { q: query, game });
  if (!card) {
    console.log(`No card found for "${query}"`);
    return 1;
  }
  const history = await get<PriceHistory>(`/products/${card.product_id}/prices`);

  console.log(`${card.name} (${card.set_name}, ${card.game})`);
  console.log(card.market ? `Market price: $${card.market}` : "Market price: not priced today");
  for (const [printing, points] of Object.entries(history)) {
    const priced = points.filter((p) => p.market !== null).slice(-30);
    if (priced.length < 2) continue;
    const first = Number(priced[0].market);
    const last = priced[priced.length - 1];
    const change = first ? ((Number(last.market) - first) / first) * 100 : 0;
    console.log(`  ${printing}: $${last.market} on ${last.snapshot_date}, ${change >= 0 ? "+" : ""}${change.toFixed(1)}% since ${priced[0].snapshot_date}`);
  }
  console.log(`Prices: TickerMint ${attributionUrl(card)}`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    if (e instanceof TickerMintError && e.upgradeUrl) console.error(`Fix: ${e.upgradeUrl}`);
    process.exit(2);
  },
);
