This is the current frontend for https://sky.coflnet.com.
You can contribute by opening pull requests.
Cluster CI builds the production image after pushes.

This project uses Next.js (https://github.com/vercel/next.js).

## Available Scripts

Development and production builds support Node.js 26. Use npm 11, matching the
version pinned in `package.json`, to keep clean installs deterministic.

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### Cypress tests

Use the production server, as `.github/workflows/playwright.yml` does:

```sh
npm ci
TEST_RUNNER=true NEXT_PUBLIC_TEST_RUNNER=true npm run build
TEST_RUNNER=true NEXT_PUBLIC_TEST_RUNNER=true npm start
```

In another terminal, run `npm run cypress:verify`. This is the CI command: three
consecutive headless Electron runs, with retries disabled and failure stopping
the run. For a focused replay, append
`-- --spec cypress/e2e/account-active-subscription.cy.ts,cypress/e2e/forge.cy.ts`.
JUnit reports and screenshots are written under `test-results/cypress`.

CI uses Ubuntu 24.04, the Node major in `.nvmrc`, the npm version in
`package.json`, and dependencies from `npm ci`. Local checks should use the same
versions. Cypress defaults remain test isolation enabled, a 1000×660 viewport,
and sequential specs; neither the workflow nor the verification script enables
parallel runners. Machine capacity and load can still differ, so synchronize
on requests, listener registration, and completed dialog transitions.
Record exact Node and npm versions with verification results, and report external
workstation runs separately from DevServer and GitHub CI. Matching the Node major
and Cypress version alone does not establish environment parity.

The default base URL is `http://localhost:3000`. Also replay focused network
fixtures with `CYPRESS_baseUrl=http://127.0.0.1:3000`: `properties.js` selects
remote command URLs on localhost and relative command URLs on 127.0.0.1.
Fixtures must cover both, including background requests triggered by fake clocks.
`npm run build` and `npm start` automatically select fixed server-side SkyApi
fixtures when `TEST_RUNNER=true`. This also runs the fixture guard check before
the test build. Normal production Docker builds do not set `TEST_RUNNER` or reuse
test build artifacts.
For SSR-hydrated queries, wait for the intercepted browser response before
asserting fixture data; a browser intercept cannot replace a server-side fetch.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run start`

Runs the app in the production mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
