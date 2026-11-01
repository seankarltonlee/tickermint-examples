// GET /api/price?q=charizard%20ex%20199/165 (or ?id=517045) -> JSON for your own front end.
// The key stays on the server; the response carries the attribution your UI must show.
import { cardUrl, getPrices, getProduct, searchCards, summarize, TickerMintError } from "@/lib/tickermint";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const id = Number(params.get("id"));
  try {
    const productId = Number.isInteger(id) && id > 0 ? id : q && q.length >= 2 ? (await searchCards(q, params.get("game") ?? undefined))[0]?.product_id : undefined;
    if (!productId) return Response.json({ error: "not_found", detail: "Pass ?q=<card name> or ?id=<product id>." }, { status: 404 });
    const [card, history] = await Promise.all([getProduct(productId), getPrices(productId)]);
    const link = cardUrl(card);
    return Response.json(
      {
        product_id: card.product_id,
        name: card.name,
        set_name: card.set_name,
        image_url: card.image_url,
        price: summarize(history),
        attribution: { text: "Prices: TickerMint", url: link, html: `Prices: <a href="${link}">TickerMint</a>` },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    if (e instanceof TickerMintError) {
      return Response.json(
        { error: e.code ?? "upstream_error", detail: e.message, upgrade_url: e.upgradeUrl, required_plan: e.requiredPlan },
        { status: e.status === 429 ? 503 : 502 },
      );
    }
    throw e;
  }
}
