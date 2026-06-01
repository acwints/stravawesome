const DEFAULT_STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE_URL = 'https://www.strava.com/oauth';

export const STRAVA_API_BASE_URL =
  process.env.STRAVA_API_BASE_URL || DEFAULT_STRAVA_API_BASE_URL;

export function stravaApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>): URL {
  const url = new URL(path.replace(/^\//, ''), `${STRAVA_API_BASE_URL.replace(/\/$/, '')}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

export function stravaOAuthUrl(path: string): string {
  return `${STRAVA_OAUTH_BASE_URL}/${path.replace(/^\//, '')}`;
}

export function stravaBasicAuthHeader(): string | null {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}
