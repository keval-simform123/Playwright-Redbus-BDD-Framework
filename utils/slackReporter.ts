import { Reporter, FullResult } from '@playwright/test/reporter';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

class SlackReporter implements Reporter {
  async onEnd(result: FullResult) {
    // Skip if running inside GitHub Actions CI environment
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log('[Slack Reporter] Running in CI. Skipping local Slack reporter.');
      return;
    }

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

    // Trigger GitHub Actions workflow
    let actionRunUrl = '';
    let triggerStatus = 'Not Triggered';
    try {
      console.log('[Slack Reporter] Triggering GitHub Actions workflow via gh CLI...');
      const output = execSync('gh workflow run playwright.yml').toString();
      const match = output.match(/https:\/\/github\.com\/[^\s]+/);
      if (match) {
        actionRunUrl = match[0];
        triggerStatus = `CI Triggered: <${actionRunUrl}|View Run >`;
        console.log(`[Slack Reporter] GitHub Actions workflow triggered successfully: ${actionRunUrl}`);
      } else {
        triggerStatus = 'Triggered, but URL could not be parsed.';
        console.log('[Slack Reporter] GitHub Actions workflow triggered, but no URL found in output.');
      }
    } catch (e) {
      triggerStatus = 'Failed to trigger via gh CLI.';
      console.error('[Slack Reporter] Failed to trigger GitHub Actions workflow:', e);
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
                { type: 'mrkdwn', text: `*Local Duration:*\n${(result.duration / 1000).toFixed(2)}s` },
                { type: 'mrkdwn', text: `*GitHub Actions:*\n${triggerStatus}` }
              ]
            }
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
