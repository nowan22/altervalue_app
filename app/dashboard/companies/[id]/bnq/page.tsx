import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BnqContent } from './_components/bnq-content';

export default async function BnqPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      documents: {
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
      },
      workflowSteps: {
        include: { tasks: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { stepNumber: 'asc' },
      },
      bnqProgress: true,
    },
  });

  if (!company) {
    notFound();
  }

  // Get all document types
  const documentTypes = await prisma.documentType.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <BnqContent
      company={JSON.parse(JSON.stringify(company))}
      documentTypes={JSON.parse(JSON.stringify(documentTypes))}
    />
  );
}
