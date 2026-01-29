import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { MyMissionWrapper } from './_components/my-mission-wrapper';

export default async function MyMissionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  return <MyMissionWrapper userId={userId} userRole={userRole} />;
}
