import { getSession } from './utils/db';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  try {
    const sessionData = await getSession('redbus-session');
    if (sessionData) {
      const destDir = '/home/keval.buch@simform.dom/.gemini/antigravity/brain/ab93eae6-bc62-4f4e-8a47-0c840876e76c/browser';
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const destPath = path.join(destDir, 'session.json');
      fs.writeFileSync(destPath, sessionData, 'utf-8');
      console.log('Successfully wrote session to:', destPath);
    } else {
      console.log('No session found in database.');
    }
  } catch (err) {
    console.error('Error dumping session:', err);
  }
}

run();
