import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ComparisonWrapper } from './_components/comparison-wrapper';

export default async function ComparisonPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  return <ComparisonWrapper />;
}
