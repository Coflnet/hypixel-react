# Cypress verification

Use the Node version in `.nvmrc` and the npm version in `package.json`. Run the same production checks as GitHub Actions:

```sh
npm ci
TEST_RUNNER=true NEXT_PUBLIC_TEST_RUNNER=true npm run build
TEST_RUNNER=true NEXT_PUBLIC_TEST_RUNNER=true npm start
```

In another terminal, run `npm run cypress:verify`. It starts three fresh Cypress processes and stops at the first failure. All three full runs must pass; a later pass never erases an earlier failure. To use another server port, append `-- --config baseUrl=http://localhost:3107`.

JUnit reports and screenshots are stored separately for each run in `test-results/cypress`. The workflow uploads these as `cypress-results`, including on failure. For diagnosis, run one spec with `npm run cypress:run -- --spec cypress/e2e/terms-acceptance.cy.ts`; repeat the full verification after fixing it.

## September 2026 failure analysis

- [The latest failed build](https://github.com/Coflnet/hypixel-react/actions/runs/35403617411) rejected a spread of `ItemFilter` in recent-auctions pagination. Preserve its declared type when assigning the page; keep the production build as the TypeScript gate.
- [The recurring terms test failure](https://github.com/Coflnet/hypixel-react/actions/runs/35402161211) expected only one ownership request across two account visits. Terms are cached for an hour, while account ownership deliberately refreshes on each visit and after checkout. Assert the terms cache and its request count separately, and wait for refreshed ownership on the second visit. The same assertion failed in runs 34921921122, 34897888887 and 34776617643.
- The shared support file returned `false` for every uncaught application exception. Only its existing, specific hydration exceptions remain exempt. Tests that deliberately inject errors exempt those exact messages locally and assert the recovery behavior.
- [An older search run](https://github.com/Coflnet/hypixel-react/actions/runs/34718196392) timed out waiting for live search results and recent sales. Search navigation now uses fixed API results, waits for the matching request, and asserts the exact destination. Its year-view page also timed out at the server; public server-rendered pages still depend on upstream availability.
- [An older craft run](https://github.com/Coflnet/hypixel-react/actions/runs/33971365635) clicked a detached ingredient element after the modal updated. Query the current modal ingredient immediately before clicking instead of retaining the earlier DOM element.
- Repeated local verification exposed the same loading race in the forge popover: the lazy subcraft response replaces ingredient rows. Wait for that response and for the acquisition-plan loading state to finish before clicking. The forge test deliberately delays the response; craft selection also waits for its final acquisition plan.

Keep API and clock assertions specific to the behavior under test. Avoid global cache-size assertions or exact counts for endpoints that intentionally poll. Stub unrelated account services so tests do not send fake credentials to live endpoints. Some older auction/search/craft smoke tests still use live public data; diagnose upstream failures separately from fixture-based regression tests. Do not silence unexpected errors or automatically rewrite assertions to make a failing run pass.

## Verification on 2026-09-19

The clean install with npm 11.5.2 and production build passed on Node 26.8.1. After fixing the forge race, three consecutive full Cypress 15.19.0 runs passed against `npm start`: 19 specs and 103 tests per run, 309 passing tests total, with zero failures, retries, or skipped tests. These were local CI-equivalent runs; the updated GitHub workflow requires the same three-run check when published.
