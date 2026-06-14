import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// choose seat and boarding/dropping points
export class SeatSelectionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // get rid of login popup if it gets in the way
  async dismissLoginPopup() {
    try {
      const closeBtn = this.page.getByLabel('Login to get exciting offers').getByLabel('Close');
      await closeBtn.waitFor({ state: 'visible', timeout: 8000 });
      await closeBtn.click({ force: true });
      await this.page.waitForTimeout(2000);
      console.log('[SeatSelectionPage] Dismissed login popup.');
    } catch {
      // ignore if it doesn't show
    }
  }

  // wait for seat layout grid
  async waitForSeatLayout() {
    await this.page.locator('[data-autoid="seatContainer"]')
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  // is seat layout grid visible
  async isSeatLayoutVisible(): Promise<boolean> {
    return await this.page.locator('[data-autoid="seatContainer"]')
      .isVisible().catch(() => false);
  }

  // try seat S12, otherwise click first available one
  async selectFirstAvailableSeat() {
    // seat layout wrapper locator
    const seatLayout = this.page.locator('[aria-label="Bus seat layout"]');
    await seatLayout.waitFor({ state: 'visible', timeout: 15000 });

    // target S12
    const seatS12 = seatLayout.locator('span[role="button"][aria-label*="Seat number S12"]');
    const s12Visible = await seatS12.isVisible({ timeout: 3000 }).catch(() => false);

    if (s12Visible) {
      await seatS12.click();
      console.log('[SeatSelectionPage] Selected seat S12 (lower deck).');
    } else {
      // click first available if S12 is taken
      const availableSeat = seatLayout.locator('span[role="button"][aria-label*="seat status available"]').first();
      await availableSeat.waitFor({ state: 'visible', timeout: 10000 });
      await availableSeat.click();
      console.log('[SeatSelectionPage] Seat S12 not found, selected first available seat.');
    }
    await this.page.waitForTimeout(2000);
  }

  // extract selected seat price
  async getSelectedSeatPrice(): Promise<string> {
    try {
      // read from bottom bar fare box
      const priceBar = this.page.locator('[class*="fareWrapper" i], [class*="totalFare" i]').first();
      const visible = await priceBar.isVisible().catch(() => false);
      if (visible) {
        const text = await priceBar.textContent();
        return text?.match(/₹[\d,]+/)?.[0] ?? '';
      }
      // fallback price element lookup
      const bottomBarPrice = this.page.getByText(/₹\d/).last();
      const text = await bottomBarPrice.textContent().catch(() => '');
      return text?.match(/₹[\d,]+/)?.[0] ?? '';
    } catch {
      return '';
    }
  }

  // go to boarding/dropping points selection
  async clickSelectBoardingDroppingButton() {
    // match the boarding points button at the bottom
    const btn = this.page.getByText(/Select boarding\s*&\s*dropping/i).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await btn.click({ force: true });
    await this.page.waitForTimeout(3000);
  }

  // choose first boarding point
  async selectFirstBoardingPoint() {
    // boarding list is first column
    const boardingList = this.page.locator('[class*="bpdpList"]').first();
    await boardingList.waitFor({ state: 'visible', timeout: 10000 });

    // select first radio button
    const firstBoardingRadio = boardingList.locator('[role="radio"]').first();
    await firstBoardingRadio.waitFor({ state: 'visible', timeout: 5000 });
    await firstBoardingRadio.click();
    await this.page.waitForTimeout(1000);
    console.log('[SeatSelectionPage] Selected first boarding point.');
  }

  // choose first dropping point
  async selectFirstDroppingPoint() {
    // dropping list is second column
    const droppingList = this.page.locator('[class*="bpdpList"]').nth(1);
    await droppingList.waitFor({ state: 'visible', timeout: 10000 });

    // click first radio, force it because of page transition
    const firstDroppingRadio = droppingList.locator('[role="radio"]').first();
    await firstDroppingRadio.waitFor({ state: 'visible', timeout: 5000 });
    await firstDroppingRadio.click({ force: true, noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    console.log('[SeatSelectionPage] Selected first dropping point.');
  }

  // check boarding points section visibility
  async isBoardingPointVisible(): Promise<boolean> {
    return await this.page.locator('[class*="bpdpList"]').first().isVisible().catch(() => false);
  }

  // check dropping points section visibility
  async isDroppingPointVisible(): Promise<boolean> {
    return await this.page.locator('[class*="bpdpList"]').nth(1).isVisible().catch(() => false);
  }

  // click proceed button
  async clickProceedToPassenger(): Promise<boolean> {
    // get proceeding button locator
    const proceedBtn = this.page.getByRole('button', { name: /proceed|fill.*detail|continue|next/i }).first();
    const visible = await proceedBtn.isVisible().catch(() => false);
    if (visible) {
      await proceedBtn.click();
      await this.page.waitForTimeout(3000);
      return true;
    }
    return false;
  }

  // check if details form is visible
  async isPassengerFormVisible(): Promise<boolean> {
    return await this.page.getByText(/Passenger|Contact|Email|Phone|Name/i)
      .first().isVisible().catch(() => false);
  }

  // check if we are on the boarding/dropping page
  async isBoardDropPageVisible(): Promise<boolean> {
    try {
      await this.page.locator('[class*="bpdpList"]').first().waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }
}
