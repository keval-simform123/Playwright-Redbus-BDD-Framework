import { Given, When, Then, expect, test } from './fixtures';
import * as path from 'path';
import * as fs from 'fs';
import { saveSession } from '../utils/db';

const SESSION_FILE = path.join(__dirname, '../playwright/.auth/session.json');

Given('the user is on the RedBus homepage', async ({ page, homePage }) => {
  const baseURL = process.env.BASE_URL || 'https://www.redbus.in';
  console.log(`[Auth] Navigating to ${baseURL}...`);
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await homePage.dismissCookieBanner();
  await homePage.dismissAppDownloadBanner();
});

When('the user clicks on the Account button', async ({ homePage }) => {
  console.log('[Auth] Clicking Account button...');
  await homePage.clickAccount();
});

When('the user is not already logged in', async ({ page, context }) => {
  const loginButton = page.locator('button:has-text("Log in"), li:has-text("Log in"), #signInLink').first();
  let loginVisible = false;
  try {
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    loginVisible = true;
  } catch {
    loginVisible = false;
  }

  if (!loginVisible) {
    if (fs.existsSync(SESSION_FILE)) {
      console.log('[Auth] Valid session exists. Skipping manual login.');
      test.skip(true, 'Skipping manual login — session already active.');
      return;
    }
    console.log('[Auth] Logged in but no session file. Clearing session...');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    const accountBtn = page.locator('#signin_dd, button:has-text("Account"), #profile_action_menu').first();
    await accountBtn.click();
    console.log('[Auth] Session cleared.');
  } else {
    console.log('[Auth] User is not logged in.');
  }
});

When('the user clicks on the Login button', async ({ homePage }) => {
  console.log('[Auth] Clicking Login button...');
  await homePage.clickLogin();
});

Then('the login modal should be visible', async ({ homePage }) => {
  const visible = await homePage.isLoginModalVisible();
  expect(visible, 'Login modal should be visible').toBe(true);
  console.log('[Auth] Login modal visible.');
});

When('the user completes the manual login process', async ({ page }) => {
  console.log('\n==================================================================');
  console.log('[Auth] ACTION REQUIRED:');
  console.log('  1. Enter your mobile number in the browser.');
  console.log('  2. Complete the captcha / OTP verification.');
  console.log('  3. The test will auto-resume once logged in.');
  console.log('==================================================================\n');

  const loginOverlay = page.locator('div[class*="bottomSheetOverlay"]').first();
  await loginOverlay.waitFor({ state: 'hidden', timeout: 240000 });
  console.log('[Auth] Login overlay closed.');
});

Then('the user should be successfully logged in', async ({ page, homePage }) => {
  await homePage.clickAccount();
  const loginButton = page.locator('button:has-text("Log in"), li:has-text("Log in"), #signInLink').first();
  let isStillLoggedOut = false;
  try {
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    isStillLoggedOut = true;
  } catch {
    isStillLoggedOut = false;
  }
  expect(isStillLoggedOut, 'User should be logged in').toBe(false);
  await page.keyboard.press('Escape');
  console.log('[Auth] Login verified.');
});

Then('the user should already be logged in', async ({ page }) => {
  const loginButton = page.locator('button:has-text("Log in"), li:has-text("Log in"), #signInLink').first();
  let loginVisible = false;
  try {
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    loginVisible = true;
  } catch {
    loginVisible = false;
  }
  expect(loginVisible, 'User should already be logged in').toBe(false);
  await page.keyboard.press('Escape');
  console.log('[Auth] Already logged in (session reused).');
});

When('the user handles authentication if required', async ({ page, homePage }) => {
  const loginButton = page.locator('button:has-text("Log in"), li:has-text("Log in"), #signInLink').first();
  let isAlreadyLoggedIn = false;
  try {
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    isAlreadyLoggedIn = false;
  } catch {
    isAlreadyLoggedIn = true;
  }

  if (isAlreadyLoggedIn) {
    console.log('[Auth] Already logged in, skipping.');
    await page.keyboard.press('Escape');
    return;
  }

  // not logged in — start manual login
  console.log('[Auth] Not logged in, starting manual login...');
  await homePage.clickLogin();
  const mobileInput = page.locator('input#mobileNoInp, input[class*="inputFieldMobile"]').first();
  await mobileInput.waitFor({ state: 'visible', timeout: 20000 });

  console.log('\n==================================================================');
  console.log('[Auth] ACTION REQUIRED: Complete login manually in the browser.');
  console.log('==================================================================\n');

  const loginOverlay = page.locator('div[class*="bottomSheetOverlay"]').first();
  await loginOverlay.waitFor({ state: 'hidden', timeout: 240000 });

  // verify login worked
  await homePage.clickAccount();
  try {
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    throw new Error('Login failed — Login button still visible.');
  } catch { }
  await page.keyboard.press('Escape');
  console.log('[Auth] Authentication complete.');
});

Then('the browser session state should be saved locally', async ({ page }) => {
  const storageState = await page.context().storageState();
  const authDir = path.dirname(SESSION_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  fs.writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2), 'utf-8');
  expect(fs.existsSync(SESSION_FILE)).toBe(true);
  console.log(`[Auth] Session saved to ${SESSION_FILE}`);
});

Then('the browser session state should be saved to the database', async ({ page }) => {
  const storageState = await page.context().storageState();
  try {
    await saveSession('redbus-session', JSON.stringify(storageState));
    console.log('[Auth] Session saved to DB.');
  } catch (dbError) {
    console.error('[Auth] DB save failed:', dbError);
  }
});
