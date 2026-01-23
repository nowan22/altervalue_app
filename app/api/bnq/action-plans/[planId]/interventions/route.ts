import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/bnq/action-plans/[planId]/interventions - List interventions
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

    const interventions = await prisma.intervention.findMany({
      where: { actionPlanId: planId },
      orderBy: [{ sphere: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/bnq/action-plans/[planId]/interventions - Create intervention
export async function POST(
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
    const {
      title,
      description,
      sphere,
      priority = 'MEDIUM',
      addressesPriority = false,
      bnqArticleRef,
      responsiblePerson,
      responsibleRole,
      startDate,
      targetEndDate,
      budget,
      targetParticipation,
      expectedOutcome,
    } = body;

    // Validate required fields
    if (!title || !sphere) {
      return NextResponse.json(
        { error: 'Le titre et la sphère sont obligatoires' },
        { status: 400 }
      );
    }

    const intervention = await prisma.intervention.create({
      data: {
        actionPlanId: planId,
        title,
        description,
        sphere,
        priority,
        addressesPriority,
        bnqArticleRef,
        responsiblePerson,
        responsibleRole,
        startDate: startDate ? new Date(startDate) : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        budget,
        targetParticipation,
        expectedOutcome,
      },
    });

    return NextResponse.json(intervention, { status: 201 });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
