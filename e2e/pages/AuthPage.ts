import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly loginTab: Locator;
  readonly signupTab: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly googleButton: Locator;
  readonly githubButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Tab switcher uses role="tab" — disambiguates from the form submit
    // button, which may also have the label "Sign in".
    this.loginTab = page.getByRole('tab', { name: /sign in/i });
    this.signupTab = page.getByRole('tab', { name: /sign up/i });
    // Inputs identified by name attribute — resilient to label text changes
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.usernameInput = page.locator('input[name="username"]');
    // The form submit is the only submit button on the page
    this.submitButton = page.locator('form button[type="submit"]');
    // Error message uses role="alert" in the Auth form
    this.errorMessage = page.getByRole('alert');
    this.googleButton = page.getByRole('button', { name: /continue with google/i });
    this.githubButton = page.getByRole('button', { name: /continue with github/i });
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async login(email: string, password: string) {
    await this.loginTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signup(username: string, email: string, password: string) {
    await this.signupTab.click();
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
