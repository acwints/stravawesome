import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ActivityCharts from '@/components/activities/ActivityCharts';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return <ActivityCharts />;
} 