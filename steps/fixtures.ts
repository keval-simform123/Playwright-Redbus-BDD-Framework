import { test as base, createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { PassengerInfoPage } from '../pages/PassengerInfoPage';

export type BddFixtures = {
  homePage: HomePage;
  resultsPage: SearchResultsPage;
  seatSelectionPage: SeatSelectionPage;
  passengerInfoPage: PassengerInfoPage;
};

export const test = base.extend<BddFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  resultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  seatSelectionPage: async ({ page }, use) => {
    await use(new SeatSelectionPage(page));
  },
  passengerInfoPage: async ({ page }, use) => {
    await use(new PassengerInfoPage(page));
  },
});

export const { Given, When, Then } = createBdd(test);
export { expect };
