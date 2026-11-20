# Agent Notes

- Before committing CI or dependency-related changes, run the same checks as `.github/workflows/playwright.yml`: `npm ci`, `npm run build`, and Cypress against `npm start` with `TEST_RUNNER=true` and `NEXT_PUBLIC_TEST_RUNNER=true`.
- Keep GitHub Actions on actively supported major versions. If Actions warns about deprecated Node runtimes, update the affected action versions as part of the same change.
- Do not remove or bypass the production build step in CI; it is the TypeScript gate for this Next.js app.
- To run Cypress against a production build locally without clobbering a running `npm run dev`, use `scripts/cypress-prod.sh [--build-only] [cypress args]`: it builds into `.next-cypress` (via `NEXT_DIST_DIR`) and serves on port 3100 (`CYPRESS_PORT`). It reuses an existing build, so pass `REBUILD=1` after changing app code. Never run `next build` into `.next` while a dev server is up. Documentation screenshots in `account-active-subscription.cy.ts` are only taken with `--env screenshots=true`.
