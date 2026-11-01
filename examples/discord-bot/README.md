# Discord price bot

`/price card:<name> [game]` replies with the card's latest TCGplayer market price, its 30-day change and range, and the required "Prices: TickerMint" link. discord.js v14, Node 18+, one file.

## Run it

1. Create an application at https://discord.com/developers/applications, open **Bot**, click **Reset Token** and copy it.
2. Invite the bot: **OAuth2 > URL Generator**, scopes `bot` and `applications.commands`, permission **Send Messages**; open the URL and pick your server.
3. Start it:

```sh
npm install
DISCORD_TOKEN=... TICKERMINT_API_KEY=... npm start
# while testing, DISCORD_GUILD_ID=<server id> registers /price instantly in that server
```

`TICKERMINT_API_KEY` is optional: without it the bot uses the keyless trial (100 lookups a day for your server's IP, 30 days of history). A free key (email only, https://tickermint.cards/developers#keys) gives 1,000 a day. Each `/price` costs about 2 lookups; answers are cached for an hour.

Try the reply without Discord:

```sh
node index.js --dry-run "umbreon vmax 215/203" pokemon
```

Live output on 2026-10-31: Market $2,209.75, 30 days (Holofoil) -3.6%, range $2,209.75 to $2,351.42, "Prices: TickerMint" linked to https://tickermint.cards/card/246723/umbreon-vmax-alternate-art-secret-215.

## Plans

- A bot for your own server or friends, no money involved: free key.
- A bot you sell, put behind a paid tier, or run for a store or a paid community: API Pro ($49/mo) or above. See [Which plan do I need?](../../README.md#which-plan-do-i-need).
