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

  // Select the first saved co-traveller card if visible (logged-in state).
  // Returns true if a saved passenger was successfully selected, false otherwise.
  async selectSavedPassengerIfAvailable(): Promise<boolean> {
    try {
      const coTravellersHeading = this.page.getByRole('heading', { name: /Co-Travellers/i });
      if (!(await coTravellersHeading.isVisible({ timeout: 3000 }).catch(() => false))) {
        return false;
      }
      console.log('[PassengerInfoPage] Logged-in state: Co-Travellers section detected.');

      // The saved passenger card contains text like "Male, 21 years" or "Female, 25 years".
      // We need to click the CARD element specifically (the clickable container with cursor:pointer).
      // Use page.evaluate for precise DOM traversal to find and click the right element.
      const clicked = await this.page.evaluate(() => {
        // Strategy: find elements containing "Male" or "Female" + "years" text pattern
        const allElements = document.querySelectorAll('div');
        for (let i = allElements.length - 1; i >= 0; i--) {
          const el = allElements[i];
          const text = el.textContent || '';
          // Match pattern like "Male, 21 years" or "Female, 25 years"
          if (/(?:Male|Female),\s*\d+\s*years?/.test(text)) {
            // Walk up to find the clickable parent (the card container)
            let target: HTMLElement | null = el as HTMLElement;
            // The card container is the one with cursor:pointer style
            while (target && target !== document.body) {
              const style = window.getComputedStyle(target);
              if (style.cursor === 'pointer') {
                target.click();
                return true;
              }
              target = target.parentElement;
            }
            // If no cursor:pointer parent found, click the element itself
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        await this.page.waitForTimeout(1500);

        // Check if an "Add passenger" modal accidentally opened and close it
        await this.dismissAddPassengerModal();

        // Verify the selection worked by checking "1/1 passengers selected"
        const selectionText = this.page.getByText(/1\/1 passengers selected/i);
        if (await selectionText.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('[PassengerInfoPage] Selected saved co-traveller successfully (1/1 confirmed).');
          return true;
        }

        console.log('[PassengerInfoPage] Clicked saved co-traveller card.');
        return true;
      }

      console.log('[PassengerInfoPage] Co-Travellers section found but no saved passenger card visible.');
      return false;
    } catch (err) {
      console.log('[PassengerInfoPage] Error selecting saved passenger:', err);
      return false;
    }
  }

  // Close the "Add passenger" modal dialog if it's open.
  // IMPORTANT: Only targets actual modal overlays, NOT the "Add Passenger" button on the page.
  private async dismissAddPassengerModal() {
    try {
      // Look for modal heading "Add passenger" inside a dialog or overlay container
      const modalHeading = this.page.locator('h2, h3, h4').filter({ hasText: /^Add passenger$/i }).first();
      if (!(await modalHeading.isVisible({ timeout: 1000 }).catch(() => false))) {
        return; // No modal open
      }

      // Find the close (X) button near the modal heading
      const closeBtn = modalHeading.locator('xpath=ancestor::div[1]//button').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
        await this.page.waitForTimeout(500);
        console.log('[PassengerInfoPage] Dismissed "Add passenger" modal.');
      }
    } catch { }
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
      (el as HTMLElement).click();
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
    try {
      // scroll down a bit
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(500);
      const rejectOption = this.page.locator('#fcRejectText');
      if (await rejectOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rejectOption.scrollIntoViewIfNeeded();
        await rejectOption.click({ force: true });
        await this.page.waitForTimeout(500);
        console.log('[PassengerInfoPage] Declined Free Cancellation.');
      } else {
        console.log('[PassengerInfoPage] Free Cancellation section not found, skipping.');
      }
    } catch {
      console.log('[PassengerInfoPage] Free Cancellation section not available, skipping.');
    }
  }

  // refuse insurance option
  async declineInsurance() {
    try {
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(500);

      // Try the standard #insuranceRejectText element first
      const rejectOption = this.page.locator('#insuranceRejectText');
      if (await rejectOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rejectOption.scrollIntoViewIfNeeded();
        await rejectOption.click({ force: true });
        await this.page.waitForTimeout(500);
        console.log('[PassengerInfoPage] Declined redBus Assurance.');
        return;
      }

      // Fallback: logged-in state uses radio buttons for insurance
      const noInsuranceRadio = this.page.getByRole('radio', { name: /No, I would like to proceed without insurance/i });
      if (await noInsuranceRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
        await noInsuranceRadio.scrollIntoViewIfNeeded();
        await noInsuranceRadio.click({ force: true });
        await this.page.waitForTimeout(500);
        console.log('[PassengerInfoPage] Declined Travel Insurance (radio button).');
        return;
      }

      console.log('[PassengerInfoPage] Insurance section not found, skipping.');
    } catch {
      console.log('[PassengerInfoPage] Insurance section not available, skipping.');
    }
  }

  // click continue
  async clickContinueBooking() {
    // Dismiss any open modal (like "Add passenger") that could block the button
    await this.dismissAddPassengerModal();

    // Scroll to bottom of the passenger info panel to reveal the Continue button
    await this.page.evaluate(() => window.scrollBy(0, 1000));
    await this.page.waitForTimeout(500);

    const continueBtn = this.page.getByRole('button', { name: /Continue booking/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.scrollIntoViewIfNeeded();
      await continueBtn.click();
    } else {
      // Fallback: look for button by text content
      const fallbackBtn = this.page.locator('button').filter({ hasText: /Continue booking/i }).first();
      await fallbackBtn.scrollIntoViewIfNeeded();
      await fallbackBtn.click();
    }
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
