# Changelog

Changes to the official `tickermint` clients (Python and JavaScript/TypeScript) and these examples.

## Docs update (2026-11-10)

- Plans changed. Free keys are no longer issued, and existing ones end on 2026-11-24 at 15:00 UTC.
- Without a key: 25 card lookups a day per IP and 30 days of history, for personal use, to try the API.
- A key comes with a plan. Every plan starts with a 7-day trial (card required, cancel online anytime) at https://tickermint.cards/developers#plan. Trials are capped at 5,000 lookups and have no bulk history until the first payment.
- Developer is $19/mo with 50,000 lookups a month. Commercial use needs API Pro ($49/mo) or above.
- Plan tables in README.md, AGENTS.md and the skill are rewritten from `GET https://api.tickermint.cards/meta`.
- Dragon Ball Super Fusion World (`fusion-world`) added to the game lists. Catalog size is about 102,000 products.
- New README section "Moving from pokemontcg.io" with an endpoint mapping.
- Graded prices (paid add-on on API Pro and above) and the MCP limit (300 tool calls a day) are documented.
- `/desk/movers` covers 1 to 90 days. Errors document `how_to_fix`, `trial_limit` and the `X-Quota-Period` header.
- Install links point to the 0.2.1 clients listed in the site docs.

## 0.2.0 (2026-11-01)

- `TickerMintError` exposes the API's machine-readable error fields when present: `code` (body `error`, such as `key_required` or `quota_exceeded`), `upgrade_url`, `required_plan`, `docs_url`, `pricing_url`, `quota` and the raw `body`. JavaScript also has camelCase names (`upgradeUrl`, `requiredPlan`, `docsUrl`, `pricingUrl`). Older error bodies keep working; the new fields are then `None` / `null`.
- READMEs describe the lookup-based plans (no key 100 a day, free key 1,000 a day, Developer, API Pro, API Business, API Platform) and which plan fits which use case.
- Package metadata: repository, issues and changelog links, more keywords.
- Install: `pip install https://tickermint.cards/sdk/tickermint-0.2.0-py3-none-any.whl`, `npm install https://tickermint.cards/sdk/tickermint-0.2.0.tgz`.

## 0.1.0 (2026-10)

- First release: every public endpoint, the paid bulk endpoints, attribution helpers.
