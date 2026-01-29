import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ExpertsContent } from './_components/experts-content';

export default async function ExpertsPage() {
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

  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { 
            companies: true,
            missionAssignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        sector: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <ExpertsContent 
      initialUsers={JSON.parse(JSON.stringify(users))} 
      allCompanies={JSON.parse(JSON.stringify(companies))}
    />
  );
}
