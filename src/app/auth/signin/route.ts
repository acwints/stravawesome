import { redirect } from 'next/navigation';

export async function POST() {
  redirect('/api/auth/signin');
} 