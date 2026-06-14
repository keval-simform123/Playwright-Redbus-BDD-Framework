import { Page } from '@playwright/test';

// base page class with generic methods
export class BasePage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  // go to relative baseurl
  async navigate(url: string = '/') {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  // wait for load event to fire
  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
  }

  // this will wait for api calls to finish
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  // screen grab helper for debugging
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  // wait for element to appear
  async waitForSelector(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  // scroll to element if we need to
  async scrollIntoView(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
}
