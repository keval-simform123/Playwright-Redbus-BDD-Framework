import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {

  // locators for redbus form
  readonly fromCityInput: Locator;
  readonly toCityInput: Locator;
  readonly searchButton: Locator;
  readonly datePicker: Locator;
  readonly accountButton: Locator;
  readonly loginButton: Locator;
  readonly mobileInput: Locator;

  constructor(page: Page) {
    super(page);
    this.fromCityInput = page.locator('div').filter({ hasText: /^From$/ }).nth(1);
    this.toCityInput = page.locator('div').filter({ hasText: /^To$/ }).first();
    this.searchButton = page.getByRole('button', { name: 'Search buses' });
    this.datePicker = page.getByRole('combobox', { name: 'Select Date of Journey.' });
    this.accountButton = page.locator('#signin_dd, button:has-text("Account"), #profile_action_menu').first();
    this.loginButton = page.locator('button:has-text("Log in"), li:has-text("Log in"), #hc').first();
    this.mobileInput = page.locator('input#mobileNoInp, input[class*="inputFieldMobile"]').first();
  }

  // Account and Login actions
  async clickAccount() {
    await this.accountButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.accountButton.click();
  }

  async clickLogin() {
    await this.loginButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.loginButton.click();
  }

  async isLoginModalVisible(): Promise<boolean> {
    try {
      // 1. Check if the login modal container or heading is visible first
      const header = this.page.getByText('Login to get exciting offers').first();
      await header.waitFor({ state: 'visible', timeout: 10000 });
      
      // 2. Wait for the mobile input field to be visible
      await this.mobileInput.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // actions
  async enterFromCity(city: string) {
    await this.fromCityInput.click();
    await this.page.keyboard.type(city, { delay: 100 });
    // wait for suggestions to show up
    await this.page.waitForTimeout(2000);
    const firstSuggestion = this.page.getByRole('option').first();
    const suggestionVisible = await firstSuggestion.isVisible().catch(() => false);
    if (suggestionVisible) {
      await firstSuggestion.click();
    } else {
      // fallback if suggestion option not found
      const listItem = this.page.locator('ul li').first();
      const listVisible = await listItem.isVisible().catch(() => false);
      if (listVisible) {
        await listItem.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
    }
  }

  async enterToCity(city: string) {
    await this.toCityInput.click();
    await this.page.keyboard.type(city, { delay: 100 });
    // wait for suggestions
    await this.page.waitForTimeout(2000);
    const firstSuggestion = this.page.getByRole('option').first();
    const suggestionVisible = await firstSuggestion.isVisible().catch(() => false);
    if (suggestionVisible) {
      await firstSuggestion.click();
    } else {
      // fallback if suggestions option not found
      const listItem = this.page.locator('ul li').first();
      const listVisible = await listItem.isVisible().catch(() => false);
      if (listVisible) {
        await listItem.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
    }
  }

  // pick a date on calendar
  async selectDate(dateString: string) {
    // wait for date picker to show up
    await this.datePicker.waitFor({ state: 'visible', timeout: 15000 });
    await this.datePicker.click();
    await this.page.waitForTimeout(1000);

    const targetDate = new Date(dateString);
    // fallback for dates like "18 Jul 2026" if new Date fails
    if (isNaN(targetDate.getTime())) {
      // split to parse DD Mon YYYY
      const parts = dateString.split(' ');
      const day = parseInt(parts[0]);
      // click the day number directly
      const dayCell = this.page.getByText(day.toString(), { exact: true }).first();
      await dayCell.click();
      return;
    }

    const targetDay = targetDate.getDate().toString();
    const targetMonthYear = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // click next month until we reach target month
    let attempts = 0;
    while (attempts < 6) {
      const monthCaption = this.page.getByText(targetMonthYear, { exact: false });
      const isCurrentMonth = await monthCaption.isVisible().catch(() => false);
      if (isCurrentMonth) break;
      // click next month arrow
      const nextButton = this.page.locator('button:has-text("→"), [aria-label*="next"], [aria-label*="Next"]').first();
      await nextButton.click();
      await this.page.waitForTimeout(500);
      attempts++;
    }

    // click the grid cell for the day
    const dayCell = this.page.getByRole('gridcell', { name: targetDay, exact: true }).first();
    const dayCellVisible = await dayCell.isVisible().catch(() => false);
    if (dayCellVisible) {
      await dayCell.click();
    } else {
      // fallback by matching day text
      const dayByText = this.page.getByText(targetDay, { exact: true }).first();
      await dayByText.click();
    }
  }

  async clickSearch() {
    await this.searchButton.hover();
    await this.searchButton.click();
  }

  // accept cookies if prompt appears
  async dismissCookieBanner() {
    try {
      const closeBtn = this.page.getByRole('button', { name: /accept|got it|close/i });
      const visible = await closeBtn.isVisible({ timeout: 3000 });
      if (visible) {
        await closeBtn.click();
      }
    } catch { }
  }

  // dismiss app download popup if it shows up
  async dismissAppDownloadBanner() {
    try {
      const closeBannerBtn = this.page.locator('[class*="close"]').first();
      const visible = await closeBannerBtn.isVisible({ timeout: 3000 });
      if (visible) {
        await closeBannerBtn.click();
      }
    } catch { }
  }

  // find next saturday or sunday and click it
  async selectWeekendDate(): Promise<string> {
    await this.datePicker.click();
    await this.page.waitForTimeout(1000);

    // try saturday first
    let weekendCell = this.page.locator(
      '[role="button"][aria-label*="Saturday"][aria-disabled="false"]'
    ).first();
    let ariaLabel = await weekendCell.getAttribute('aria-label').catch(() => null);

    // try sunday if no saturday
    if (!ariaLabel) {
      weekendCell = this.page.locator(
        '[role="button"][aria-label*="Sunday"][aria-disabled="false"]'
      ).first();
      ariaLabel = await weekendCell.getAttribute('aria-label').catch(() => null);
    }

    // click next month arrow if weekend not found in current month
    if (!ariaLabel) {
      const nextMonthBtn = this.page.locator('[aria-label*="Next month"]').first();
      await nextMonthBtn.click();
      await this.page.waitForTimeout(600);
      weekendCell = this.page.locator(
        '[role="button"][aria-label*="Saturday"][aria-disabled="false"]'
      ).first();
      ariaLabel = await weekendCell.getAttribute('aria-label').catch(() => null);
    }

    await weekendCell.scrollIntoViewIfNeeded();
    await weekendCell.click();
    await this.page.waitForTimeout(500);
    return ariaLabel ?? '';
  }
}