import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('momentum_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 for protected endpoints — not auth endpoints themselves
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('momentum_token');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  deleteAccount: () => api.delete('/auth/account'),
};

// Habits
export const habitsApi = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  remove: (id) => api.delete(`/habits/${id}`),
};

// Logs
export const logsApi = {
  getByDate: (date) => api.get(`/logs?date=${date}`),
  upsert: (data) => api.post('/logs', data),
};

// Analytics
export const analyticsApi = {
  streaks: () => api.get('/analytics/streaks'),
  completion: (period) => api.get(`/analytics/completion?period=${period}`),
  heatmap: () => api.get('/analytics/heatmap'),
  insights: () => api.get('/analytics/insights'),
};

export default api;
