import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SeatSelectionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async dismissLoginPopup() {
    try {
      const closeBtn = this.page.getByLabel('Login to get exciting offers').getByLabel('Close');
      await closeBtn.waitFor({ state: 'visible', timeout: 8000 });
      await closeBtn.click({ force: true });
      await this.page.waitForTimeout(2000);
      console.log('[SeatSelection] Dismissed login popup.');
    } catch { }
  }

  async waitForSeatLayout() {
    await this.page.locator('[data-autoid="seatContainer"]')
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  async isSeatLayoutVisible(): Promise<boolean> {
    return await this.page.locator('[data-autoid="seatContainer"]')
      .isVisible().catch(() => false);
  }

  async selectFirstAvailableSeat() {
    const seatLayout = this.page.locator('[aria-label="Bus seat layout"]');
    await seatLayout.waitFor({ state: 'visible', timeout: 15000 });

    // try S12 first, otherwise pick any available seat
    const seatS12 = seatLayout.locator('span[role="button"][aria-label*="Seat number S12"]');
    const s12Visible = await seatS12.isVisible({ timeout: 3000 }).catch(() => false);

    if (s12Visible) {
      await seatS12.click();
      console.log('[SeatSelection] Selected seat S12.');
    } else {
      const availableSeat = seatLayout.locator('span[role="button"][aria-label*="seat status available"]').first();
      await availableSeat.waitFor({ state: 'visible', timeout: 10000 });
      await availableSeat.click();
      console.log('[SeatSelection] Selected first available seat.');
    }
    await this.page.waitForTimeout(2000);
  }

  async getSelectedSeatPrice(): Promise<string> {
    try {
      const priceBar = this.page.locator('[class*="fareWrapper" i], [class*="totalFare" i]').first();
      const visible = await priceBar.isVisible().catch(() => false);
      if (visible) {
        const text = await priceBar.textContent();
        return text?.match(/₹[\d,]+/)?.[0] ?? '';
      }
      const bottomBarPrice = this.page.getByText(/₹\d/).last();
      const text = await bottomBarPrice.textContent().catch(() => '');
      return text?.match(/₹[\d,]+/)?.[0] ?? '';
    } catch {
      return '';
    }
  }

  async clickSelectBoardingDroppingButton() {
    const btn = this.page.getByText(/Select boarding\s*&\s*dropping/i).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await btn.click({ force: true });
    await this.page.waitForTimeout(3000);
  }

  async selectFirstBoardingPoint() {
    const boardingList = this.page.locator('[class*="bpdpList"]').first();
    await boardingList.waitFor({ state: 'visible', timeout: 10000 });

    const firstBoardingRadio = boardingList.locator('[role="radio"]').first();
    await firstBoardingRadio.waitFor({ state: 'visible', timeout: 5000 });
    await firstBoardingRadio.click();
    await this.page.waitForTimeout(1000);
    console.log('[SeatSelection] Selected first boarding point.');
  }

  async selectFirstDroppingPoint() {
    const droppingList = this.page.locator('[class*="bpdpList"]').nth(1);
    await droppingList.waitFor({ state: 'visible', timeout: 10000 });

    const firstDroppingRadio = droppingList.locator('[role="radio"]').first();
    await firstDroppingRadio.waitFor({ state: 'visible', timeout: 5000 });
    await firstDroppingRadio.click({ force: true, noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    console.log('[SeatSelection] Selected first dropping point.');
  }

  async isBoardingPointVisible(): Promise<boolean> {
    return await this.page.locator('[class*="bpdpList"]').first().isVisible().catch(() => false);
  }

  async isDroppingPointVisible(): Promise<boolean> {
    return await this.page.locator('[class*="bpdpList"]').nth(1).isVisible().catch(() => false);
  }

  // polls for passenger form or proceed button after dropping point selection
  async clickProceedToPassenger(): Promise<boolean> {
    console.log('[SeatSelection] Waiting for passenger form or proceed button...');

    for (let attempt = 0; attempt < 15; attempt++) {
      const onPassengerPage = await this.isPassengerFormVisible();
      if (onPassengerPage) {
        console.log('[SeatSelection] Auto-transitioned to passenger info.');
        return true;
      }

      const proceedBtn = this.page.getByRole('button', { name: /proceed|fill.*detail|continue/i }).first();
      const btnVisible = await proceedBtn.isVisible().catch(() => false);
      if (btnVisible) {
        console.log('[SeatSelection] Clicking proceed button...');
        await proceedBtn.click();
        await this.page.waitForTimeout(3000);
        return true;
      }

      const textBtn = this.page.locator('button').filter({ hasText: /proceed|continue/i }).first();
      const textBtnVisible = await textBtn.isVisible().catch(() => false);
      if (textBtnVisible) {
        console.log('[SeatSelection] Clicking proceed button (fallback)...');
        await textBtn.click();
        await this.page.waitForTimeout(3000);
        return true;
      }

      await this.page.waitForTimeout(1000);
    }

    const finalCheck = await this.isPassengerFormVisible();
    if (finalCheck) {
      console.log('[SeatSelection] Passenger page found on final check.');
      return true;
    }

    console.log('[SeatSelection] Could not find passenger form after 15s.');
    return false;
  }

  async isPassengerFormVisible(): Promise<boolean> {
    const phoneLabel = await this.page.getByLabel('Phone *').isVisible().catch(() => false);
    if (phoneLabel) return true;

    const contactText = await this.page.getByText(/Contact details/i).first().isVisible().catch(() => false);
    if (contactText) return true;

    const continueBooking = await this.page.getByRole('button', { name: /Continue booking/i }).first().isVisible().catch(() => false);
    if (continueBooking) return true;

    const phoneInput = await this.page.locator('input[placeholder*="phone" i], input[name*="phone" i], input[type="tel"]').first().isVisible().catch(() => false);
    if (phoneInput) return true;

    return false;
  }

  async isBoardDropPageVisible(): Promise<boolean> {
    try {
      await this.page.locator('[class*="bpdpList"]').first().waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }
}
