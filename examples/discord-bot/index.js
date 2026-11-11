// Discord bot: /price <card> [game] replies with the latest TCGplayer market price
// and a 30-day summary from the TickerMint API.
//
//   DISCORD_TOKEN=... TICKERMINT_API_KEY=... node index.js
//
// TICKERMINT_API_KEY is optional: without it you get 25 lookups a day per IP.
// A key comes with a plan (7-day trial, card required):
// https://tickermint.cards/developers#plan
//
// discord.js v14, Node 18+. The slash command registers globally on startup
// (it can take a few minutes to show up the first time; set DISCORD_GUILD_ID to
// register it instantly in one server while testing).

import { Client, EmbedBuilder, Events, GatewayIntentBits, SlashCommandBuilder } from "discord.js";

const API = "https://api.tickermint.cards";
const { DISCORD_TOKEN, DISCORD_GUILD_ID, TICKERMINT_API_KEY } = process.env;
const dryRun = process.argv[2] === "--dry-run"; // node index.js --dry-run "charizard ex 199/165": print the reply, no Discord
if (!DISCORD_TOKEN && !dryRun) {
  console.error("Set DISCORD_TOKEN (Discord Developer Portal > your app > Bot > Reset Token).");
  process.exit(1);
}

// Prices change once a day: cache answers for an hour so a busy channel does not burn lookups.
const cache = new Map();
const TTL_MS = 60 * 60 * 1000;

async function tickermint(path, params = {}) {
  const url = new URL(path, API);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const hit = cache.get(url.href);
  if (hit && hit.until > Date.now()) return hit.data;

  const headers = { "User-Agent": "tickermint-examples-discord/1.0", Accept: "application/json" };
  if (TICKERMINT_API_KEY) headers["X-API-Key"] = TICKERMINT_API_KEY;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(typeof body.detail === "string" ? body.detail : `TickerMint API ${res.status}`);
    err.status = res.status;
    err.upgradeUrl = body.upgrade_url ?? null;
    err.retryAfter = Number(res.headers.get("retry-after")) || null;
    throw err;
  }
  const data = await res.json();
  cache.set(url.href, { data, until: Date.now() + TTL_MS });
  return data;
}

/** 30-day summary of the printing that has today's price. */
function summarize(history) {
  let best = null;
  for (const [printing, points] of Object.entries(history)) {
    const priced = points.filter((p) => p.market !== null).slice(-30);
    if (priced.length === 0) continue;
    if (!best || priced.at(-1).snapshot_date > best.points.at(-1).snapshot_date) best = { printing, points: priced };
  }
  if (!best) return null;
  const values = best.points.map((p) => Number(p.market));
  const first = values[0];
  const last = values.at(-1);
  return {
    printing: best.printing,
    from: best.points[0].snapshot_date,
    to: best.points.at(-1).snapshot_date,
    last,
    changePct: first ? ((last - first) / first) * 100 : 0,
    low: Math.min(...values),
    high: Math.max(...values),
  };
}

const usd = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const command = new SlashCommandBuilder()
  .setName("price")
  .setDescription("Latest TCGplayer market price and 30-day trend for a trading card")
  .addStringOption((o) => o.setName("card").setDescription('Card name and number, e.g. "charizard ex 199/165"').setRequired(true))
  .addStringOption((o) =>
    o
      .setName("game")
      .setDescription("Limit to one game")
      .addChoices(
        { name: "Pokemon", value: "pokemon" },
        { name: "One Piece", value: "one-piece" },
        { name: "Lorcana", value: "lorcana" },
        { name: "Riftbound", value: "riftbound" },
        { name: "Gundam", value: "gundam" },
        { name: "Yu-Gi-Oh", value: "yugioh" },
        { name: "Dragon Ball Super Fusion World", value: "fusion-world" },
      ),
  );

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  const target = DISCORD_GUILD_ID ? c.guilds.cache.get(DISCORD_GUILD_ID)?.commands : c.application.commands;
  await target.create(command.toJSON());
  console.log(`Ready as ${c.user.tag}; /price registered ${DISCORD_GUILD_ID ? "in guild " + DISCORD_GUILD_ID : "globally"}`);
});

/** The reply for /price: an embed, or a plain message when nothing matched. */
async function priceReply(query, game) {
  const [card] = await tickermint("/products/search", { q: query, game });
  if (!card) return `No card found for "${query}". Try the name plus collector number.`;
  const s = summarize(await tickermint(`/products/${card.product_id}/prices`));
  const link = card.tickermint_url ?? `https://tickermint.cards/card/${card.product_id}`;

  const embed = new EmbedBuilder()
    .setTitle(card.name)
    .setURL(link)
    .setDescription(`${card.set_name}${card.card_number ? ` #${card.card_number}` : ""}`)
    .addFields({ name: "Market", value: card.market ? usd(card.market) : "not priced today", inline: true });
  if (s) {
    embed.addFields(
      { name: `30 days (${s.printing})`, value: `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(1)}%`, inline: true },
      { name: "30-day range", value: `${usd(s.low)} to ${usd(s.high)}`, inline: true },
    );
  }
  if (card.image_url) embed.setThumbnail(card.image_url);
  // Attribution: a visible "Prices: TickerMint" link to the card page is required on every plan below API Platform.
  embed.addFields({ name: "\u200b", value: `Prices: [TickerMint](${link})${s ? `, as of ${s.to}` : ""}` });
  return { embeds: [embed] };
}

if (dryRun) {
  const reply = await priceReply(process.argv[3] ?? "charizard ex 199/165", process.argv[4]);
  console.log(JSON.stringify(typeof reply === "string" ? reply : reply.embeds[0].toJSON(), null, 2));
  process.exit(0);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "price") return;
  await interaction.deferReply();
  try {
    const reply = await priceReply(interaction.options.getString("card", true), interaction.options.getString("game") ?? undefined);
    await interaction.editReply(reply);
  } catch (e) {
    const fix = e.upgradeUrl ? `\n${e.upgradeUrl}` : "";
    await interaction.editReply(`Could not get a price: ${e.message}${fix}`);
  }
});

client.login(DISCORD_TOKEN);
