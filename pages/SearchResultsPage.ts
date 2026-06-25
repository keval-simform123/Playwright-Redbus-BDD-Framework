import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SearchResultsPage extends BasePage {
  readonly resultsContainer: Locator;
  readonly busCards: Locator;
  readonly sortSection: Locator;
  readonly filterSidebar: Locator;
  readonly acBusFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.resultsContainer = page.getByText(/buses found/i).nth(1);
    this.busCards = page.getByRole('button', { name: /Show buses/i });
    this.sortSection = page.getByText('Sort by:');
    this.filterSidebar = page.getByText('Filter buses');
    this.acBusFilter = page.getByText(/^AC\s*\(\d+\)/i);
  }

  async waitForResults() {
    await this.resultsContainer.waitFor({ state: 'visible', timeout: 20000 });
  }

  async getResultsCount(): Promise<number> {
    const text = await this.resultsContainer.textContent() ?? '';
    const match = text.match(/(\d+)\s*buses?\s*found/i);
    if (match) return parseInt(match[1], 10);

    // fallback: count bus cards on screen
    await this.busCards.first().waitFor({ state: 'visible', timeout: 15000 });
    return await this.busCards.count();
  }

  async getFirstBusDetails(): Promise<{ name: string; departureTime: string; price: string }> {
    await this.busCards.first().waitFor({ state: 'visible', timeout: 10000 });

    let name = '', price = '', departureTime = '';

    try {
      const operatorText = await this.page.getByText(/^[A-Z][A-Za-z\s&]+$/).first().textContent();
      name = operatorText?.trim() ?? '';
    } catch { }

    try {
      const priceEl = await this.page.getByText(/₹\d+/).first().textContent();
      const priceMatch = priceEl?.match(/₹[\d,]+/);
      price = priceMatch ? priceMatch[0] : (priceEl?.trim() ?? '');
    } catch { }

    try {
      const busInfoText = await this.page.getByText(/\d+\s*buses?\s*starting/).first().textContent({ timeout: 3000 });
      departureTime = busInfoText?.trim() ?? '';
    } catch { }

    if (!departureTime) {
      try {
        const altText = await this.page.getByText(/^\d+\s*buses?\b/).first().textContent({ timeout: 3000 });
        departureTime = altText?.trim() ?? '';
      } catch { }
    }

    return { name, departureTime, price };
  }

  async applyAcFilter() {
    await this.acBusFilter.scrollIntoViewIfNeeded();
    await this.acBusFilter.click();
    await this.page.waitForTimeout(2000);
  }

  async sortByPrice() {
    const priceSort = this.page.getByRole('radio', { name: 'Price' });
    await priceSort.scrollIntoViewIfNeeded();
    await priceSort.click();
    await this.page.waitForTimeout(2500);
  }

  async getVisibleBusPrices(): Promise<number[]> {
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
    return [...new Set(prices)];
  }

  async isOnResultsPage(): Promise<boolean> {
    const url = this.page.url();
    const hasResultsInUrl = url.includes('/bus-tickets/');
    const containerVisible = await this.resultsContainer.isVisible().catch(() => false);
    return hasResultsInUrl || containerVisible;
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async selectFirstOperator() {
    await this.busCards.first().scrollIntoViewIfNeeded();
    await this.busCards.first().click();
    await this.page.waitForTimeout(3000);
  }

  async selectFirstBus() {
    const viewSeatsBtn = this.page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.scrollIntoViewIfNeeded();
    await viewSeatsBtn.click();
    await this.page.waitForTimeout(3000);
  }

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
    const viewSeatsBtn = this.page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.waitFor({ state: 'visible', timeout: 10000 });

    let busName = '', busType = '', departure = '', arrival = '', duration = '';
    let seats = '', price = '', rating = '';

    try {
      const nameEl = await this.page.getByText(/^[A-Z]+ - \w+/).first().textContent({ timeout: 3000 });
      busName = nameEl?.trim() ?? '';
    } catch { }

    try {
      const typeEl = await this.page.getByText(/(?:Sleeper|Seater|AC|Non AC).*\(\d\+\d\)/).first().textContent({ timeout: 3000 });
      busType = typeEl?.trim() ?? '';
    } catch { }

    try {
      const depEl = await this.page.getByText(/^\d{2}:\d{2}$/).first().textContent({ timeout: 3000 });
      departure = depEl?.trim() ?? '';
    } catch { }

    try {
      const durEl = await this.page.getByText(/\d+h\s*\d+m/).first().textContent({ timeout: 3000 });
      duration = durEl?.trim() ?? '';
    } catch { }

    try {
      const seatsEl = await this.page.getByText(/\d+\s*Seats?\s*\(/).first().textContent({ timeout: 3000 });
      seats = seatsEl?.trim() ?? '';
    } catch { }

    try {
      const priceEl = await this.page.getByText(/₹\d+/).first().textContent({ timeout: 3000 });
      price = priceEl?.match(/₹[\d,]+/)?.[0] ?? (priceEl?.trim() ?? '');
    } catch { }

    try {
      const ratingEl = await this.page.getByText(/^\d\.\d$/).first().textContent({ timeout: 3000 });
      rating = ratingEl?.trim() ?? '';
    } catch { }

    return { busName, busType, departure, arrival, duration, seats, price, rating };
  }
}