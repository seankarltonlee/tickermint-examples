# Card prices in Google Sheets

Daily TCGplayer market prices for Pokemon, One Piece, Lorcana, Riftbound, Gundam and Yu-Gi-Oh cards, straight into a cell. No code for the formulas; an optional Apps Script adds `=TICKERMINT()`.

## Formulas (no setup)

| What | Formula |
|---|---|
| Latest market price by name, one cell | `=IMPORTDATA("https://api.tickermint.cards/sheets/price?q=charizard%20ex%20199/165")` |
| Low price instead | `=IMPORTDATA("https://api.tickermint.cards/sheets/price?q=charizard%20ex%20199/165&field=low")` |
| Card page link (for the attribution) | `=IMPORTDATA("https://api.tickermint.cards/sheets/price?q=charizard%20ex%20199/165&field=url")` |
| Name, id or price date | `&field=name`, `&field=id`, `&field=date` |
| Limit to one game | `&game=one-piece` (pokemon, one-piece, lorcana, riftbound, gundam, yugioh) |
| Name from a cell | `=IMPORTDATA("https://api.tickermint.cards/sheets/price?q="&ENCODEURL(A2))` |
| Up to 50 names at once, key needed (header + one row each: query, name, market, date, url) | `=IMPORTDATA("https://api.tickermint.cards/sheets/prices?q=charizard%20ex%20199/165&q=umbreon%20vmax%20215/203")` |
| One card by TickerMint/TCGplayer product id, key needed (date, product_id, name, set, number, printing, market_price_usd, url) | `=IMPORTDATA("https://api.tickermint.cards/products/517045.csv")` |
| A whole set, one row per card, key needed | `=IMPORTDATA("https://api.tickermint.cards/sets/23237.csv")` |

Live values on 2026-10-31: `market` 300.29, `low` 269.99, `url` https://tickermint.cards/card/517045/charizard-ex-199.

### Keys

Usage is counted in card lookups: one per single price, and one per card returned for `/sheets/prices` and the `.csv` files (a 200-card set is 200 lookups). Errors count zero.

Without a key you get single prices only (`/sheets/price`), sharing 100 lookups a day per Google IP, so busy sheets run out. `/sheets/prices` and the `.csv` files need a key from 2026-11-14. Get a free key with just an email at https://tickermint.cards/developers#keys (1,000 lookups a day) and add `&key=YOUR_KEY` to the URL. Keep that sheet private: anyone who can open it can read the key.

## Apps Script: `=TICKERMINT("card name")`

1. Extensions > Apps Script, paste [tickermint.gs](tickermint.gs), save.
2. Optional: Project Settings > Script properties > add `TICKERMINT_API_KEY` with your free key. The key then stays out of the sheet's cells.
3. In any cell:

```
=TICKERMINT("charizard ex 199/165")            -> 300.29 (a number)
=TICKERMINT("charizard ex 199/165", "low")     -> 269.99
=TICKERMINT("charizard ex 199/165", "url")     -> https://tickermint.cards/card/517045/charizard-ex-199
=TICKERMINT("luffy op05-119", "market", "one-piece")
=TICKERMINT(A2)
```

Results are cached for 6 hours (prices update once a day), so recalculations do not burn lookups.

## Attribution

If you publish or share the prices (a shop sheet, a public tracker), show "Prices: TickerMint" linking to the card page, for example `=HYPERLINK(TICKERMINT(A2, "url"), "Prices: TickerMint")`. Personal sheets for your own collection are free. A store using prices for selling or buylists needs API Pro or above: see the plan table in the [main README](../../README.md#which-plan-do-i-need).
