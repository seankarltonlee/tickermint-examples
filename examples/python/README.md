# Python example

`price.py` searches a card by name and prints its latest TCGplayer market price, the 30-day change per printing and the required attribution link. Python 3.9+, standard library only (no `pip install`).

```sh
python price.py "charizard ex 199/165"
python price.py "elsa spirit of winter" --game lorcana
TICKERMINT_API_KEY=... python price.py "umbreon vmax 215/203"   # your own quota
```

Live output (2026-10-31 prices, no key):

```
Charizard ex - 199/165 (SV: Scarlet & Violet 151, pokemon)
Market price: $300.29
  Holofoil: $300.29 on 2026-10-31, -13.0% since 2026-10-02
Prices: TickerMint https://tickermint.cards/card/517045/charizard-ex-199
Elsa - Spirit of Winter (Enchanted) (The First Chapter, lorcana)
Market price: $952.84
  Holofoil: $952.84 on 2026-10-31, +0.2% since 2026-10-02
Prices: TickerMint https://tickermint.cards/card/510153/elsa-spirit-of-winter-enchanted-207
```

Notes:

- Without a key you get 25 lookups a day per IP (each run costs 2). A key comes with a plan, and every plan starts with a 7-day trial (card required): https://tickermint.cards/developers#plan.
- Always send a `User-Agent`: the API's firewall blocks urllib's default one (403).
- Prices are decimal strings; the script uses `Decimal`.
- Errors print `detail` and the `upgrade_url` the API returns on 401/402/403/429.

For more than a script, use the typed client: `pip install https://tickermint.cards/sdk/tickermint-0.2.1-py3-none-any.whl` ([docs](https://tickermint.cards/developers/python)).
