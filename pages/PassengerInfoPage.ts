import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PassengerInfoPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForPassengerInfoPage() {
    await this.page.getByLabel('Phone *').waitFor({ state: 'visible', timeout: 15000 });

    // close any promo overlay blocking inputs
    try {
      const closeBtn = this.page.locator('[aria-label="Close"]').first();
      const visible = await closeBtn.isVisible({ timeout: 2000 });
      if (visible) {
        await closeBtn.click({ force: true });
        await this.page.waitForTimeout(500);
      }
    } catch { }

    // disable pointer events on overlays so we can interact with inputs
    try {
      await this.page.evaluate(() => {
        document.querySelectorAll('[class*="bottomSheetOverlay"]').forEach(el => {
          (el as HTMLElement).style.pointerEvents = 'none';
        });
      });
    } catch { }

    console.log('[PassengerInfo] Page loaded.');
  }

  async selectSavedPassengerIfAvailable(): Promise<boolean> {
    try {
      const coTravellersHeading = this.page.getByRole('heading', { name: /Co-Travellers/i });
      if (!(await coTravellersHeading.isVisible({ timeout: 3000 }).catch(() => false))) {
        return false;
      }
      console.log('[PassengerInfo] Co-Travellers section found.');

      // find and click the saved passenger card via DOM
      const clicked = await this.page.evaluate(() => {
        const allElements = document.querySelectorAll('div');
        for (let i = allElements.length - 1; i >= 0; i--) {
          const el = allElements[i];
          const text = el.textContent || '';
          if (/(?:Male|Female),\s*\d+\s*years?/.test(text)) {
            let target: HTMLElement | null = el as HTMLElement;
            while (target && target !== document.body) {
              const style = window.getComputedStyle(target);
              if (style.cursor === 'pointer') {
                target.click();
                return true;
              }
              target = target.parentElement;
            }
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        await this.page.waitForTimeout(1500);
        await this.dismissAddPassengerModal();

        const selectionText = this.page.getByText(/1\/1 passengers selected/i);
        if (await selectionText.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('[PassengerInfo] Saved passenger selected (1/1 confirmed).');
          return true;
        }

        console.log('[PassengerInfo] Clicked saved co-traveller card.');
        return true;
      }

      console.log('[PassengerInfo] No saved passenger card found.');
      return false;
    } catch (err) {
      console.log('[PassengerInfo] Error selecting saved passenger:', err);
      return false;
    }
  }

  // closes "Add passenger" modal if it accidentally opened
  private async dismissAddPassengerModal() {
    try {
      const modalHeading = this.page.locator('h2, h3, h4').filter({ hasText: /^Add passenger$/i }).first();
      if (!(await modalHeading.isVisible({ timeout: 1000 }).catch(() => false))) return;

      const closeBtn = modalHeading.locator('xpath=ancestor::div[1]//button').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
        await this.page.waitForTimeout(500);
        console.log('[PassengerInfo] Dismissed "Add passenger" modal.');
      }
    } catch { }
  }

  async isOnPassengerInfoPage(): Promise<boolean> {
    try {
      return await this.page.getByLabel('Phone *').isVisible();
    } catch {
      return false;
    }
  }

  async enterPhone(phone: string) {
    const phoneInput = this.page.getByLabel('Phone *');
    await phoneInput.click();
    await phoneInput.fill(phone);
    console.log(`[PassengerInfo] Phone: ${phone}`);
  }

  async enterEmail(email: string) {
    const emailInput = this.page.getByLabel('Email ID');
    await emailInput.click();
    await emailInput.fill(email);
    console.log(`[PassengerInfo] Email: ${email}`);
  }

  async selectState(stateName: string) {
    const stateCombobox = this.page.getByLabel('State of Residence', { exact: true });
    await stateCombobox.scrollIntoViewIfNeeded();
    await stateCombobox.click();

    const searchBox = this.page.getByPlaceholder('Search for state');
    await searchBox.waitFor({ state: 'visible', timeout: 5000 });
    await searchBox.fill(stateName);

    // Wait for the option/radio to appear and click it
    const stateOption = this.page.locator('[role="radio"], [role="option"], li').filter({ hasText: new RegExp(`^${stateName}$`, 'i') }).first();
    await stateOption.waitFor({ state: 'visible', timeout: 5000 });
    await stateOption.click();
    await this.page.waitForTimeout(500);
    console.log(`[PassengerInfo] State: ${stateName}`);
  }

  async enterName(name: string) {
    const nameInput = this.page.getByLabel('Name *');
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.click();
    await nameInput.fill(name);
    console.log(`[PassengerInfo] Name: ${name}`);
  }

  async enterAge(age: string) {
    const ageInput = this.page.getByLabel('Age *');
    await ageInput.click();
    await ageInput.fill(age);
    console.log(`[PassengerInfo] Age: ${age}`);
  }

  async selectGender(gender: 'Male' | 'Female') {
    const genderRadio = this.page.locator('[role="radio"][class*="toggleBtn"]')
      .filter({ hasText: new RegExp(`^${gender}$`) });
    await genderRadio.scrollIntoViewIfNeeded();

    // use JS click to ensure react state updates
    await genderRadio.evaluate((el) => {
      (el as HTMLElement).click();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await this.page.waitForTimeout(1000);

    const isChecked = await genderRadio.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      await this.page.getByText(gender, { exact: true }).first().click({ force: true });
      await this.page.waitForTimeout(500);
    }

    console.log(`[PassengerInfo] Gender: ${gender}`);
  }

  async declineFreeCancellation() {
    try {
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(300);
      const rejectOption = this.page.locator('#fcRejectText');
      if (await rejectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rejectOption.scrollIntoViewIfNeeded();
        await rejectOption.click({ force: true });
        await this.page.waitForTimeout(300);
        console.log('[PassengerInfo] Declined free cancellation.');
      } else {
        console.log('[PassengerInfo] Free cancellation not shown, skipping.');
      }
    } catch {
      console.log('[PassengerInfo] Free cancellation unavailable, skipping.');
    }
  }

  async declineInsurance() {
    try {
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(300);

      const rejectOption = this.page.locator('#insuranceRejectText');
      if (await rejectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rejectOption.scrollIntoViewIfNeeded();
        await rejectOption.click({ force: true });
        await this.page.waitForTimeout(300);
        console.log('[PassengerInfo] Declined insurance.');
        return;
      }

      // logged-in state uses radio buttons instead
      const noInsuranceRadio = this.page.getByRole('radio', { name: /No, I would like to proceed without insurance/i });
      if (await noInsuranceRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noInsuranceRadio.scrollIntoViewIfNeeded();
        await noInsuranceRadio.click({ force: true });
        await this.page.waitForTimeout(300);
        console.log('[PassengerInfo] Declined insurance (radio).');
        return;
      }

      console.log('[PassengerInfo] Insurance not shown, skipping.');
    } catch {
      console.log('[PassengerInfo] Insurance unavailable, skipping.');
    }
  }

  async clickContinueBooking() {
    await this.dismissAddPassengerModal();

    try {
      await this.page.evaluate(() => window.scrollBy(0, 1000));
    } catch (e) {
      console.log('[PassengerInfo] Scroll failed (page may have navigated):', (e as Error).message);
    }
    await this.page.waitForTimeout(300);

    // Listen for potential new page/popup (payment gateway may open in new tab)
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);

    const continueBtn = this.page.getByRole('button', { name: /Continue booking/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.scrollIntoViewIfNeeded();
      await continueBtn.click();
    } else {
      const fallbackBtn = this.page.locator('button').filter({ hasText: /Continue booking/i }).first();
      await fallbackBtn.scrollIntoViewIfNeeded();
      await fallbackBtn.click();
    }

    // Wait for either navigation or new page
    const newPage = await popupPromise;
    if (newPage) {
      console.log('[PassengerInfo] Payment opened in new tab.');
      await newPage.waitForLoadState('domcontentloaded');
    } else {
      await this.page.waitForTimeout(3000);
    }
    console.log('[PassengerInfo] Clicked Continue booking.');
  }

  async fillPassengerForm(data: {
    phone: string;
    email: string;
    state: string;
    name: string;
    age: string;
    gender: 'Male' | 'Female';
  }) {
    await this.enterPhone(data.phone);
    await this.enterEmail(data.email);
    await this.selectState(data.state);
    await this.enterName(data.name);
    await this.enterAge(data.age);
    await this.selectGender(data.gender);
    await this.declineFreeCancellation();
    await this.declineInsurance();
  }
}
