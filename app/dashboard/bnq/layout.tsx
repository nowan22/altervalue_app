import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BnqLayoutClient } from './_components/bnq-layout-client';

export default async function BnqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Fetch companies based on user role
  let companies;
  
  if (userRole === 'SUPER_ADMIN' || userRole === 'EXPERT') {
    // Super-Admin and Expert see all their companies + demo
    companies = await prisma.company.findMany({
      where: {
        OR: [
          { userId },
          { isDemo: true },
        ],
      },
      select: {
        id: true,
        name: true,
        bnqProgress: {
          select: {
            targetLevel: true,
            currentProgress: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } else {
    // Pilote and Observateur only see their assigned mission
    const assignments = await prisma.missionAssignment.findMany({
      where: { userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            bnqProgress: {
              select: {
                targetLevel: true,
                currentProgress: true,
              },
            },
          },
        },
      },
    });
    companies = assignments.map(a => a.company);
  }

  return (
    <BnqLayoutClient companies={companies} userRole={userRole}>
      {children}
    </BnqLayoutClient>
  );
}
