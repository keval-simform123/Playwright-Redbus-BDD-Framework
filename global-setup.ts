import { firefox, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// auth state 
export const SESSION_FILE = path.join(__dirname, 'playwright/.auth/session.json');

async function globalSetup(config: FullConfig) {
  console.log('\n[Global Setup] Starting pre-suite setup...');
  const authDir = path.dirname(SESSION_FILE);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseURL = process.env.BASE_URL || 'https://www.redbus.in';
  const browser = await firefox.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log(`[Global Setup] Navigating to ${baseURL} to establish a session...`);

  try {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[Global Setup] Homepage loaded successfully.');
  }
  catch (error) {
    console.warn('[Global Setup] Warning: Could not fully load homepage.', error);
  }

  // save session cookies/storage to reuse
  await context.storageState({ path: SESSION_FILE });
  console.log(`[Global Setup] Session state saved to ${SESSION_FILE}`);
  await browser.close();
  console.log('[Global Setup] Setup complete.\n');
}

export default globalSetup;