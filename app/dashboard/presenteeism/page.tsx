import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PresenteeismOverviewWrapper } from './_components/presenteeism-overview-wrapper';

export default async function PresenteeismOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  return <PresenteeismOverviewWrapper />;
}
