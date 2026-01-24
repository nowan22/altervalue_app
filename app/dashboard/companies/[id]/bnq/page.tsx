import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BnqContent } from './_components/bnq-content';
import { BNQ_DOCUMENT_TYPES, WORKFLOW_STEPS } from '@/lib/bnq-data';

export default async function BnqPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  // Check if company exists first
  const companyExists = await prisma.company.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!companyExists) {
    notFound();
  }

  // Initialize document types if they don't exist
  let documentTypes = await prisma.documentType.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  if (documentTypes.length === 0) {
    // Seed document types from BNQ_DOCUMENT_TYPES
    await prisma.documentType.createMany({
      data: BNQ_DOCUMENT_TYPES.map((dt) => ({
        code: dt.code,
        name: dt.name,
        description: dt.description,
        category: dt.category,
        bnqArticle: dt.bnqArticle,
        requiredForLevel: dt.requiredForLevel,
        isOptional: dt.isOptional,
        revisionFrequency: dt.revisionFrequency,
        sortOrder: dt.sortOrder,
      })),
      skipDuplicates: true,
    });
    documentTypes = await prisma.documentType.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Initialize workflow steps for this company if they don't exist
  const existingWorkflowSteps = await prisma.workflowStep.findMany({
    where: { companyId: id },
    select: { id: true },
  });

  if (existingWorkflowSteps.length === 0) {
    // Create workflow steps and their tasks
    for (const step of WORKFLOW_STEPS) {
      const createdStep = await prisma.workflowStep.create({
        data: {
          companyId: id,
          stepNumber: step.stepNumber,
          stepCode: step.stepCode,
          stepName: step.stepName,
          description: step.description,
          status: 'NOT_STARTED',
        },
      });

      // Create tasks for this step
      await prisma.workflowTask.createMany({
        data: step.tasks.map((task) => ({
          workflowStepId: createdStep.id,
          taskCode: task.taskCode,
          taskName: task.taskName,
          isRequired: task.isRequired,
          sortOrder: task.sortOrder,
        })),
      });
    }
  }

  // Now fetch company with all related data
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
      checklistItems: {
        orderBy: [{ chapter: 'asc' }, { articleRef: 'asc' }],
      },
      bnqProgress: true,
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <BnqContent
      company={JSON.parse(JSON.stringify(company))}
      documentTypes={JSON.parse(JSON.stringify(documentTypes))}
    />
  );
}
