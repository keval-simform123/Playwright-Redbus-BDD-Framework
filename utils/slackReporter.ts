import { Reporter, FullResult } from '@playwright/test/reporter';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

class SlackReporter implements Reporter {
  async onEnd(result: FullResult) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('[Slack Reporter] SLACK_WEBHOOK_URL is not set. Skipping Slack notification for this run.');
      return;
    }

    const status = result.status; // 'passed' | 'failed' | 'timedout' | 'interrupted'
    let color = '#36a64f';
    let statusText = 'Playwright Tests Passed';

    if (status !== 'passed') {
      color = '#ec5e5e';
      statusText = 'Playwright Tests Failed';
    }

    const payload = {
      attachments: [
        {
          color: color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${statusText} (Local Run)`,
              }
            },
          ]
        }
      ]
    };

    try {
      console.log('[Slack Reporter] Sending local run notification to Slack...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error(`[Slack Reporter] Failed to send notification: ${response.status} ${response.statusText}`);
      } else {
        console.log('[Slack Reporter] Local run notification sent to Slack successfully.');
      }
    } catch (error) {
      console.error('[Slack Reporter] Error sending Slack notification:', error);
    }
  }
}

export default SlackReporter;
