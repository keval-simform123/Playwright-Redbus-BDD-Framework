import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SESSION_FILE = path.join(__dirname, 'playwright/.auth/session.json');

async function globalTeardown(config: FullConfig) {
  console.log('\n[Global Teardown] Cleaning up after test suite...');
  // delete sessions
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
    console.log('[Global Teardown] Session file removed.');
  }
  console.log('[Global Teardown] All done. Check playwright-report/ for the HTML report.\n');
}

export default globalTeardown;
