import { test, expect } from '@playwright/test';

test('auth flow and interview creation', async ({ page }) => {
  // 1. Go to Login
  await page.goto('http://localhost:5173/login');
  
  // 2. Click "Create one" to signup
  await page.click('text=Create one');
  await expect(page).toHaveURL(/\/signup/);

  // 3. Fill Signup Form
  await page.fill('input[placeholder="e.g. coder123"]', 'testuser');
  await page.fill('input[placeholder="you@example.com"]', 'test@test.com');
  await page.click('button:has-text("Get Started")');

  // 4. Should redirect to Dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('h1')).toContainText('Welcome, testuser');

  // 5. Create Interview
  await page.click('button:has-text("New Interview")');
  await expect(page).toHaveURL(/\/interview\/.*/);

  // 6. Check Interview Room Elements
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await expect(page.locator('button:has-text("Run")')).toBeVisible();
});
