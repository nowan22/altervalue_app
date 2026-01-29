import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AlertConfigContent } from './_components/alert-config-content';

export default async function AlertConfigPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as any).role;
  
  // Only SUPER_ADMIN and EXPERT can configure alerts
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'EXPERT') {
    redirect('/dashboard/alerts');
  }

  return <AlertConfigContent />;
}
