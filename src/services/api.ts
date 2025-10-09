import { StravaActivity, Goal, AIChatResponse, StravaInsightsPayload } from '@/types';
import { ApiResponse, ApiSuccessResponse } from '@/lib/api-response';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    // Handle standardized error response
    const errorMessage = data.error || `HTTP error! status: ${response.status}`;
    throw new ApiError(errorMessage, response.status, data.code);
  }

  // Handle standardized success response
  if (typeof data === 'object' && data !== null && 'success' in data) {
    const typed = data as ApiResponse<T>;
    if (typed.success === true) {
      return (typed as ApiSuccessResponse<T>).data;
    }
    // If server incorrectly returned success flag with error shape but 2xx, throw
    const err = (typed as unknown as { error?: string; code?: string });
    throw new ApiError(err.error || 'Unexpected API error shape', response.status, err.code);
  }

  // Fallback for non-standardized responses
  return data;
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

export async function fetchInsights(): Promise<StravaInsightsPayload> {
  return fetchJson<StravaInsightsPayload>('/api/strava/insights');
}

export async function disconnectStrava(): Promise<void> {
  await fetchJson('/api/strava/disconnect', {
    method: 'POST',
  });
}
