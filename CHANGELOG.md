# Changelog

Changes to the official `tickermint` clients (Python and JavaScript/TypeScript) and these examples.

## 0.2.0 (2026-11-01)

- `TickerMintError` exposes the API's machine-readable error fields when present: `code` (body `error`, such as `key_required` or `quota_exceeded`), `upgrade_url`, `required_plan`, `docs_url`, `pricing_url`, `quota` and the raw `body`. JavaScript also has camelCase names (`upgradeUrl`, `requiredPlan`, `docsUrl`, `pricingUrl`). Older error bodies keep working; the new fields are then `None` / `null`.
- READMEs describe the lookup-based plans (no key 100 a day, free key 1,000 a day, Developer, API Pro, API Business, API Platform) and which plan fits which use case.
- Package metadata: repository, issues and changelog links, more keywords.
- Install: `pip install https://tickermint.cards/sdk/tickermint-0.2.0-py3-none-any.whl`, `npm install https://tickermint.cards/sdk/tickermint-0.2.0.tgz`.

## 0.1.0 (2026-10)

- First release: every public endpoint, the paid bulk endpoints, attribution helpers.
