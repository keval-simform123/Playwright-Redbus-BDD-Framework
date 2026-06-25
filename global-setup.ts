import { firefox, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getSession, saveSession, closePool } from './utils/db';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const SESSION_FILE = path.join(__dirname, 'playwright/.auth/session.json');

async function globalSetup(config: FullConfig) {
  console.log('\n[Global Setup] Starting...');
  const authDir = path.dirname(SESSION_FILE);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // try loading saved session from DB first
  try {
    const storedSession = await getSession('redbus-session');
    if (storedSession) {
      fs.writeFileSync(SESSION_FILE, storedSession, 'utf-8');
      console.log(`[Global Setup] Restored session from DB.`);
      await closePool();
      return;
    }
  } catch (dbError) {
    console.error('[Global Setup] DB session fetch failed:', dbError);
  }

  // no saved session — open browser to create one
  const baseURL = process.env.BASE_URL || 'https://www.redbus.in';
  const browser = await firefox.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[Global Setup] Homepage loaded.');
  } catch (error) {
    console.warn('[Global Setup] Homepage load issue:', error);
  }

  // save cookies/storage for reuse
  await context.storageState({ path: SESSION_FILE });
  console.log(`[Global Setup] Session saved to ${SESSION_FILE}`);
  await browser.close();

  // persist new session to DB
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const sessionContent = fs.readFileSync(SESSION_FILE, 'utf-8');
      await saveSession('redbus-session', sessionContent);
    }
  } catch (dbError) {
    console.error('[Global Setup] DB save failed:', dbError);
  } finally {
    await closePool();
  }

  console.log('[Global Setup] Done.\n');
}

export default globalSetup;