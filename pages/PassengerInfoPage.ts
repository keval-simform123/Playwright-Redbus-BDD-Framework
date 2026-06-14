import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// passenger details form page
export class PassengerInfoPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // wait for page to load
  async waitForPassengerInfoPage() {
    // wait for phone field
    await this.page.getByLabel('Phone *').waitFor({ state: 'visible', timeout: 15000 });

    // close any promotional overlays
    try {
      const closeBtn = this.page.locator('[aria-label="Close"]').first();
      const visible = await closeBtn.isVisible({ timeout: 2000 });
      if (visible) {
        await closeBtn.click({ force: true });
        await this.page.waitForTimeout(500);
      }
    } catch { }

    // disable pointer-events on the overlay so we can click inputs
    try {
      await this.page.evaluate(() => {
        document.querySelectorAll('[class*="bottomSheetOverlay"]').forEach(el => {
          (el as HTMLElement).style.pointerEvents = 'none';
        });
      });
    } catch { }

    console.log('[PassengerInfoPage] Passenger Info page loaded.');
  }

  // check if we are on the info page
  async isOnPassengerInfoPage(): Promise<boolean> {
    try {
      const phoneInput = this.page.getByLabel('Phone *');
      return await phoneInput.isVisible();
    } catch {
      return false;
    }
  }

  // enter phone number
  async enterPhone(phone: string) {
    const phoneInput = this.page.getByLabel('Phone *');
    await phoneInput.click();
    await phoneInput.fill(phone);
    console.log(`[PassengerInfoPage] Entered phone: ${phone}`);
  }

  // enter email
  async enterEmail(email: string) {
    const emailInput = this.page.getByLabel('Email ID');
    await emailInput.click();
    await emailInput.fill(email);
    console.log(`[PassengerInfoPage] Entered email: ${email}`);
  }

  // choose state of residence
  async selectState(stateName: string) {
    // open state list dropdown
    const stateCombobox = this.page.getByLabel('State of Residence', { exact: true });
    await stateCombobox.scrollIntoViewIfNeeded();
    await stateCombobox.click();
    await this.page.waitForTimeout(1500);

    // search state name
    const searchBox = this.page.getByPlaceholder('Search for state');
    await searchBox.fill(stateName);
    await this.page.waitForTimeout(1000);

    // select the state radio option
    const stateOption = this.page.getByText(stateName, { exact: true }).first();
    await stateOption.click();
    await this.page.waitForTimeout(500);
    console.log(`[PassengerInfoPage] Selected state: ${stateName}`);
  }

  // enter name
  async enterName(name: string) {
    const nameInput = this.page.getByLabel('Name *');
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.click();
    await nameInput.fill(name);
    console.log(`[PassengerInfoPage] Entered name: ${name}`);
  }

  // enter age
  async enterAge(age: string) {
    const ageInput = this.page.getByLabel('Age *');
    await ageInput.click();
    await ageInput.fill(age);
    console.log(`[PassengerInfoPage] Entered age: ${age}`);
  }

  // select gender
  async selectGender(gender: 'Male' | 'Female') {
    // find toggle and click it via JS to trigger react updates
    const genderRadio = this.page.locator('[role="radio"][class*="toggleBtn"]')
      .filter({ hasText: new RegExp(`^${gender}$`) });
    await genderRadio.scrollIntoViewIfNeeded();

    // click via js since sometimes react ignores regular click
    await genderRadio.evaluate((el) => {
      el.click();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await this.page.waitForTimeout(1000);

    // check if selection worked
    const isChecked = await genderRadio.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      // fallback click
      await this.page.getByText(gender, { exact: true }).first().click({ force: true });
      await this.page.waitForTimeout(500);
    }

    console.log(`[PassengerInfoPage] Selected gender: ${gender}`);
  }

  // refuse free cancellation
  async declineFreeCancellation() {
    // scroll down a bit
    await this.page.evaluate(() => window.scrollBy(0, 500));
    await this.page.waitForTimeout(500);
    const rejectOption = this.page.locator('#fcRejectText');
    await rejectOption.scrollIntoViewIfNeeded();
    await rejectOption.click({ force: true });
    await this.page.waitForTimeout(500);
    console.log('[PassengerInfoPage] Declined Free Cancellation.');
  }

  // refuse insurance option
  async declineInsurance() {
    // scroll down a bit
    await this.page.evaluate(() => window.scrollBy(0, 500));
    await this.page.waitForTimeout(500);
    const rejectOption = this.page.locator('#insuranceRejectText');
    await rejectOption.scrollIntoViewIfNeeded();
    await rejectOption.click({ force: true });
    await this.page.waitForTimeout(500);
    console.log('[PassengerInfoPage] Declined redBus Assurance.');
  }

  // click continue
  async clickContinueBooking() {
    const continueBtn = this.page.getByRole('button', { name: /Continue booking/i });
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    await this.page.waitForTimeout(3000);
    console.log('[PassengerInfoPage] Clicked Continue booking.');
  }

  // fill everything at once
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
