import { Page } from '@playwright/test';

export const MOCK_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@momentum.ai',
};

export const MOCK_TOKEN = 'mock.jwt.token';

export const MOCK_HABITS = [
  {
    id: 1,
    userId: 1,
    name: 'Morning Run',
    category: 'health',
    frequency: 'daily',
    color: '#F97316',
    icon: '🏃',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    name: 'Deep Work',
    category: 'productivity',
    frequency: 'daily',
    color: '#3B82F6',
    icon: '💻',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    userId: 1,
    name: 'Meditation',
    category: 'mindfulness',
    frequency: 'daily',
    color: '#8B5CF6',
    icon: '🧘',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const MOCK_LOGS = [
  {
    id: 1,
    userId: 1,
    name: 'Morning Run',
    category: 'health',
    frequency: 'daily',
    color: '#F97316',
    icon: '🏃',
    log: { completed: false, notes: null },
  },
  {
    id: 2,
    userId: 1,
    name: 'Deep Work',
    category: 'productivity',
    frequency: 'daily',
    color: '#3B82F6',
    icon: '💻',
    log: { completed: true, notes: 'Focused 2 hours on project X' },
  },
  {
    id: 3,
    userId: 1,
    name: 'Meditation',
    category: 'mindfulness',
    frequency: 'daily',
    color: '#8B5CF6',
    icon: '🧘',
    log: { completed: false, notes: null },
  },
];

export const MOCK_STREAKS = [
  { id: 1, name: 'Morning Run', currentStreak: 7, longestStreak: 14 },
  { id: 2, name: 'Deep Work', currentStreak: 21, longestStreak: 30 },
  { id: 3, name: 'Meditation', currentStreak: 3, longestStreak: 10 },
];

export const MOCK_COMPLETION = {
  daily: [
    { date: '2024-01-01', completed: 2, total: 3 },
    { date: '2024-01-02', completed: 3, total: 3 },
  ],
};

export const MOCK_HEATMAP = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
  count: Math.floor(Math.random() * 4),
}));

export const MOCK_INSIGHTS = [
  { type: 'best_day', message: 'Your best day is Monday with 95% completion.' },
  { type: 'momentum', message: 'Your momentum is improving.' },
];

/** Set up routes that intercept all API calls with mock data */
export async function setupAuthMocks(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: MOCK_USER })
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ json: { token: MOCK_TOKEN, user: MOCK_USER } })
  );
  await page.route('**/api/auth/signup', (route) =>
    route.fulfill({ json: { token: MOCK_TOKEN, user: MOCK_USER } })
  );
  // Stub Dashboard API calls so a running backend can't 401 and redirect back to /auth
  await page.route('**/api/logs*', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/analytics/streaks', (route) => route.fulfill({ json: [] }));
}

/** Inject a token so the app treats the user as logged in */
export async function setAuthToken(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('momentum_token', token);
  }, MOCK_TOKEN);
}

/** Full authenticated app setup: token + all API mocks */
export async function setupAuthenticatedApp(page: Page) {
  await setAuthToken(page);
  await setupAuthMocks(page);
  await setupHabitsMocks(page);
  await setupAnalyticsMocks(page);
}

export async function setupHabitsMocks(page: Page, habits = MOCK_HABITS) {
  await page.route('**/api/habits', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: habits });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const newHabit = { id: Date.now(), userId: 1, isActive: true, createdAt: new Date().toISOString(), ...body };
      habits = [...habits, newHabit];
      await route.fulfill({ json: newHabit });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/habits/*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const id = parseInt(url.split('/').pop() || '0');
    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const updated = { ...(habits.find((h) => h.id === id) || {}), ...body };
      habits = habits.map((h) => (h.id === id ? updated : h));
      await route.fulfill({ json: updated });
    } else if (method === 'DELETE') {
      habits = habits.filter((h) => h.id !== id);
      await route.fulfill({ json: { success: true } });
    } else {
      await route.continue();
    }
  });
}

export async function setupAnalyticsMocks(page: Page) {
  await page.route('**/api/logs*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: MOCK_LOGS });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({ json: { ...body, id: Date.now() } });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/analytics/streaks', (route) =>
    route.fulfill({ json: MOCK_STREAKS })
  );
  await page.route('**/api/analytics/completion*', (route) =>
    route.fulfill({ json: MOCK_COMPLETION })
  );
  await page.route('**/api/analytics/heatmap', (route) =>
    route.fulfill({ json: MOCK_HEATMAP })
  );
  await page.route('**/api/analytics/insights', (route) =>
    route.fulfill({ json: MOCK_INSIGHTS })
  );
}
