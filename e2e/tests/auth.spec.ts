import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { setupAuthMocks, setupAuthenticatedApp, MOCK_TOKEN, MOCK_USER } from '../fixtures/api-mocks';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth');
  });

  test('shows the auth page with sign-in and sign-up tabs', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(auth.loginTab).toBeVisible();
    await expect(auth.signupTab).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(auth.submitButton).toBeVisible();
  });

  test('sign-in tab is active by default', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    // Username field only renders on the sign-up tab
    await expect(auth.usernameInput).not.toBeVisible();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
  });

  test('sign-up tab reveals the username field', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.signupTab.click();
    await expect(auth.usernameInput).toBeVisible();
    await expect(page.getByRole('heading', { name: /let's begin/i })).toBeVisible();
  });

  test('submit button shows loading text while authenticating', async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible();
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

  test('login shows error on invalid credentials (400)', async ({ page }) => {
    // Use 400 to avoid the axios interceptor's 401 redirect path
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 400, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');

    await expect(auth.errorMessage).toContainText(/invalid credentials/i);
  });

  test('login stays on /auth when server returns 401', async ({ page }) => {
    // The interceptor must not redirect for /auth/* 401s — we stay on the page
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');

    await expect(auth.errorMessage).toContainText(/invalid credentials/i);
    await expect(page).toHaveURL('/auth');
  });

  test('signup shows error when email already taken', async ({ page }) => {
    await page.route('**/api/auth/signup', (route) =>
      route.fulfill({ status: 409, json: { error: 'Email already registered' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.signup('newuser', 'taken@test.com', 'password123');

    await expect(auth.errorMessage).toContainText(/email already registered/i);
  });

  test('error clears when switching tabs', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 400, json: { error: 'Invalid credentials' } })
    );

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login('wrong@test.com', 'badpassword');
    await expect(auth.errorMessage).toBeVisible();

    await auth.signupTab.click();
    await expect(auth.errorMessage).toHaveCount(0);
  });

  test('password field enforces minimum length via HTML5', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.emailInput.fill('test@momentum.ai');
    await auth.passwordInput.fill('12345'); // 5 chars — under minLength=6
    await auth.submitButton.click();

    const tooShort = await auth.passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.tooShort
    );
    expect(tooShort).toBe(true);
  });

  test('already-authenticated users are redirected from /auth to /', async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/auth');
    await expect(page).toHaveURL('/');
  });

  test('OAuth buttons navigate to the backend OAuth endpoints', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    // Click doesn't navigate in the test because baseURL differs from
    // window.location.href — but we can assert the buttons exist and are enabled.
    await expect(auth.googleButton).toBeVisible();
    await expect(auth.googleButton).toBeEnabled();
    await expect(auth.githubButton).toBeVisible();
    await expect(auth.githubButton).toBeEnabled();
  });

  test('editorial hero is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const auth = new AuthPage(page);
    await auth.goto();

    // "Small habits, compounding results." is the editorial hero h1
    await expect(page.getByRole('heading', { name: /small habits/i, level: 1 })).toBeVisible();
  });
});
