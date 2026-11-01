// /?q=charizard%20ex%20199/165 renders the first match as a price card.
// /?id=517045 renders that TickerMint (TCGplayer) product id directly.
import PriceCard from "./components/PriceCard";
import { searchCards, TickerMintError } from "@/lib/tickermint";

export const revalidate = 3600;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; id?: string; game?: string }> }) {
  const { q = "charizard ex 199/165", id, game } = await searchParams;
  try {
    const productId = id ? Number(id) : (await searchCards(q, game))[0]?.product_id;
    return (
      <main>
        <form style={{ marginBottom: 16 }}>
          <input name="q" defaultValue={q} placeholder="Card name and number" style={{ padding: 8, width: 280 }} />{" "}
          <button type="submit">Price it</button>
        </form>
        {productId ? <PriceCard productId={productId} /> : <p>No card found for &quot;{q}&quot;.</p>}
      </main>
    );
  } catch (e) {
    if (e instanceof TickerMintError) {
      return (
        <main>
          <p>{e.message}</p>
          {e.upgradeUrl ? <a href={e.upgradeUrl}>Fix: {e.requiredPlan ?? "get a key"}</a> : null}
        </main>
      );
    }
    throw e;
  }
}
