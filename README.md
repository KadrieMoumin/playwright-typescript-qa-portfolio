# Playwright QA Portfolio

TypeScript browser tests by Kadrie Moumin, using an included local task list app.
Tasks reset when the page reloads; no external account is required.

## Setup

Install Node.js 24 LTS, open this folder in VS Code, then run:

```bash
npm ci
npx playwright install chromium
npm test
```

On Linux, use `npx playwright install --with-deps chromium` if system libraries are missing.
Watch tests: `npm run test:headed`. Interactive runner: `npm run test:ui`.
Report: `npm run report`. Manual app: `npm start`, then http://127.0.0.1:3000.
Playwright starts the server automatically for tests.

## Files

- tests/tasks.spec.ts: add, complete, delete and whitespace validation tests.
- playwright.config.ts: server, browser and failure evidence settings.
- app/: small application under test.
- .github/workflows/playwright.yml: tests on GitHub pushes and pull requests.

## Day 1: 2–3 hours

1. Install and run (20 minutes).
2. Read the first test and explain test, page, await, locators and expect (30 minutes).
3. Run headed and match browser actions to code (20 minutes).
4. Add your own test: create two tasks, complete one, assert one remains (40 minutes).
5. Deliberately break an expected count, read the error and fix it (20 minutes).
6. Explain why role/label locators and retrying assertions are useful (10 minutes).

## Next steps

Test unchecking a completed task, deleting only one of two tasks, and trimming names.
Later add cross-browser coverage, an API and network mocking.
Current scope excludes persistence, authentication, performance and accessibility audits.
Tests are isolated and use no fixed sleeps.

## GitHub

Create an empty repository and follow GitHub's instructions to push this folder.
Commit package-lock.json; exclude node_modules and generated reports.
The workflow is included but has not been run on GitHub.

Docs: https://playwright.dev/docs/intro
