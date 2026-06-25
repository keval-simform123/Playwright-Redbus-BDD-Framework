import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SESSION_FILE = path.join(__dirname, 'playwright/.auth/session.json');

async function globalTeardown(config: FullConfig) {
  console.log('\n[Teardown] Cleaning up...');
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
    console.log('[Teardown] Session file removed.');
  }
  console.log('[Teardown] Done. Check playwright-report/ for results.\n');
}

export default globalTeardown;
