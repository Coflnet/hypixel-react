# Agent Notes

- Before committing CI or dependency-related changes, run the same checks as `.github/workflows/playwright.yml`: `npm ci`, `npm run build`, and Cypress against `npm start` with `TEST_RUNNER=true` and `NEXT_PUBLIC_TEST_RUNNER=true`.
- Keep GitHub Actions on actively supported major versions. If Actions warns about deprecated Node runtimes, update the affected action versions as part of the same change.
- Do not remove or bypass the production build step in CI; it is the TypeScript gate for this Next.js app.