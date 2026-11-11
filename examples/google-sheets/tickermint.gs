/**
 * =TICKERMINT("card name") for Google Sheets: the latest TCGplayer market
 * price of a Pokemon, One Piece, Lorcana, Riftbound, Gundam, Yu-Gi-Oh or
 * Dragon Ball Super Fusion World card from the TickerMint API.
 *
 * Install: Extensions > Apps Script, paste this file, save.
 * Without a key the sheet shares 25 lookups a day per Google IP.
 * Optional key: Project Settings > Script properties > add TICKERMINT_API_KEY.
 * A key comes with a plan (7-day trial, card required):
 * https://tickermint.cards/developers#plan
 *
 * Show "Prices: TickerMint" next to the prices you publish, linking to the
 * card page: =TICKERMINT("charizard ex 199/165", "url").
 *
 * @param {string} query Card name, collector number or TickerMint product id.
 * @param {string} field Optional: market (default), low, name, url, id or date.
 * @param {string} game Optional: pokemon, one-piece, lorcana, riftbound, gundam, yugioh or fusion-world.
 * @return The value as a number (prices) or text.
 * @customfunction
 */
function TICKERMINT(query, field, game) {
  if (!query) return "";
  field = String(field || "market").toLowerCase();
  var cacheKey = ["tm", query, field, game || ""].join("|").slice(0, 240);
  var cache = CacheService.getScriptCache();
  var hit = cache.get(cacheKey);
  if (hit !== null) return asValue(hit, field);

  var url = "https://api.tickermint.cards/sheets/price?q=" + encodeURIComponent(query) +
    "&field=" + encodeURIComponent(field) + (game ? "&game=" + encodeURIComponent(game) : "");
  var headers = { "User-Agent": "tickermint-examples-sheets/1.0" };
  var key = PropertiesService.getScriptProperties().getProperty("TICKERMINT_API_KEY");
  if (key) headers["X-API-Key"] = key;

  var res = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true });
  var text = res.getContentText().trim().replace(/^"|"$/g, "");
  if (res.getResponseCode() >= 400) {
    try {
      var body = JSON.parse(text);
      return "TickerMint: " + (body.detail || body.error) + (body.upgrade_url ? " " + body.upgrade_url : "");
    } catch (e) {
      return "TickerMint error " + res.getResponseCode();
    }
  }
  // prices change once a day: cache 6 hours (the Apps Script maximum)
  cache.put(cacheKey, text, 21600);
  return asValue(text, field);
}

function asValue(text, field) {
  if (field === "market" || field === "low") {
    var n = Number(text);
    return text !== "" && !isNaN(n) ? n : text;
  }
  return text;
}
