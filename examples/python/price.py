#!/usr/bin/env python3
"""Look up a trading card's latest market price and 30-day change with the TickerMint API.

Usage:
    python price.py "charizard ex 199/165"
    python price.py "luffy op01-120" --game one-piece

Standard library only. Set TICKERMINT_API_KEY for your own quota; without it
you get 25 lookups a day per IP. A key comes with a plan (7-day trial, card
required): https://tickermint.cards/developers#plan
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal

API = "https://api.tickermint.cards"
# Python's default urllib User-Agent is refused by the API's firewall: always name your client.
USER_AGENT = "tickermint-examples-python/1.0"


class TickerMintError(Exception):
    def __init__(self, status: int, body: dict) -> None:
        detail = body.get("detail")
        super().__init__(f"TickerMint API {status}: {detail if isinstance(detail, str) else body}")
        self.status = status
        self.code = body.get("error")
        self.upgrade_url = body.get("upgrade_url")
        self.required_plan = body.get("required_plan")


def get(path: str, **params: str) -> object:
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v})
    url = f"{API}{path}" + (f"?{query}" if query else "")
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    key = os.environ.get("TICKERMINT_API_KEY")
    if key:
        headers["X-API-Key"] = key
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read() or b"{}")
        except ValueError:
            body = {}
        raise TickerMintError(e.code, body if isinstance(body, dict) else {}) from None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("query", help='card name, e.g. "charizard ex 199/165"')
    ap.add_argument(
        "--game", help="pokemon, one-piece, lorcana, riftbound, gundam, yugioh or fusion-world (default: all)"
    )
    args = ap.parse_args()

    try:
        results = get("/products/search", q=args.query, game=args.game)
        if not results:
            print(f"No card found for {args.query!r}")
            return 1
        card = results[0]
        history = get(f"/products/{card['product_id']}/prices")
    except TickerMintError as e:
        print(e, file=sys.stderr)
        if e.upgrade_url:
            print(f"Fix: {e.upgrade_url}", file=sys.stderr)
        return 2

    print(f"{card['name']} ({card['set_name']}, {card['game']})")
    print(f"Market price: ${card['market']}" if card["market"] else "Market price: not priced today")

    # history is {"Holofoil": [{"snapshot_date", "low", "market"}, ...], ...} oldest first
    for printing, points in history.items():
        priced = [p for p in points if p["market"] is not None][-30:]
        if len(priced) >= 2:
            first, last = Decimal(priced[0]["market"]), Decimal(priced[-1]["market"])
            change = (last - first) / first * 100 if first else Decimal(0)
            print(
                f"  {printing}: ${last} on {priced[-1]['snapshot_date']}, "
                f"{change:+.1f}% since {priced[0]['snapshot_date']}"
            )

    # Attribution: required on every plan below API Platform.
    link = card.get("tickermint_url") or f"https://tickermint.cards/card/{card['product_id']}"
    print(f"Prices: TickerMint {link}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
