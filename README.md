# RedBus Playwright Automation with Typescript

A Playwright + TypeScript test project for automating the RedBus website (`https://www.redbus.in`) as a part of the Final Assignment of Playwright Training.

## Overview

This repository contains an end-to-end test suite that:
- searches for buses
- validates search results
- applies filters and sorting
- selects seats and boarding/dropping points
- navigates to the passenger information page
- caches and restores browser storage states using a local MySQL database
- posts real-time test status updates and CI run triggers to Slack channels

The project uses a page object model to keep page interactions reusable and maintainable.

## What is included

- `playwright.config.ts` — Playwright configuration, test runtime settings, and custom reporters
- `global-setup.ts` — setup step that connects to the database to check/restore the browser session state or falls back to standard navigation
- `global-teardown.ts` — cleanup step that removes the locally saved session state
- `fixtures/test-fixtures.ts` — custom Playwright fixtures for page objects and test data
- `pages/` — page object files for the RedBus flow
- `utils/db.ts` — database helper module executing query pools, database setup, and CRUD states
- `utils/slackReporter.ts` — custom Playwright reporter that triggers GitHub Actions workflow dispatch runs and notifies Slack channels upon local run completion
- `tests/busSearch.spec.ts` — main test suite with search and booking flow scenarios
- `tests/dbSession.spec.ts` — integration test suite verifying MySQL connectivity and operations
- `test-data/searchData.ts` — sample search input data used by tests

## Prerequisites

- Node.js 18+ (or compatible version)
- npm
- MySQL Server (running locally on port 3306)

## Installation

```bash
npm install
npx playwright install
```

## Environment

The project uses `dotenv` to load environment variables from a `.env` file at the repository root.

Supported variables:
- `BASE_URL` — optional base URL for tests (default: `https://www.redbus.in`)
- `DB_HOST` — database host (e.g. `localhost`)
- `DB_PORT` — database port (e.g. `3306`)
- `DB_USER` — database username (e.g. `root`)
- `DB_PASSWORD` — database password
- `DB_NAME` — database name for session caching (e.g. `playwright_db`)
- `SLACK_WEBHOOK_URL` — Slack incoming webhook URL for notifications

Example `.env`:

```env
BASE_URL=https://www.redbus.in
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Root@123
DB_NAME=playwright_db
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/PATH
```

## Run tests

### Run the full suite

```bash
npm run test
```

### Run database connectivity tests

```bash
npx playwright test tests/dbSession.spec.ts
```

### Run tests with visible browser window

```bash
npm run test:headed
```

### Run Playwright Test UI

```bash
npm run test:ui
```

### Run smoke tests

```bash
npm run test:smoke
```

### Run regression tests

```bash
npm run test:regression
```

### Show HTML report

```bash
npm run report
```

## Project structure

```text
.
├── fixtures/
│   └── test-fixtures.ts
├── pages/
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── SearchResultsPage.ts
│   ├── SeatSelectionPage.ts
│   └── PassengerInfoPage.ts
├── playwright.config.ts
├── global-setup.ts
├── global-teardown.ts
├── test-data/
│   └── searchData.ts
├── tests/
│   ├── busSearch.spec.ts
│   └── dbSession.spec.ts
├── utils/
│   ├── db.ts
│   └── slackReporter.ts
└── package.json
```

## How the flow works

1. `playwright.config.ts` defines the test folder, browser configuration, reporting, custom Slack reporters, and shared timeouts.
2. `global-setup.ts` runs once before the suite and retrieves the cached session state from the MySQL database. If it exists, it is restored and browser launch is skipped; otherwise, it does the setup, saves the storage state to the DB, and saves a local copy.
3. `tests/busSearch.spec.ts` contains the main test cases and uses fixtures from `fixtures/test-fixtures.ts`.
4. `fixtures/test-fixtures.ts` creates reusable page object instances for home, results, seat selection, and passenger info pages.
5. The page object files in `pages/` contain the actions performed on each web page.
6. `global-teardown.ts` runs after the suite and removes the locally saved session file.

## Page Objects

- `HomePage.ts` — enters origin/destination, selects dates, clicks search, and dismisses popups.
- `SearchResultsPage.ts` — waits for results, counts buses, applies filters, sorts by price, and selects seats.
- `SeatSelectionPage.ts` — chooses seat layout, selects a seat, selects boarding/dropping points, and proceeds.
- `PassengerInfoPage.ts` — fills passenger contact details and declines optional add-ons.

## Slack Notifications & CI Integration

- **Local Execution**: When a local run ends, if `SLACK_WEBHOOK_URL` is set in the local `.env` file, the custom reporter (`slackReporter.ts`) runs `gh workflow run` to trigger a GitHub Actions pipeline run, retrieves the new run URL, and sends a Slack notification showing local test statistics and the live CI link.
- **GitHub Actions (CI)**: When the CI workflow executes (triggered on push, pull request, or dispatch), the workflow spins up a local MySQL service container, executes the test suite, and uploads reports. The final step sends the CI run results containing branch details and author info directly to the Slack channel, skipping duplicate reporter notifications.

