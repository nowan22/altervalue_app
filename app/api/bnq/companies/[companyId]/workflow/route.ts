import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { WORKFLOW_STEPS } from '@/lib/bnq-data';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET: Fetch workflow steps for a company (initialize if needed)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    // Check if workflow exists for this company
    let workflowSteps = await prisma.workflowStep.findMany({
      where: { companyId },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { stepNumber: 'asc' },
    });

    // Initialize workflow if not exists
    if (workflowSteps.length === 0) {
      for (const step of WORKFLOW_STEPS) {
        const createdStep = await prisma.workflowStep.create({
          data: {
            companyId,
            stepNumber: step.stepNumber,
            stepCode: step.stepCode,
            stepName: step.stepName,
            description: step.description,
            status: 'NOT_STARTED',
          },
        });

        // Create tasks for this step
        await prisma.workflowTask.createMany({
          data: step.tasks.map(task => ({
            workflowStepId: createdStep.id,
            taskCode: task.taskCode,
            taskName: task.taskName,
            isRequired: task.isRequired,
            sortOrder: task.sortOrder,
          })),
        });
      }

      workflowSteps = await prisma.workflowStep.findMany({
        where: { companyId },
        include: { tasks: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { stepNumber: 'asc' },
      });
    }

    return NextResponse.json(workflowSteps);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du workflow' },
      { status: 500 }
    );
  }
}
