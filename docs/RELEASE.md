# Preview and production release

Implementation branch: `fix/changwatch-relaunch`, based on contributor PR #3 head `e42551a240e4c4af1b73a47aad7aca29a8ece63b`. Production is a separate approval step. No production settings, credentials, Redis records, or deployment were changed during implementation.

## Access gate

The intended project is `mav-dashboard` (`prj_QQv4AMOvVXCEhsmLrZP9rB28CWcn`) in `cerkoryns-projects` (`team_Ud1KX1AhUZjOWuZRatAsE8HY`). On September 13, 2026, the authenticated Vercel tools could see the team but returned no projects; requesting this project returned 404. Private deployment settings, logs, environment scopes, and Redis connectivity therefore remain unverified. Repeating OAuth setup has not resolved this. Confirm the project exists under that team and that the connected identity/integration is granted project access, or complete the dashboard checks below directly in Vercel.

The PR also has a Vercel contributor-authorization gate. Review/authorize the contributor deployment or create a maintainer-owned branch for the preview. Do not disable deployment protection globally.

## Isolated preview

1. Review this branch and pass CI. Keep the contributor commits intact; merging this branch integrates those commits and the follow-up fixes together.
2. In Vercel, verify the repository, root directory, Node 24 runtime, static output `build`, and build command `npm run build`. The repository sets `framework: null` to build the static frontend alongside Python functions. Verify all seven API functions appear in the deployment output and include `server/`.
3. Set **Preview** `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and `CRON_SECRET` to an isolated Redis database and preview-only secret. Check the effective environment, including inherited integration variables. A key prefix alone is insufficient isolation because compatibility keys are shared with older code. Keep credentials out of `PUBLIC_` variables, source files, and browser bundles.
4. Deploy a preview. Before seeding, `/api/get_dashboard` should return JSON with HTTP 503, and the page should offer Retry. An unauthorized refresh request must return 403.
5. Invoke both preview refresh functions once with the preview cron secret in the Authorization header. Use the deployment's protection mechanism as well if enabled. Vercel cron schedules run on production deployments, so previews require this manual seed. Confirm `refresh_succeeded` logs, reasonable duration, and one new snapshot ID for each source.
6. Verify `/api/get_dashboard` returns HTTP 200, both timestamps/source epochs, integer-string amounts, current thresholds and committee values. Verify the four old `/api/get_*` endpoints return HTTP 200 and `{ "value": ... }`. Check Content-Type and status, not just whether a JSON body exists.
7. Check desktop/mobile and both themes: all ten action cards, dRep/SPO/CC labels, security totals, the inactive scenario, retry, stale indicators, chart table, and no browser errors. Compare current source data with the methodology rather than hardcoded actor counts.
8. In the isolated environment, test an unavailable upstream/storage response: the collector must report failure without replacing its prior snapshot, and the UI must show either retained data with its actual timestamp or an explicit unavailable state. Restore preview configuration and confirm recovery.

A local fixture test cannot prove Vercel route precedence, packaged Python imports, project overrides, or real Redis permissions. These preview checks are mandatory before a production release.

## Production approval and monitoring

Before approval, record the tested preview URL/commit, all check results, the current production deployment ID, current cron configuration, and environment scopes. Confirm `changwatch.com` targets this project. Production should use its own Redis database and a nonempty `CRON_SECRET`.

Once approved, merge/promote the tested revision, then seed both production collectors with authenticated requests. The new versioned endpoint remains unavailable until both snapshots exist; plan for that short initialization window. If uninterrupted launch is required, first use a reviewed production collector deployment to seed snapshots while retaining the old frontend, then promote the tested frontend. Do not point a general-purpose preview at production Redis to avoid this window.

Check the live root, static assets, all five read APIs, source timestamps, and both refresh logs. The two daily cron schedules remain `0 0 * * *`; on Hobby the invocation can occur within the scheduled hour, and failed cron runs are not automatically retried. See [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs). Verify both scheduled jobs complete on the following day. Treat a snapshot age over 36 hours or repeated `refresh_failed` events as an incident; investigate logs, source availability, deadline exhaustion, and Redis permissions before manually retrying.

## Rollback

Rollback the frontend/deployment to the recorded known-good production deployment if acceptance checks fail. New collectors retain the old API contracts and keys. The original implementation's unsafe metadata fetching and HTTP-status defect still exist in older deployments, so a full rollback restores those limitations; a reviewed frontend-only rollback with hardened collectors is preferable if available.

Vercel rollback does not restore cron configuration automatically. Explicitly verify the intended two cron paths/schedules after rollback, confirm which collector code will execute, and check source freshness again. Do not delete the versioned keys or migrate production data destructively during rollback. See [Vercel instant rollback](https://vercel.com/docs/instant-rollback).

## Validation recorded during implementation

- Live read-only collectors completed for epoch 655: 161 SPO groups in roughly 8 seconds; 1,056 governance rows in roughly 15 seconds. Counts include pseudo options in rows but exclude them from real dRep totals. These are observations from September 13, 2026, not fixed expected production values.
- Local verification passed: 25 calculation/schema tests, 21 Python collector/storage/HTTP tests, and 20 desktop/mobile browser tests against the production build. Svelte check reported zero errors/warnings, the static build passed, and npm audit reported zero vulnerabilities. Automated accessibility scans found zero violations in light and dark themes; canvas/SVG contrast still received manual-review flags, so this is not a claim of complete accessibility conformance. Tested locally with Node 24.21.0, Python 3.14, and system Chromium; CI targets Python 3.12 and Playwright Chromium. The GitHub-hosted CI job has been added but has not run remotely.
- Browser tests replace Redis with synthetic fixtures; collector smoke checks use public upstream APIs without publishing. Real Redis transaction behavior and Vercel routing still require the isolated preview checks above.
