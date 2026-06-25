import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string = '/') {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async waitForSelector(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async scrollIntoView(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
}
