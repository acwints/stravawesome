import { redirect } from 'next/navigation';

export async function POST() {
  redirect('/api/auth/signin/strava');
}

export async function GET() {
  redirect('/api/auth/signin/strava');
} 