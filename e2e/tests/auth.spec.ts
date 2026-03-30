import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { setupAuthMocks, setupAuthenticatedApp, MOCK_TOKEN, MOCK_USER } from '../fixtures/api-mocks';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth');
  });

  test('shows the auth page with LOGIN and SIGN UP tabs', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(auth.loginTab).toBeVisible();
    await expect(auth.signupTab).toBeVisible();
    await expect(page.getByText('AUTHENTICATION REQUIRED')).toBeVisible();
    await expect(auth.submitButton).toBeVisible();
  });

  test('login tab is active by default', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    // Username field only appears on sign-up
    await expect(auth.usernameInput).not.toBeVisible();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
  });

  test('sign-up tab shows username field', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.signupTab.click();
    await expect(auth.usernameInput).toBeVisible();
  });

  test('submit button shows loading text while authenticating', async ({ page }) => {
    // Delay the mock response to see loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ json: { token: MOCK_TOKEN, user: MOCK_USER } });
    });
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ json: MOCK_USER })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.emailInput.fill('test@momentum.ai');
    await auth.passwordInput.fill('password123');
    await auth.submitButton.click();

    await expect(page.getByText('AUTHENTICATING…')).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await setupAuthMocks(page);
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('test@momentum.ai', 'password123');

    await expect(page).toHaveURL('/');
  });

  test('successful signup redirects to dashboard', async ({ page }) => {
    await setupAuthMocks(page);
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.signup('testuser', 'test@momentum.ai', 'password123');

    await expect(page).toHaveURL('/');
  });

  test('login shows error on invalid credentials', async ({ page }) => {
    // Use 400 (not 401) to avoid the interceptor redirect
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 400, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('login shows error on 401 invalid credentials', async ({ page }) => {
    // With the app bug fixed, 401 from /auth/login should NOT redirect
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    // Should stay on /auth, not redirect
    await expect(page).toHaveURL('/auth');
  });

  test('signup shows error when email already taken', async ({ page }) => {
    await page.route('**/api/auth/signup', (route) =>
      route.fulfill({ status: 409, json: { error: 'Email already registered' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.signup('newuser', 'taken@test.com', 'password123');

    await expect(page.getByText('Email already registered')).toBeVisible();
  });

  test('error clears when switching tabs', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 400, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');
    await expect(page.getByText('Invalid credentials')).toBeVisible();

    await auth.signupTab.click();
    await expect(page.getByText('Invalid credentials')).not.toBeVisible();
  });

  test('password field requires minimum 6 characters (HTML5 validation)', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.emailInput.fill('test@momentum.ai');
    await auth.passwordInput.fill('12345'); // 5 chars — under minLength
    await auth.submitButton.click();

    const validityState = await auth.passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.tooShort
    );
    expect(validityState).toBe(true);
  });

  test('already-authenticated users are redirected from /auth to dashboard', async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/auth');
    await expect(page).toHaveURL('/');
  });

  test('Google OAuth button exists and triggers alert', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('OAuth');
      await dialog.dismiss();
    });

    await auth.googleButton.click();
  });

  test('GitHub OAuth button exists and triggers alert', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('OAuth');
      await dialog.dismiss();
    });

    await auth.githubButton.click();
  });

  test('MOMENTUM branding visible in left panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(page.getByText('DISCIPLINE').first()).toBeVisible();
  });
});
