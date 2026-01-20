import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string; taskId: string }>;
}

// PUT: Update a workflow task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId, companyId } = await params;
    const body = await request.json();
    const { isCompleted, notes } = body;

    const updateData: Record<string, unknown> = {};
    
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
        updateData.completedBy = session.user.email;
      } else {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const task = await prisma.workflowTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Check if all required tasks in the step are completed
    const step = await prisma.workflowStep.findFirst({
      where: { tasks: { some: { id: taskId } } },
      include: { tasks: true },
    });

    if (step) {
      const requiredTasks = step.tasks.filter((t: { isRequired: boolean }) => t.isRequired);
      const allRequiredCompleted = requiredTasks.every((t: { isCompleted: boolean }) => t.isCompleted);
      
      if (allRequiredCompleted && step.status !== 'COMPLETED') {
        // Auto-update step status to IN_PROGRESS if tasks are being completed
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la tâche' },
      { status: 500 }
    );
  }
}

async function updateBnqProgress(companyId: string) {
  const requiredTypes = await prisma.documentType.findMany({
    where: { requiredForLevel: 'ES', isOptional: false },
  });

  const approvedDocs = await prisma.document.findMany({
    where: { 
      companyId, 
      status: { in: ['APPROVED', 'PENDING_VALIDATION'] },
    },
    select: { documentTypeId: true },
  });

  const approvedTypeIds = new Set(approvedDocs.map((d: { documentTypeId: string }) => d.documentTypeId));
  const documentsProgress = requiredTypes.length > 0 ? (approvedTypeIds.size / requiredTypes.length) * 100 : 0;

  const workflowSteps = await prisma.workflowStep.findMany({
    where: { companyId },
  });
  const completedSteps = workflowSteps.filter((s: { status: string }) => s.status === 'COMPLETED').length;
  const workflowProgress = workflowSteps.length > 0 ? (completedSteps / workflowSteps.length) * 100 : 0;

  const currentProgress = (documentsProgress * 0.6) + (workflowProgress * 0.4);

  await prisma.companyBnqProgress.upsert({
    where: { companyId },
    update: {
      documentsProgress,
      workflowProgress,
      currentProgress,
      lastEvaluatedAt: new Date(),
    },
    create: {
      companyId,
      targetLevel: 'ES',
      documentsProgress,
      workflowProgress,
      currentProgress,
      lastEvaluatedAt: new Date(),
    },
  });
}
