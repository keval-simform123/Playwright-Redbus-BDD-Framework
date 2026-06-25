import { Reporter, FullResult } from '@playwright/test/reporter';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

class SlackReporter implements Reporter {
  async onEnd(result: FullResult) {
    // skip in CI — GitHub Actions has its own reporter
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log('[Slack] Skipping in CI environment.');
      return;
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('[Slack] No webhook URL set, skipping.');
      return;
    }

    const status = result.status;
    let color = '#36a64f';
    let statusText = 'Playwright Tests Passed';

    if (status !== 'passed') {
      color = '#ec5e5e';
      statusText = 'Playwright Tests Failed';
    }

    // trigger GitHub Actions workflow
    let actionRunUrl = '';
    let triggerStatus = 'Not Triggered';
    try {
      console.log('[Slack] Triggering GitHub Actions...');
      const output = execSync('gh workflow run playwright.yml').toString();
      const match = output.match(/https:\/\/github\.com\/[^\s]+/);
      if (match) {
        actionRunUrl = match[0];
        triggerStatus = `CI Triggered: <${actionRunUrl}|View Run >`;
        console.log(`[Slack] CI triggered: ${actionRunUrl}`);
      } else {
        triggerStatus = 'Triggered, URL not parsed.';
      }
    } catch (e) {
      triggerStatus = 'Failed to trigger.';
      console.error('[Slack] CI trigger failed:', e);
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
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Local Status:*\n${status.toUpperCase()}` },
                { type: 'mrkdwn', text: `*Duration:*\n${(result.duration / 1000).toFixed(2)}s` },
                { type: 'mrkdwn', text: `*GitHub Actions:*\n${triggerStatus}` }
              ]
            }
          ]
        }
      ]
    };

    try {
      console.log('[Slack] Sending notification...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error(`[Slack] Failed: ${response.status} ${response.statusText}`);
      } else {
        console.log('[Slack] Notification sent.');
      }
    } catch (error) {
      console.error('[Slack] Error:', error);
    }
  }
}

export default SlackReporter;
