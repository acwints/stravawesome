import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ActivityCharts from '@/components/activities/ActivityCharts';

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  return <ActivityCharts />;
} 