export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr) {
  // Appending T00:00:00 (no Z) keeps the Date in local time so the displayed
  // weekday/month match the stored date string rather than shifting by UTC offset.
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function getTodayString() {
  return formatDate(new Date());
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const CATEGORIES = [
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'productivity', label: 'Productivity', icon: '⚡' },
  { value: 'social', label: 'Social', icon: '🤝' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export const HABIT_COLORS = [
  '#F97316', '#EF4444', '#8B5CF6', '#3B82F6',
  '#22C55E', '#F59E0B', '#EC4899', '#14B8A6',
];

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];
