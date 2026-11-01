// Server-side TickerMint client. Import it only from server components and
// route handlers: it reads TICKERMINT_API_KEY, which must never reach the browser
// (do not rename it NEXT_PUBLIC_...). The API also refuses browser calls from
// other websites, so server side is the only place to call it.

const API = "https://api.tickermint.cards";

/** Prices are decimal strings ("300.29"), null when unpriced. */
export type Price = string | null;

export interface Product {
  product_id: number; // the TCGplayer product id
  name: string;
  group_id: number;
  set_name: string;
  card_number: string | null;
  rarity: string | null;
  image_url: string | null;
  game: string;
  market: Price;
  tickermint_url?: string;
}

export interface PricePoint {
  snapshot_date: string;
  low: Price;
  market: Price;
}

export type PriceHistory = Record<string, PricePoint[]>;

export class TickerMintError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    readonly upgradeUrl: string | null,
    readonly requiredPlan: string | null,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const headers: Record<string, string> = { "User-Agent": "tickermint-examples-nextjs/1.0", Accept: "application/json" };
  if (process.env.TICKERMINT_API_KEY) headers["X-API-Key"] = process.env.TICKERMINT_API_KEY;
  // Prices update once a day: let Next cache each answer for an hour.
  const res = await fetch(url, { headers, next: { revalidate: 3600 } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    throw new TickerMintError(
      res.status,
      str(body.error),
      str(body.upgrade_url),
      str(body.required_plan),
      str(body.detail) ?? `TickerMint API ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

export const searchCards = (q: string, game?: string) => get<Product[]>("/products/search", { q, game });
export const getProduct = (id: number) => get<Product>(`/products/${id}`);
export const getPrices = (id: number) => get<PriceHistory>(`/products/${id}/prices`);

/** The card page the attribution link must point to. */
export const cardUrl = (p: Pick<Product, "product_id" | "tickermint_url">) =>
  p.tickermint_url ?? `https://tickermint.cards/card/${p.product_id}`;

export interface PriceSummary {
  printing: string;
  market: string;
  asOf: string;
  changePct30d: number | null;
}

/** Latest price and 30-day change of the printing priced most recently. */
export function summarize(history: PriceHistory): PriceSummary | null {
  let best: { printing: string; points: PricePoint[] } | null = null;
  for (const [printing, points] of Object.entries(history)) {
    const priced = points.filter((p) => p.market !== null).slice(-30);
    if (!priced.length) continue;
    if (!best || priced[priced.length - 1].snapshot_date > best.points[best.points.length - 1].snapshot_date) {
      best = { printing, points: priced };
    }
  }
  if (!best) return null;
  const first = Number(best.points[0].market);
  const last = best.points[best.points.length - 1];
  return {
    printing: best.printing,
    market: last.market as string,
    asOf: last.snapshot_date,
    changePct30d: best.points.length > 1 && first ? ((Number(last.market) - first) / first) * 100 : null,
  };
}
