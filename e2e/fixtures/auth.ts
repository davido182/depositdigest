import { test as base, expect, Page } from '@playwright/test';

// AuthFixture class for E2E tests
export class AuthFixture {
  constructor(private page: Page) {}

  async login(email: string = 'test@example.com', password: string = 'testpassword123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }
}

// Define test fixtures for authentication
export const test = base.extend<{
  authenticatedPage: Page;
  auth: AuthFixture;
}>({
  auth: async ({ page }, use) => {
    const auth = new AuthFixture(page);
    await use(auth);
  },
  
  authenticatedPage: async ({ page }, use) => {
    const auth = new AuthFixture(page);
    await auth.login();
    await use(page);
  },
});

export { expect } from '@playwright/test';