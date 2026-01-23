import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/bnq/action-plans/[planId]/interventions/[interventionId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string; interventionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { interventionId } = await params;

    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        actionPlan: {
          select: { id: true, year: true, companyId: true },
        },
      },
    });

    if (!intervention) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error fetching intervention:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/bnq/action-plans/[planId]/interventions/[interventionId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ planId: string; interventionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { interventionId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      sphere,
      priority,
      status,
      addressesPriority,
      bnqArticleRef,
      responsiblePerson,
      responsibleRole,
      startDate,
      targetEndDate,
      actualEndDate,
      budget,
      actualCost,
      targetParticipation,
      actualParticipation,
      satisfactionScore,
      expectedOutcome,
      actualOutcome,
      progressNotes,
    } = body;

    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (sphere !== undefined) updateData.sphere = sphere;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = session.user?.email || 'unknown';
      }
    }
    if (addressesPriority !== undefined) updateData.addressesPriority = addressesPriority;
    if (bnqArticleRef !== undefined) updateData.bnqArticleRef = bnqArticleRef;
    if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson;
    if (responsibleRole !== undefined) updateData.responsibleRole = responsibleRole;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (targetEndDate !== undefined) updateData.targetEndDate = targetEndDate ? new Date(targetEndDate) : null;
    if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate ? new Date(actualEndDate) : null;
    if (budget !== undefined) updateData.budget = budget;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (targetParticipation !== undefined) updateData.targetParticipation = targetParticipation;
    if (actualParticipation !== undefined) updateData.actualParticipation = actualParticipation;
    if (satisfactionScore !== undefined) updateData.satisfactionScore = satisfactionScore;
    if (expectedOutcome !== undefined) updateData.expectedOutcome = expectedOutcome;
    if (actualOutcome !== undefined) updateData.actualOutcome = actualOutcome;
    if (progressNotes !== undefined) updateData.progressNotes = progressNotes;

    const intervention = await prisma.intervention.update({
      where: { id: interventionId },
      data: updateData,
    });

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error updating intervention:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/bnq/action-plans/[planId]/interventions/[interventionId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ planId: string; interventionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { interventionId } = await params;

    await prisma.intervention.delete({
      where: { id: interventionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
