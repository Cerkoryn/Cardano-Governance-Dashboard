# ChangWatch

A Cardano governance dashboard built with SvelteKit, Chart.js, and Python functions on Vercel. This branch builds on [PR #3](https://github.com/Cerkoryn/Cardano-Governance-Dashboard/pull/3), preserving the contributor's design and commit history while correcting calculations and strengthening the data pipeline.

## Development

Use Node 24 and Python 3.12 or later. `.npmrc` enforces the Node version. No private credentials are needed for the tests.

For mise users, `mise.toml` selects Node 24 for this repository. Run `mise install` once. If your shell still selects a different global Node version, use `mise exec -- npm ci` or `mise exec -- npx vercel login` to explicitly use the project environment.

```sh
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run check
npm test
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
npm run build
npx playwright install chromium
npm run test:e2e
```

The end-to-end suite starts a local Python API on port 8000 and the production build preview on port 4173, using synthetic data and the real HTTP read handlers. Activate the virtual environment first if your system Python does not have `requests`. Set `CHROMIUM_PATH` to use an existing Chromium installation. CI installs its own Chromium. Existing local servers on those ports are reused outside CI; stop a real development API before running fixture tests.

For an interactive dashboard without credentials, run `python3 tests/serve_api.py` and `npm run dev` in separate terminals. Fixture data is synthetic, not current mainnet data.

For real collectors, copy `.env.example` to a local ignored file and supply **development-only** Redis credentials and a separate `CRON_SECRET`. Export those variables before running `python3 scripts/dev_api.py`; it intentionally does not load credentials automatically. Vite proxies `/api` to port 8000. Previews require `CHANGWATCH_KEY_PREFIX` (for example, `changwatch:preview:pr4:`). Use a separate database or a restricted Redis ACL credential that can access only that prefix. Never give a preview unrestricted production credentials. Every snapshot, compatibility key, and refresh lock is prefixed; preview records expire after seven days. Production must omit the prefix. Sharing the existing database with a restricted credential avoids another resource but shares its usage quota.

`python3 scripts/check_sources.py` reads Koios and Balance Analytics, reports counts/epochs/runtime, and never connects to Redis or publishes data.

## Data flow and API

The page reads `GET /api/get_dashboard`. Two independent daily collectors publish these Redis keys:

| Collector | Versioned key | Compatibility keys |
| --- | --- | --- |
| `/api/update_spos_and_totals` | `changwatch:v1:spo` | `spo_data`, `spo_totals` |
| `/api/update_dreps_and_totals` | `changwatch:v1:governance` | `drep_data`, `drep_totals` |

Each snapshot includes its schema version, unique ID, UTC collection time, source epochs, rows, and totals. Governance also includes protocol voting thresholds and committee quorum/eligibility. Lovelace is encoded as integer strings; calculations use `BigInt`. Display percentages alone use floating point.

A collector validates all required upstream responses before publishing the snapshot and both compatibility records in one Redis `/multi-exec` transaction. Read requests use `MGET` for the two snapshots. The sources refresh independently and can have different timestamps or epochs; the UI exposes these differences. Snapshots are collection-time observations, not a claim of block-exact consistency across providers.

Refresh endpoints require `Authorization: Bearer <CRON_SECRET>`. An unconfigured secret fails closed. An owned, expiring Redis lock prevents overlapping runs for the same source. Requests have connect/read timeouts, a collection deadline, and at most one retry for transient upstream reads. Storage writes are not automatically retried. Functions have a 60-second limit; the collection budget is 40 seconds. No dRep metadata URLs are fetched.

A failed collection retains the last successfully published data. Missing or incompatible snapshots return HTTP 503. Successful reads return HTTP 200 and JSON with `Cache-Control: no-store`. The old four read endpoints retain their `{ "value": ... }` contract for rollback compatibility. Compatibility amounts retain their historical numeric representation; new code must use the versioned endpoint for exact arithmetic.

The page has a 15-second request timeout, explicit retry, schema validation, and last-successful-data retention after a failed refresh. A snapshot older than 36 hours is visibly stale; the display rechecks freshness every minute. Clicking **Refresh data** rereads published snapshots; it does not run the collectors.

## What the figures mean

- dRep thresholds come from the current Koios epoch parameters. Active, registered dReps enter the normal calculation, including zero-power representatives in participation counts. Always Abstain is excluded from the voting denominator. Always No Confidence is automatic Yes for a no-confidence motion and No for other actions; neither predefined option counts as a discretionary voter.
- **Include inactive dReps** simulates their reactivation. Observed active counts and the overall delegated-ADA indicator do not change.
- SPO coalitions use identified Balance Analytics operator groups. `SINGLEPOOL` is an aggregate of independent operators: its stake remains in the denominator, but it is never ranked or counted as one operator. This is a qualified grouping estimate, not the exact minimum across all owners. Unknown mappings count individually only in the separate operator population estimate.
- Committee calculations use authorized, unexpired members, current quorum, and the protocol minimum committee size. Members remain eligible through their expiration epoch. An insufficient committee makes required approvals unavailable.
- Estimates assume no discretionary abstentions outside the coalition. SPO defaults, ledger voting distributions, abstentions, action validity, and overlapping roles can change actual outcomes. Totals count **voting positions**, not distinct people or organizations.
- Network, economic, technical, and governance parameter groups have separate thresholds. The cards show totals with and without security-relevant changes. A proposal touching multiple groups must meet the highest applicable dRep threshold.

See the [Conway ratification implementation](https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/src/Cardano/Ledger/Conway/Rules/Ratify.hs), [parameter groups](https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/src/Cardano/Ledger/Conway/PParams.hs), and [CIP-1694](https://cips.cardano.org/cip/CIP-1694). Koios API documentation is at [koios.rest](https://api.koios.rest/).

## Deployment

See [the release checklist](docs/RELEASE.md). The static frontend goes to `build/`; Python handlers remain in `api/`, with shared code in `server/`. `vercel.json` deliberately has no catch-all rewrite over `/api`. Vercel's [existing Python API directory support](https://vercel.com/docs/functions/runtimes/python/api-directory) handles the functions.

The SvelteKit-scoped `cookie` override selects the patched 0.7.x API instead of the vulnerable 0.6.x transitive dependency. Remove the override when SvelteKit's own range is patched; do not apply the audit tool's suggested downgrade to historical SvelteKit versions.
