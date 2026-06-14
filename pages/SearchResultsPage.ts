import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// results page where buses show up
export class SearchResultsPage extends BasePage {
  // locator fields
  readonly resultsContainer: Locator;
  readonly busCards: Locator;
  // filters and sorting
  readonly sortSection: Locator;
  readonly filterSidebar: Locator;
  readonly acBusFilter: Locator;
  constructor(page: Page) {
    super(page);
    // get the main text showing number of buses
    this.resultsContainer = page.getByText(/buses found/i).nth(1);
    // buttons for each bus block
    this.busCards = page.getByRole('button', { name: /Show buses/i });
    this.sortSection = page.getByText('Sort by:');
    this.filterSidebar = page.getByText('Filter buses');
    // ac checkbox in filter
    this.acBusFilter = page.getByText(/^AC\s*\(\d+\)/i);
  }

  // wait for results screen
  async waitForResults() {
    // wait for the count to show
    await this.resultsContainer.waitFor({ state: 'visible', timeout: 20000 });
  }

  // count how many buses we found
  async getResultsCount(): Promise<number> {
    // extract number from text
    const text = await this.resultsContainer.textContent() ?? '';
    const match = text.match(/(\d+)\s*buses?\s*found/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    // fallback to card count if needed
    await this.busCards.first().waitFor({ state: 'visible', timeout: 15000 });
    return await this.busCards.count();
  }

  // get details for first bus card
  async getFirstBusDetails(): Promise<{ name: string; departureTime: string; price: string }> {
    // wait for first card to load
    await this.busCards.first().waitFor({ state: 'visible', timeout: 10000 });

    let name = '';
    let price = '';
    let departureTime = '';

    try {
      // try to find the operator name
      const operatorText = await this.page.getByText(/^[A-Z][A-Za-z\s&]+$/).first().textContent();
      name = operatorText?.trim() ?? '';
    } catch { }

    try {
      // parse price text
      const priceEl = await this.page.getByText(/₹\d+/).first().textContent();
      const priceMatch = priceEl?.match(/₹[\d,]+/);
      price = priceMatch ? priceMatch[0] : (priceEl?.trim() ?? '');
    } catch { }

    try {
      // get starting price info
      const busInfoText = await this.page.getByText(/\d+\s*buses?\s*starting/).first().textContent({ timeout: 3000 });
      departureTime = busInfoText?.trim() ?? '';
    } catch { }

    // last try for count text
    if (!departureTime) {
      try {
        const altText = await this.page.getByText(/^\d+\s*buses?\b/).first().textContent({ timeout: 3000 });
        departureTime = altText?.trim() ?? '';
      } catch { }
    }

    return { name, departureTime, price };
  }

  // click AC filter
  async applyAcFilter() {
    await this.acBusFilter.scrollIntoViewIfNeeded();
    await this.acBusFilter.click();
    await this.page.waitForTimeout(2000);
  }

  // sort list by cheapest price
  async sortByPrice() {
    const priceSort = this.page.getByRole('radio', { name: 'Price' });
    await priceSort.scrollIntoViewIfNeeded();
    await priceSort.click();
    // wait for page to reload sorted list
    await this.page.waitForTimeout(2500);
  }

  // list all prices currently on screen
  async getVisibleBusPrices(): Promise<number[]> {
    // match bus operator group summary elements
    const groupElements = this.page.getByText(/\d+\s*buses?\s*starting/i);
    const groupTexts = await groupElements.allTextContents();

    const prices: number[] = [];
    for (const text of groupTexts) {
      const match = text.match(/₹([\d,]+)/);
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''), 10);
        if (!isNaN(value)) prices.push(value);
      }
    }
    // uniq the price array
    return [...new Set(prices)];
  }

  // helper to check if results are loaded
  async isOnResultsPage(): Promise<boolean> {
    const url = this.page.url();
    const hasResultsInUrl = url.includes('/bus-tickets/');
    const containerVisible = await this.resultsContainer.isVisible().catch(() => false);
    return hasResultsInUrl || containerVisible;
  }

  // get title
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  // expand the first bus card
  async selectFirstOperator() {
    await this.busCards.first().scrollIntoViewIfNeeded();
    await this.busCards.first().click();
    await this.page.waitForTimeout(3000);
  }

  // click view seats on the first bus
  async selectFirstBus() {
    const viewSeatsBtn = this.page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.scrollIntoViewIfNeeded();
    await viewSeatsBtn.click();
    await this.page.waitForTimeout(3000);
  }

  // get details for the first expanded bus
  async getFirstIndividualBusDetails(): Promise<{
    busName: string;
    busType: string;
    departure: string;
    arrival: string;
    duration: string;
    seats: string;
    price: string;
    rating: string;
  }> {
    // wait for layout to show
    const viewSeatsBtn = this.page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.waitFor({ state: 'visible', timeout: 10000 });

    let busName = '', busType = '', departure = '', arrival = '', duration = '';
    let seats = '', price = '', rating = '';

    try {
      // get name
      const nameEl = await this.page.getByText(/^[A-Z]+ - \w+/).first().textContent({ timeout: 3000 });
      busName = nameEl?.trim() ?? '';
    } catch { }

    try {
      // get type
      const typeEl = await this.page.getByText(/(?:Sleeper|Seater|AC|Non AC).*\(\d\+\d\)/).first().textContent({ timeout: 3000 });
      busType = typeEl?.trim() ?? '';
    } catch { }

    try {
      // get departure time
      const depEl = await this.page.getByText(/^\d{2}:\d{2}$/).first().textContent({ timeout: 3000 });
      departure = depEl?.trim() ?? '';
    } catch { }

    try {
      // get duration
      const durEl = await this.page.getByText(/\d+h\s*\d+m/).first().textContent({ timeout: 3000 });
      duration = durEl?.trim() ?? '';
    } catch { }

    try {
      // get seats left
      const seatsEl = await this.page.getByText(/\d+\s*Seats?\s*\(/).first().textContent({ timeout: 3000 });
      seats = seatsEl?.trim() ?? '';
    } catch { }

    try {
      // get price
      const priceEl = await this.page.getByText(/₹\d+/).first().textContent({ timeout: 3000 });
      price = priceEl?.match(/₹[\d,]+/)?.[0] ?? (priceEl?.trim() ?? '');
    } catch { }

    try {
      // get ratings
      const ratingEl = await this.page.getByText(/^\d\.\d$/).first().textContent({ timeout: 3000 });
      rating = ratingEl?.trim() ?? '';
    } catch { }

    return { busName, busType, departure, arrival, duration, seats, price, rating };
  }
}