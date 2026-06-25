import { Given, When, Then, expect } from './fixtures';

let originalResultsCount = 0;
let filteredResultsCount = 0;

When('the user enters {string} as the departure city', async ({ homePage }, fromCity: string) => {
  console.log(`[Search] Departure: ${fromCity}`);
  await homePage.enterFromCity(fromCity);
});

When('the user enters {string} as the destination city', async ({ homePage }, toCity: string) => {
  console.log(`[Search] Destination: ${toCity}`);
  await homePage.enterToCity(toCity);
});

When('the user selects {string} as the travel date', async ({ homePage }, date: string) => {
  console.log(`[Search] Date: ${date}`);
  await homePage.selectDate(date);
});

When('the user clicks the Search buses button', async ({ homePage }) => {
  console.log('[Search] Clicking Search...');
  await homePage.clickSearch();
});

Then('the search results page should be displayed', async ({ resultsPage }) => {
  console.log('[Search] Waiting for results...');
  await resultsPage.waitForResults();
  const isOnResults = await resultsPage.isOnResultsPage();
  expect(isOnResults, 'Should be on search results page').toBe(true);
});

Then('the results count should be greater than {int}', async ({ resultsPage }, min: number) => {
  const count = await resultsPage.getResultsCount();
  originalResultsCount = count;
  expect(count, `Results should be > ${min}`).toBeGreaterThan(min);
  console.log(`[Search] Found ${count} buses.`);
});

When('the user applies the AC bus filter', async ({ resultsPage }) => {
  originalResultsCount = await resultsPage.getResultsCount();
  console.log(`[Filter] Original count: ${originalResultsCount}`);
  await resultsPage.applyAcFilter();
  console.log('[Filter] AC filter applied.');
});

Then('the filtered results count should be greater than {int}', async ({ resultsPage }, min: number) => {
  filteredResultsCount = await resultsPage.getResultsCount();
  expect(filteredResultsCount, `Filtered results should be > ${min}`).toBeGreaterThan(min);
  console.log(`[Filter] Filtered count: ${filteredResultsCount}`);
});

Then('the filtered results count should be less than or equal to the original count', async () => {
  expect(filteredResultsCount, 'Filtered <= original').toBeLessThanOrEqual(originalResultsCount);
  console.log(`[Filter] Verified: ${filteredResultsCount} <= ${originalResultsCount}`);
});

When('the user sorts results by price', async ({ resultsPage, page }) => {
  console.log('[Sort] Sorting by price...');
  await resultsPage.sortByPrice();
  await page.waitForTimeout(3000);
});

Then('the results should be sorted in ascending price order', async ({ resultsPage }) => {
  const prices = await resultsPage.getVisibleBusPrices();
  console.log(`[Sort] Prices: ${prices}`);
  if (prices.length >= 2) {
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i], `Price[${i}] should be >= Price[${i - 1}]`)
        .toBeGreaterThanOrEqual(prices[i - 1]);
    }
  }
  console.log('[Sort] Prices are sorted ascending.');
});

Given(
  'the user has searched for buses from {string} to {string} on {string}',
  async ({ homePage }, from: string, to: string, date: string) => {
    console.log(`[Search] ${from} → ${to} on ${date}`);
    await homePage.enterFromCity(from);
    await homePage.enterToCity(to);
    await homePage.selectDate(date);
    await homePage.clickSearch();
  }
);

Given('the search results are displayed', async ({ resultsPage }) => {
  await resultsPage.waitForResults();
  const count = await resultsPage.getResultsCount();
  expect(count).toBeGreaterThan(0);
  console.log(`[Search] Results loaded: ${count} buses.`);
});