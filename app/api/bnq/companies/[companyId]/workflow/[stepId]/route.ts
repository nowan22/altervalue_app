import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string; stepId: string }>;
}

// PUT: Update a workflow step
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { stepId, companyId } = await params;
    const body = await request.json();
    const { status, signature, notes, dueDate } = body;

    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = session.user.email;
      }
    }
    if (signature) {
      updateData.signature = signature;
      updateData.signatureTimestamp = new Date();
    }
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    const step = await prisma.workflowStep.update({
      where: { id: stepId },
      data: updateData,
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error updating workflow step:', error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'étape" },
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
