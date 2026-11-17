# Playwright QA Portfolio

TypeScript UI and API tests by Kadrie Moumin against a local task-list app.
Tasks are saved to disk and survive page reloads and server restarts. No external
account or backend is required.

## Run locally

With Node.js 24 LTS installed:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run typecheck
npm run test:server
npm test
```

On Linux, install browser dependencies with `npx playwright install --with-deps`.
Playwright starts the app automatically. For manual exploration, run `npm start`
and open http://127.0.0.1:3000. The same browser cookie retains its task workspace.

```sh
npm test -- --project=api
npm test -- --project=firefox
npm test -- tests/network.spec.ts
npm run test:headed -- --grep-invert @visual
npm run test:ui -- --grep-invert @visual
npm run report
```

`npm test` excludes Linux visual baselines so host tests work on macOS.
`npm run test:all` includes them; use Docker for the complete suite.

## Docker and CI

Start Docker Desktop:

```sh
docker compose build
docker compose run --rm tests npm run typecheck
docker compose run --rm tests npm run test:server
docker compose run --rm tests
```

The image contains browsers and Linux dependencies and installs npm packages
from package-lock.json. Keep the Docker image version and build-time version
check aligned with the locked Playwright version. Rebuild after code changes.
Docker uses Linux/amd64 to match the GitHub runner's screenshot environment;
on Apple Silicon it may run more slowly under emulation.

The server starts inside the test container. Reports and failure evidence are
saved in host playwright-report/ and test-results/. A named task-data volume
persists manual/API state across container runs; automated test fixtures remove
only their own data. The app data directory defaults to data/ on the host and
can be overridden with TASK_DATA_DIR. Runtime data is ignored by Git and Docker.

`.github/workflows/playwright.yml` builds the image, checks TypeScript, verifies
persistence over a process restart, runs the full suite, and uploads the HTML
report and available failure evidence for 14 days. It runs on pushes, pull
requests and manual dispatch, using one worker and one retry. New workflow
changes are verified remotely only after they run on GitHub.

```sh
docker compose run --rm -p 127.0.0.1:9323:9323 tests npx playwright show-report --host 0.0.0.0 --port 9323
```

Open http://127.0.0.1:9323 and stop with Ctrl+C.

## Task API

| Method | Endpoint | Contract |
| --- | --- | --- |
| GET | /api/health | 200 with server readiness |
| GET | /api/tasks | 200 with this workspace's tasks |
| POST | /api/tasks | 201 with a new task and Location header |
| GET | /api/tasks/:id | 200 with the task, or 404 |
| PATCH | /api/tasks/:id | 200; accepts only a boolean completed field |
| DELETE | /api/tasks/:id | 204, or 404 for an unknown task |
| DELETE | /api/tasks | 204; clears only the current workspace |

Tasks contain id (UUID), text (trimmed, 1..500 characters), and completed.
POST accepts text and an optional client-generated id. Repeating that ID and
text returns the original task with 200; different text returns 409. The UI
retains the same ID during Retry, including when a save succeeded but its reply
was lost. Invalid data returns 422, malformed JSON/IDs return 400, unsupported
content types return 415, bodies over 16 KiB return 413, and unsupported methods
return 405 with Allow. Requests and responses are real local HTTP calls.

Manual sessions use a SameSite=Strict HttpOnly workspace cookie. Tests provide
an x-task-workspace UUID header. These identifiers isolate teaching data; they
are not authentication or authorization. The server binds only to localhost.
The file store uses atomic replacement and serialized single-process writes;
it is not a multi-process database or production persistence architecture.

## Fixtures and page object

- pages/task-page.ts: exact accessible locators and reusable task actions.
- fixtures/task.fixture.ts: workspaceId, taskApi, createdTask and taskPage fixtures.
- Each test gets a fresh workspace UUID. Browser and API contexts use the same
  header so API setup and UI checks operate on the same isolated data.
- taskApi owns API-request disposal and workspace cleanup in finally blocks.
  taskPage depends on it so UI-created records are cleaned up too.
- createdTask prepares an API record for integration scenarios.
- Playwright owns browser page/context cleanup. Tests do not clear a global store.
- Tests keep business assertions visible. Keyboard and mobile tests keep explicit
  key and tap interactions.

```ts
import { test, expect } from '../fixtures/task.fixture';

test('shows API-prepared data', async ({ createdTask, taskPage }) => {
  await taskPage.goto();
  await expect(taskPage.taskCheckbox(createdTask.text)).not.toBeChecked();
});
```

## Coverage

The full suite contains 126 project test runs, plus one Node persistence test:

- 19 API scenarios run once in the api project, without opening a browser.
- 10 task scenarios and 4 keyboard scenarios run on three desktop browsers.
- 2 API/UI integration scenarios and 7 network-recovery scenarios run on three
  desktop browsers. They cover HTTP 500, connection failure, held responses,
  rollback after failed updates/deletes, loading recovery and a lost save reply.
- 3 whole-page axe checks run on three desktop and two emulated mobile projects.
  Full axe results are attached to the HTML report without excluded rules.
- 4 mobile scenarios per mobile project cover touch interaction and long-name
  layouts at 320, 375 and 414 CSS pixels.
- 3 visual states per browser project provide 15 image comparisons.
- The Node test creates a record, restarts an actual server process using the same
  temporary data directory, and verifies that the saved record can be retrieved.

The suite uses retrying assertions and controlled response gates instead of fixed
sleeps. Mobile projects emulate Pixel 5 and iPhone 13 settings and touch input;
they do not run on physical phones. WebKit is the supplied engine, not installed
Safari. Automated axe checks do not establish full WCAG compliance. TypeScript
checks tests, fixtures, page objects and configuration; not inline app JavaScript.
Authentication, multi-user permissions and performance testing are out of scope.

## Visual baselines

PNG baselines in tests/visual.spec.ts-snapshots/ are committed source assets.
The regular suite fails on missing or changed images; it does not update them.
For an intentional design change:

```sh
docker compose build
docker compose -f compose.yaml -f compose.visual-update.yaml run --rm tests
# Inspect every changed image and its diff before committing.
git diff --stat
docker compose build
docker compose run --rm tests
```

The update-only override mounts the baseline directory back to the host. CI
never uses this override. Use the same Docker image and architecture when
updating and comparing screenshots.

## References

- https://playwright.dev/docs/api-testing
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/network
- https://playwright.dev/docs/accessibility-testing
- https://playwright.dev/docs/test-snapshots
