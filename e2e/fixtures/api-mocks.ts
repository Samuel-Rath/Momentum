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
    color: '#1E3A5F',
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
    color: '#8A6F3D',
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
    color: '#2C6E4F',
    icon: '🧘',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// Shape matches what the server `/api/logs?date=...` route returns: a habit
// payload with an embedded `log` (or null) for that date.
export const MOCK_LOGS = [
  {
    id: 1,
    name: 'Morning Run',
    category: 'health',
    frequency: 'daily',
    color: '#1E3A5F',
    icon: '🏃',
    log: { completed: false, notes: null },
  },
  {
    id: 2,
    name: 'Deep Work',
    category: 'productivity',
    frequency: 'daily',
    color: '#8A6F3D',
    icon: '💻',
    log: { completed: true, notes: 'Focused 2 hours on project X' },
  },
  {
    id: 3,
    name: 'Meditation',
    category: 'mindfulness',
    frequency: 'daily',
    color: '#2C6E4F',
    icon: '🧘',
    log: { completed: false, notes: null },
  },
];

export const MOCK_STREAKS = [
  { id: 1, name: 'Morning Run', icon: '🏃', color: '#1E3A5F', currentStreak: 7, longestStreak: 14 },
  { id: 2, name: 'Deep Work', icon: '💻', color: '#8A6F3D', currentStreak: 21, longestStreak: 30 },
  { id: 3, name: 'Meditation', icon: '🧘', color: '#2C6E4F', currentStreak: 3, longestStreak: 10 },
];

// Shape matches `completionByPeriod` service output: array of daily buckets
// with { label, rate, total }. The Dashboard averages over days where total>0.
export const MOCK_COMPLETION = [
  { label: 'Mon, Jan 01', rate: 67, total: 3 },
  { label: 'Tue, Jan 02', rate: 100, total: 3 },
  { label: 'Wed, Jan 03', rate: 33, total: 3 },
  { label: 'Thu, Jan 04', rate: 100, total: 3 },
  { label: 'Fri, Jan 05', rate: 67, total: 3 },
  { label: 'Sat, Jan 06', rate: 0, total: 3 },
  { label: 'Sun, Jan 07', rate: 33, total: 3 },
];

// Shape matches `heatmapData` output: array of { date, rate } (rate is 0..1).
export const MOCK_HEATMAP = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0],
  rate: Math.random(),
}));

// Shape matches `generateInsights` output: { type, icon, text } where
// type is 'positive' | 'warning' | 'info'.
export const MOCK_INSIGHTS = [
  { type: 'positive', icon: '🌟', text: 'You perform best on Mondays — 95% completion rate.' },
  { type: 'info', icon: '📅', text: 'Your momentum is improving week over week.' },
];

// Shape matches `buildPerformanceReport` output. Used by the Analytics
// Performance Board so the component renders in tests instead of hanging
// on a missing fetch.
export const MOCK_PERFORMANCE = {
  period: { days: 30, start: '2024-01-01', end: '2024-01-30' },
  summary: {
    avgRate: 0.72,
    totalCompleted: 65,
    totalLogs: 90,
    trackedDays: 28,
    perfectDays: 12,
    delta: 0.08,
    prevRate: 0.64,
    activeHabits: 3,
  },
  dayOfWeek: [
    { day: 'Sun', idx: 0, completed: 6, total: 10, rate: 0.6 },
    { day: 'Mon', idx: 1, completed: 11, total: 12, rate: 0.92 },
    { day: 'Tue', idx: 2, completed: 9, total: 12, rate: 0.75 },
    { day: 'Wed', idx: 3, completed: 10, total: 13, rate: 0.77 },
    { day: 'Thu', idx: 4, completed: 9, total: 13, rate: 0.69 },
    { day: 'Fri', idx: 5, completed: 8, total: 13, rate: 0.62 },
    { day: 'Sat', idx: 6, completed: 6, total: 17, rate: 0.35 },
  ],
  bestDow: { day: 'Mon', idx: 1, completed: 11, total: 12, rate: 0.92 },
  worstDow: { day: 'Sat', idx: 6, completed: 6, total: 17, rate: 0.35 },
  categories: [
    { category: 'productivity', habits: 1, completed: 25, total: 30, rate: 0.83 },
    { category: 'health', habits: 1, completed: 22, total: 30, rate: 0.73 },
    { category: 'mindfulness', habits: 1, completed: 18, total: 30, rate: 0.6 },
  ],
  weeks: Array.from({ length: 8 }, (_, i) => ({
    label: `W${i + 1}`,
    start: '2024-01-01',
    end: '2024-01-07',
    rate: 0.6 + i * 0.02,
    ma: 0.6 + i * 0.015,
    total: 21,
    completed: Math.round((0.6 + i * 0.02) * 21),
  })),
  habits: [
    {
      id: 1, name: 'Morning Run', category: 'health', color: '#1E3A5F', icon: '🏃',
      total: 30, completed: 22, rate: 0.73, consistency: 0.81, trend: 0.05, score: 0.7, lastActive: 0,
    },
    {
      id: 2, name: 'Deep Work', category: 'productivity', color: '#8A6F3D', icon: '💻',
      total: 30, completed: 25, rate: 0.83, consistency: 0.88, trend: 0.1, score: 0.78, lastActive: 0,
    },
    {
      id: 3, name: 'Meditation', category: 'mindfulness', color: '#2C6E4F', icon: '🧘',
      total: 30, completed: 18, rate: 0.6, consistency: 0.65, trend: -0.12, score: 0.5, lastActive: 1,
    },
  ],
  atRisk: [
    {
      id: 3, name: 'Meditation', category: 'mindfulness', color: '#2C6E4F', icon: '🧘',
      total: 30, completed: 18, rate: 0.6, consistency: 0.65, trend: -0.12, score: 0.5, lastActive: 1,
    },
  ],
};

/** Mocks for the auth endpoints plus a few dashboard endpoints to prevent
 *  unauthenticated 401 redirects during post-login navigation assertions. */
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
  await page.route('**/api/logs*', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/analytics/streaks', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/analytics/completion*', (route) => route.fulfill({ json: [] }));
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
  // Mutable working copy inside this closure so POST/PUT/DELETE mutations
  // persist across requests within a single test.
  let state = [...habits];

  await page.route('**/api/habits', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: state });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const newHabit = {
        id: Date.now(),
        userId: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        ...body,
      };
      state = [...state, newHabit];
      await route.fulfill({ json: newHabit });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/habits/*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const id = parseInt(url.split('/').pop() || '0', 10);
    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const updated = { ...(state.find((h) => h.id === id) || {}), ...body };
      state = state.map((h) => (h.id === id ? updated : h));
      await route.fulfill({ json: updated });
    } else if (method === 'DELETE') {
      state = state.filter((h) => h.id !== id);
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
      await route.fulfill({ json: { id: Date.now(), ...body } });
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
  await page.route('**/api/analytics/performance*', (route) =>
    route.fulfill({ json: MOCK_PERFORMANCE })
  );
}
