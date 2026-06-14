import { test as baseTest, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { PassengerInfoPage } from '../pages/PassengerInfoPage';
import { defaultSearchData, SearchData } from '../test-data/searchData';

// custom types for our pages and data
type CustomFixtures = {
  homePage: HomePage;
  resultsPage: SearchResultsPage;
  seatSelectionPage: SeatSelectionPage;
  passengerInfoPage: PassengerInfoPage;
  testData: SearchData;
};

export const test = baseTest.extend<CustomFixtures>({
  // homepage pom
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  // search results pom
  resultsPage: async ({ page }, use) => {
    const resultsPage = new SearchResultsPage(page);
    await use(resultsPage);
  },
  // seat selector pom
  seatSelectionPage: async ({ page }, use) => {
    const seatSelectionPage = new SeatSelectionPage(page);
    await use(seatSelectionPage);
  },
  // passenger info pom
  passengerInfoPage: async ({ page }, use) => {
    const passengerInfoPage = new PassengerInfoPage(page);
    await use(passengerInfoPage);
  },
  // default test search inputs
  testData: async ({ }, use) => {
    await use(defaultSearchData);
  },
});

// exporting expect from playwright
export { expect };
