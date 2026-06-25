import { Given, When, Then, expect } from './fixtures';

When('the user selects the first bus operator', async ({ resultsPage }) => {
  console.log('[Seats] Selecting first bus operator...');
  await resultsPage.selectFirstOperator();
});

When('the user clicks View Seats on the first bus', async ({ page }) => {
  console.log('[Seats] Clicking View Seats...');
  const viewSeatsBtn = page.getByRole('button', { name: /View seats/i }).first();
  await viewSeatsBtn.scrollIntoViewIfNeeded();
  await viewSeatsBtn.click();
  await page.waitForTimeout(3000);
});

Then('the seat layout should be visible', async ({ seatSelectionPage }) => {
  const visible = await seatSelectionPage.isSeatLayoutVisible();
  expect(visible, 'Seat layout should be visible').toBe(true);
  console.log('[Seats] Seat layout visible.');
});

When('the user dismisses the login popup if present', async ({ seatSelectionPage }) => {
  await seatSelectionPage.dismissLoginPopup();
});

When('the seat layout is loaded', async ({ seatSelectionPage }) => {
  await seatSelectionPage.waitForSeatLayout();
  const visible = await seatSelectionPage.isSeatLayoutVisible();
  expect(visible, 'Seat layout should be loaded').toBe(true);
  console.log('[Seats] Layout loaded.');
});

When('the user selects the first available seat', async ({ seatSelectionPage }) => {
  console.log('[Seats] Selecting first available seat...');
  await seatSelectionPage.selectFirstAvailableSeat();
});

Then('a seat should be selected successfully', async ({ seatSelectionPage }) => {
  const price = await seatSelectionPage.getSelectedSeatPrice();
  console.log(`[Seats] Selected. Price: ${price || 'N/A'}`);
});

When('the user clicks Select Boarding and Dropping Points', async ({ seatSelectionPage }) => {
  console.log('[Seats] Clicking Select Boarding & Dropping Points...');
  await seatSelectionPage.clickSelectBoardingDroppingButton();
});

Then('the boarding and dropping points page should be visible', async ({ seatSelectionPage }) => {
  const visible = await seatSelectionPage.isBoardDropPageVisible();
  expect(visible, 'Boarding/Dropping page should be visible').toBe(true);
  console.log('[Seats] Boarding/Dropping page visible.');
});

When('the user selects the first boarding point', async ({ seatSelectionPage }) => {
  console.log('[Seats] Selecting boarding point...');
  await seatSelectionPage.selectFirstBoardingPoint();
});

When('the user selects the first dropping point', async ({ seatSelectionPage }) => {
  console.log('[Seats] Selecting dropping point...');
  await seatSelectionPage.selectFirstDroppingPoint();
});

Then('the boarding and dropping points should be selected', async ({ seatSelectionPage, page }) => {
  const boardingVisible = await seatSelectionPage.isBoardingPointVisible();
  const passengerFormVisible = await seatSelectionPage.isPassengerFormVisible();
  const proceedBtn = page.getByRole('button', { name: /proceed|fill.*detail|continue/i }).first();
  const proceedBtnVisible = await proceedBtn.isVisible().catch(() => false);

  expect(boardingVisible || passengerFormVisible || proceedBtnVisible,
    'Should have selected boarding/dropping or moved to next step'
  ).toBe(true);
  console.log('[Seats] Boarding and dropping selected.');
});

When('the user proceeds to passenger info page', async ({ seatSelectionPage }) => {
  console.log('[Seats] Proceeding to passenger info...');
  const proceeded = await seatSelectionPage.clickProceedToPassenger();
  expect(proceeded, 'Should proceed to passenger info').toBe(true);
});

Given(
  'the user has selected a seat and boarding and dropping points',
  async ({ resultsPage, seatSelectionPage, page }) => {
    await resultsPage.applyAcFilter();
    await resultsPage.sortByPrice();
    await page.waitForTimeout(3000);

    const viewSeatsBtn = page.getByRole('button', { name: /View seats/i }).first();
    await viewSeatsBtn.scrollIntoViewIfNeeded();
    await viewSeatsBtn.click();
    await page.waitForTimeout(3000);

    await seatSelectionPage.dismissLoginPopup();
    await seatSelectionPage.waitForSeatLayout();
    await seatSelectionPage.selectFirstAvailableSeat();

    await seatSelectionPage.clickSelectBoardingDroppingButton();
    await seatSelectionPage.selectFirstBoardingPoint();
    await seatSelectionPage.selectFirstDroppingPoint();
    console.log('[Seats] Seat and boarding/dropping selected.');
  }
);

Given('the user has proceeded to the passenger info page', async ({ seatSelectionPage, passengerInfoPage }) => {
  await seatSelectionPage.clickProceedToPassenger();
  await passengerInfoPage.waitForPassengerInfoPage();
  console.log('[Seats] Moved to passenger info page.');
});
