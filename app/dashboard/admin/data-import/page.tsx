import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DataImportContent } from './_components/data-import-content';

export default async function DataImportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  // Only SUPER_ADMIN can access this page
  const userRole = (session.user as any).role;
  if (userRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all companies for the selector
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      sector: true,
      isDemo: true,
    },
    orderBy: { name: 'asc' },
  });

  return <DataImportContent companies={companies} />;
}
