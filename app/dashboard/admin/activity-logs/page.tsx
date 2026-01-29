import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ActivityLogsContent } from './_components/activity-logs-content';

export default async function ActivityLogsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Fetch initial logs (last 100)
  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  // Get unique users and companies for filters
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <ActivityLogsContent
      initialLogs={JSON.parse(JSON.stringify(logs))}
      users={JSON.parse(JSON.stringify(users))}
      companies={JSON.parse(JSON.stringify(companies))}
    />
  );
}
