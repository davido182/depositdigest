import { test, expect } from '@playwright/test';

test.describe('RentaFlux Application', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/RentaFlux/);
    
    // Check for main navigation or key elements
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link/button
    const loginButton = page.locator('text=Login').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login/);
    } else {
      // If no login button on landing, go directly to login
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
    }
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should show validation errors (this will depend on your implementation)
    // This is a placeholder - adjust based on your actual validation
    const errorMessage = page.locator('.error, [role="alert"], .text-red-500').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});