import { StravaActivity, Goal, AIChatResponse } from '@/types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function fetchActivities(): Promise<StravaActivity[]> {
  return fetchJson<StravaActivity[]>('/api/strava/activities');
}

export async function fetchGoals(): Promise<Goal[]> {
  return fetchJson<Goal[]>('/api/goals');
}

export async function updateGoals(goals: Omit<Goal, 'id' | 'userId' | 'year'>[]): Promise<Goal[]> {
  return fetchJson<Goal[]>('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goals),
  });
}

export async function connectStrava(code: string): Promise<void> {
  const response = await fetch(`/api/strava/callback?code=${code}`);
  if (!response.ok) {
    throw new Error('Failed to connect Strava account');
  }
}

export async function sendAIMessage(message: string): Promise<AIChatResponse> {
  return fetchJson<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
} 