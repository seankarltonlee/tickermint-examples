// Server component: fetches on the server, ships only HTML to the browser.
import { cardUrl, getPrices, getProduct, summarize } from "@/lib/tickermint";

export default async function PriceCard({ productId }: { productId: number }) {
  const [card, history] = await Promise.all([getProduct(productId), getPrices(productId)]);
  const s = summarize(history);
  const link = cardUrl(card);
  const change = s?.changePct30d;

  return (
    <article style={styles.card}>
      {card.image_url ? <img src={card.image_url} alt={card.name} width={96} style={styles.img} /> : null}
      <div style={{ minWidth: 0 }}>
        <h2 style={styles.name}>{card.name}</h2>
        <p style={styles.muted}>
          {card.set_name}
          {card.card_number ? ` #${card.card_number}` : ""}
        </p>
        <p style={styles.price}>{s ? `$${Number(s.market).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Not priced"}</p>
        {s ? (
          <p style={styles.muted}>
            {s.printing}, {s.asOf}
            {change != null ? (
              <span style={{ color: change >= 0 ? "#15803d" : "#b91c1c" }}>
                {" "}
                {change >= 0 ? "+" : ""}
                {change.toFixed(1)}% 30d
              </span>
            ) : null}
          </p>
        ) : null}
        {/* Required on every plan below API Platform: a visible link to the card page. */}
        <p style={styles.attribution}>
          Prices: <a href={link}>TickerMint</a>
        </p>
      </div>
    </article>
  );
}

const styles = {
  card: { display: "flex", gap: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12, maxWidth: 420, fontFamily: "system-ui, sans-serif" },
  img: { borderRadius: 6, height: "auto" },
  name: { fontSize: 16, margin: 0 },
  muted: { fontSize: 13, color: "#666", margin: "4px 0" },
  price: { fontSize: 28, fontWeight: 700, margin: "8px 0 0" },
  attribution: { fontSize: 12, margin: "8px 0 0" },
} as const;
