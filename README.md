# RedBus Playwright Automation with Typescript

A Playwright + TypeScript test project for automating the RedBus website (`https://www.redbus.in`) as a part of the Final Assignment of Playwright Training.


## Overview

This repository contains an end-to-end test suite that:
- searches for buses
- validates search results
- applies filters and sorting
- selects seats and boarding/dropping points
- navigates to the passenger information page

The project uses a page object model to keep page interactions reusable and maintainable.

## What is included

- `playwright.config.ts` — Playwright configuration and test runtime settings
- `global-setup.ts` — setup step that opens RedBus and saves browser storage state
- `global-teardown.ts` — cleanup step that removes the saved session state
- `fixtures/test-fixtures.ts` — custom Playwright fixtures for page objects and test data
- `pages/` — page object files for the RedBus flow
- `tests/busSearch.spec.ts` — main test suite with search and booking flow scenarios
- `test-data/searchData.ts` — sample search input data used by tests

## Prerequisites

- Node.js 18+ (or compatible version)
- npm

## Installation

```bash
npm install
npx playwright install
```

## Environment

The project uses `dotenv` to load environment variables from a `.env` file at the repository root.

Supported variables:
- `BASE_URL` — optional base URL for tests (default: `https://www.redbus.in`)

Example `.env`:

```env
BASE_URL=https://www.redbus.in
```

## Run tests

### Run the full suite

```bash
npm run test
```

### Run tests with visible browser window

```bash
npm run test --headed
```

### Run Playwright Test UI

```bash
npm run test--ui
```

### Run smoke tests

```bash
npm run test--smoke
```

### Run regression tests

```bash
npm run test--regression
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
│   └── busSearch.spec.ts
└── package.json
```

## How the flow works

1. `playwright.config.ts` defines the test folder, browser configuration, reporting, and shared timeouts.
2. `global-setup.ts` runs once before the suite and saves browser storage state for reuse.
3. `tests/busSearch.spec.ts` contains the main test cases and uses fixtures from `fixtures/test-fixtures.ts`.
4. `fixtures/test-fixtures.ts` creates reusable page object instances for home, results, seat selection, and passenger info pages.
5. The page object files in `pages/` contain the actions performed on each web page.
6. `global-teardown.ts` runs after the suite and removes the saved session file.

## Page Objects

- `HomePage.ts` — enters origin/destination, selects dates, clicks search, and dismisses popups.
- `SearchResultsPage.ts` — waits for results, counts buses, applies filters, sorts by price, and selects seats.
- `SeatSelectionPage.ts` — chooses seat layout, selects a seat, selects boarding/dropping points, and proceeds.
- `PassengerInfoPage.ts` — fills passenger contact details and declines optional add-ons.

## Notes

- Tests are configured to run in Firefox using the `Desktop Firefox` device settings.
- Screenshots and videos are preserved only on failure.
- HTML test report output is stored in `playwright-report/`.
- Artifacts such as screenshots are stored in `test-results/`.
