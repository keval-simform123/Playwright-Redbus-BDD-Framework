import { firefox, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getSession, saveSession, closePool } from './utils/db';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// auth state 
export const SESSION_FILE = path.join(__dirname, 'playwright/.auth/session.json');

async function globalSetup(config: FullConfig) {
  console.log('\n[Global Setup] Starting pre-suite setup...');
  const authDir = path.dirname(SESSION_FILE);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 1. Try to load session from database first
  try {
    const storedSession = await getSession('redbus-session');
    if (storedSession) {
      fs.writeFileSync(SESSION_FILE, storedSession, 'utf-8');
      console.log(`[Global Setup] Restored session from database into ${SESSION_FILE}.`);
      console.log('[Global Setup] Skipping browser setup since a valid session exists in DB.\n');
      await closePool();
      return;
    }
  } catch (dbError) {
    console.error('[Global Setup] Warning: Failed to retrieve session from database.', dbError);
  }

  // 2. Otherwise establish new session by navigating
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

  // 3. Save new session to database
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const sessionContent = fs.readFileSync(SESSION_FILE, 'utf-8');
      await saveSession('redbus-session', sessionContent);
    }
  } catch (dbError) {
    console.error('[Global Setup] Warning: Failed to save session to database.', dbError);
  } finally {
    await closePool();
  }

  console.log('[Global Setup] Setup complete.\n');
}

export default globalSetup;