import { test, expect } from '@playwright/test';
import { saveSession, getSession, deleteSession, closePool } from '../utils/db';

test.describe('Database Session Integration Tests', () => {

  test.afterAll(async () => {
    // Make sure we close the pool after all tests run
    await closePool();
  });

  test('should successfully save, retrieve, and delete session in local database', async () => {
    const testSessionId = 'test-playwright-session-' + Date.now();
    const testSessionData = JSON.stringify({
      cookies: [
        {
          name: 'test_cookie',
          value: 'test_value',
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax'
        }
      ],
      origins: []
    });

    // 1. Save the test session
    await saveSession(testSessionId, testSessionData);

    // 2. Retrieve the test session
    const retrievedData = await getSession(testSessionId);
    expect(retrievedData).not.toBeNull();
    expect(retrievedData).toBe(testSessionData);

    // 3. Verify values inside retrieved JSON
    const parsedData = JSON.parse(retrievedData!);
    expect(parsedData.cookies[0].name).toBe('test_cookie');
    expect(parsedData.cookies[0].value).toBe('test_value');

    // 4. Delete the test session
    await deleteSession(testSessionId);

    // 5. Verify it is deleted
    const deletedData = await getSession(testSessionId);
    expect(deletedData).toBeNull();
  });
});
