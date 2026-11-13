# Playwright QA Portfolio

TypeScript browser tests by Kadrie Moumin against an included local task-list app.
Tasks reset on reload; no account or external backend is required.

## Run locally

With Node.js 24 LTS installed:

```sh
npm ci
npx playwright install chromium firefox webkit
npm test
```

On Linux use `npx playwright install --with-deps chromium firefox webkit`.
Playwright starts the app automatically for tests. For manual exploration run
`npm start` and open http://127.0.0.1:3000.

```sh
npm run test:headed
npm run test:ui
npm run report
npm run typecheck
npm test -- --project=firefox
npm test -- --grep "reopening"
```

## Test coverage

Ten isolated functional scenarios cover adding, completing, deleting, whitespace-only
input, independent task completion, reopening completed tasks, deleting an exact
match among similar names, trimming names, native empty-input validation, and the
documented reset on reload. Four additional keyboard scenarios cover Enter submission,
Tab focus order, Space toggling, and keyboard deletion. All 14 scenarios run in
Chromium, Firefox, and WebKit (42 test runs). Tests use accessible locators and retrying assertions
without fixed sleeps. Browser isolation does not imply backend-data isolation;
this app stores tasks only in its page DOM.

## Docker

Start Docker Desktop, then run:

```sh
docker compose build
docker compose run --rm tests
```

The image includes browsers and Linux dependencies. npm packages are installed
from the lockfile. The Playwright image version and build-time version check must
match the locked version; update both when upgrading. Rebuild after code changes.
The app starts inside the test container automatically; no app port is published.
Reports and test results persist in host folders through Compose volumes.

```sh
# Run one test
docker compose run --rm tests npm test -- --grep "reopening"
# View the report
docker compose run --rm -p 127.0.0.1:9323:9323 tests npx playwright show-report --host 0.0.0.0 --port 9323
```

Open http://127.0.0.1:9323 and stop with Ctrl+C. Headed and UI modes use the
local installation; the Docker workflow runs headlessly.

## GitHub Actions

`.github/workflows/playwright.yml` builds the Docker image, checks TypeScript, and runs the same suite
on pushes, pull requests, and manual dispatch. It uploads the HTML report and
available failure evidence for 14 days, including when tests fail. CI uses one
worker and one retry. Remote execution is confirmed only after the workflow runs
in GitHub; adding the workflow locally does not trigger it.

## Files

- `app/`: local task-list app and Node HTTP server.
- `tests/tasks.spec.ts`: browser scenarios.
- `tests/keyboard.spec.ts`: keyboard interaction scenarios.
- `playwright.config.ts`: server, three browser projects, retries and failure evidence.
- `tsconfig.json`: strict TypeScript checking for configuration and tests.
- `Dockerfile`, `compose.yaml`, `.dockerignore`: container setup.
- `.github/workflows/playwright.yml`: continuous integration.

## Scope and references

No persistence, authentication, performance testing, or accessibility audit is
implemented. The tests exercise the local app's documented behavior.

- https://playwright.dev/docs/intro
- https://playwright.dev/docs/ci
- https://playwright.dev/docs/docker

Type checking covers TypeScript tests and configuration; it does not check the app's inline JavaScript. WebKit tests the supplied browser engine, not installed Safari.
