import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/bnq/action-plans/[planId] - Get single action plan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { planId } = await params;

    const actionPlan = await prisma.actionPlan.findUnique({
      where: { id: planId },
      include: {
        interventions: {
          orderBy: [{ sphere: 'asc' }, { createdAt: 'asc' }],
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!actionPlan) {
      return NextResponse.json({ error: 'Plan d\'action non trouvé' }, { status: 404 });
    }

    return NextResponse.json(actionPlan);
  } catch (error) {
    console.error('Error fetching action plan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/bnq/action-plans/[planId] - Update action plan
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { planId } = await params;
    const body = await request.json();
    const { title, description, status, approvedBy, approvedAt } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (approvedBy !== undefined) updateData.approvedBy = approvedBy;
    if (approvedAt !== undefined) updateData.approvedAt = new Date(approvedAt);

    const actionPlan = await prisma.actionPlan.update({
      where: { id: planId },
      data: updateData,
      include: {
        interventions: true,
      },
    });

    return NextResponse.json(actionPlan);
  } catch (error) {
    console.error('Error updating action plan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/bnq/action-plans/[planId] - Delete action plan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { planId } = await params;

    await prisma.actionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action plan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
