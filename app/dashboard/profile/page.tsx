import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ProfileContent } from './_components/profile-content';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: { companies: true, activityLogs: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Get recent activity
  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: user.id },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ProfileContent
      user={JSON.parse(JSON.stringify(user))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
    />
  );
}
