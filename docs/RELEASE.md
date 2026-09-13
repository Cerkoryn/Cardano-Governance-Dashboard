# Preview and production release

Implementation branch: `fix/changwatch-relaunch`, based on contributor PR #3 head `e42551a240e4c4af1b73a47aad7aca29a8ece63b`. Production is a separate approval step. No production settings, credentials, Redis records, or deployment were changed during implementation.

## Access and preview configuration

The project is `mav-dashboard` (`prj_QQv4AMOvVXCEhsmLrZP9rB28CWcn`) in `cerkoryns-projects` (`team_Ud1KX1AhUZjOWuZRatAsE8HY`). Vercel CLI access works after browser login with Node 24. Use `mise exec -- npx vercel@59.16.0` in this checkout. The connected app still lacks project visibility; CLI access is sufficient.

Draft [PR #4](https://github.com/Cerkoryn/Cardano-Governance-Dashboard/pull/4) preserves all contributor commits and adds the fixes. Its maintainer-owned branch can deploy previews. Deployment protection remains enabled; use the owner's Vercel login to open it, or `vercel curl` for authenticated CLI checks.

This preview uses the existing Redis database with ACL user `changwatch_preview_pr4`, restricted to `changwatch:preview:pr4:*` and the required read/write/transaction/lock commands. It cannot read or write production keys. No new resource or paid plan is needed; preview requests share the existing database's quota. Preview snapshots and compatibility records expire after seven days. Manual refresh is needed after expiry, and the UI marks data stale after 36 hours.

The branch-specific Preview variables override the REST token, cron secret, and key prefix. Unused inherited `KV_URL` and read-only token variables are blanked for this branch. Production variables retain their original values. Other preview branches need their own isolated configuration before collectors can run.

## Isolated preview

1. Review this branch and pass CI. Keep the contributor commits intact; merging this branch integrates those commits and the follow-up fixes together.
2. In Vercel, verify the repository, root directory, Node 24 runtime, static output `build`, and build command `npm run build`. The repository sets `framework: null` to build the static frontend alongside Python functions. Verify all seven API functions appear in the deployment output and include `server/`.
3. Set branch-specific **Preview** `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `CHANGWATCH_KEY_PREFIX`, and a preview-only `CRON_SECRET`. Use either a separate Redis database or an ACL credential restricted to the configured prefix. Check the effective environment, including inherited integration variables. The application prefixes all keys, including compatibility keys and locks, and refuses Vercel preview access without a prefix. A prefix with an unrestricted credential is insufficient isolation. Keep credentials out of `PUBLIC_` variables, source files, and browser bundles.
4. Deploy a preview. Before seeding, `/api/get_dashboard` should return JSON with HTTP 503, and the page should offer Retry. An unauthorized refresh request must return 403.
5. Invoke both preview refresh functions once with the preview cron secret in the Authorization header. Use the deployment's protection mechanism as well if enabled. Vercel cron schedules run on production deployments, so previews require this manual seed. Confirm `refresh_succeeded` logs, reasonable duration, and one new snapshot ID for each source.
6. Verify `/api/get_dashboard` returns HTTP 200, both timestamps/source epochs, integer-string amounts, current thresholds and committee values. Verify the four old `/api/get_*` endpoints return HTTP 200 and `{ "value": ... }`. Check Content-Type and status, not just whether a JSON body exists.
7. Check desktop/mobile and both themes: all ten action cards, dRep/SPO/CC labels, security totals, the inactive scenario, retry, stale indicators, chart table, and no browser errors. Compare current source data with the methodology rather than hardcoded actor counts.
8. In the isolated environment, test an unavailable upstream/storage response: the collector must report failure without replacing its prior snapshot, and the UI must show either retained data with its actual timestamp or an explicit unavailable state. Restore preview configuration and confirm recovery.

A local fixture test cannot prove Vercel route precedence, packaged Python imports, project overrides, or real Redis permissions. These preview checks are mandatory before a production release.

## Production approval and monitoring

Before approval, record the tested preview URL/commit, all check results, the current production deployment ID, current cron configuration, and environment scopes. Confirm `changwatch.com` targets this project. Production should retain its existing Redis credentials and a nonempty `CRON_SECRET`, with `CHANGWATCH_KEY_PREFIX` absent.

Once approved, merge the tested revision into `main` to create a production build using Production environment variables, then seed both production collectors with authenticated requests. Do not promote this isolated preview artifact directly: it contains preview credentials and configuration. The new versioned endpoint remains unavailable until both snapshots exist; plan for that short initialization window. If uninterrupted launch is required, first use a reviewed production collector deployment to seed snapshots while retaining the old frontend, then promote the tested frontend. Do not point a general-purpose preview at production Redis to avoid this window.

Check the live root, static assets, all five read APIs, source timestamps, and both refresh logs. The two daily cron schedules remain `0 0 * * *`; on Hobby the invocation can occur within the scheduled hour, and failed cron runs are not automatically retried. See [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs). Verify both scheduled jobs complete on the following day. Treat a snapshot age over 36 hours or repeated `refresh_failed` events as an incident; investigate logs, source availability, deadline exhaustion, and Redis permissions before manually retrying.

## Rollback

Rollback the frontend/deployment to the recorded known-good production deployment if acceptance checks fail. New collectors retain the old API contracts and keys. The original implementation's unsafe metadata fetching and HTTP-status defect still exist in older deployments, so a full rollback restores those limitations; a reviewed frontend-only rollback with hardened collectors is preferable if available.

Vercel rollback does not restore cron configuration automatically. Explicitly verify the intended two cron paths/schedules after rollback, confirm which collector code will execute, and check source freshness again. Do not delete the versioned keys or migrate production data destructively during rollback. See [Vercel instant rollback](https://vercel.com/docs/instant-rollback).

## Validation recorded during implementation

- Live read-only collectors completed for epoch 655: 161 SPO groups in roughly 8 seconds; 1,056 governance rows in roughly 15 seconds. Counts include pseudo options in rows but exclude them from real dRep totals. These are observations from September 13, 2026, not fixed expected production values.
- Local verification passed: 25 calculation/schema tests, 23 Python collector/storage/HTTP tests, and 20 desktop/mobile browser tests against the production build. Svelte check reported zero errors/warnings, the static build passed, and npm audit reported zero vulnerabilities. Automated accessibility scans found zero violations in light and dark themes; canvas/SVG contrast still received manual-review flags, so this is not a claim of complete accessibility conformance. Tested locally with Node 24.21.0, Python 3.14, and system Chromium; CI targets Python 3.12 and Playwright Chromium. GitHub-hosted CI passed for the initial fix commit with Python 3.12 and Playwright Chromium; the namespace follow-up will run the same checks.
- Browser tests replace Redis with synthetic fixtures; collector smoke checks use public upstream APIs without publishing. Real Redis transaction behavior and Vercel routing still require the isolated preview checks above.
