import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_LEVEL_REQUIREMENTS } from '@/lib/bnq-requirements';

// GET /api/bnq/companies/[companyId]/action-plans - List action plans
export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    const actionPlans = await prisma.actionPlan.findMany({
      where: { companyId },
      include: {
        interventions: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { interventions: true },
        },
      },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(actionPlans);
  } catch (error) {
    console.error('Error fetching action plans:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/bnq/companies/[companyId]/action-plans - Create action plan
export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const { year, title, description, targetLevel = 'ES' } = body;

    // Check if plan already exists for this year
    const existing = await prisma.actionPlan.findUnique({
      where: { companyId_year: { companyId, year } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Un plan d'action existe déjà pour l'année ${year}` },
        { status: 400 }
      );
    }

    // Get level requirements
    const levelReqs = BNQ_LEVEL_REQUIREMENTS[targetLevel as keyof typeof BNQ_LEVEL_REQUIREMENTS] || BNQ_LEVEL_REQUIREMENTS.ES;

    const actionPlan = await prisma.actionPlan.create({
      data: {
        companyId,
        year,
        title: title || `Plan d'action santé mieux-être ${year}`,
        description,
        targetLevel,
        minInterventions: levelReqs.minInterventions,
        minPriorities: levelReqs.minPriorities,
        minPratiquesGestion: levelReqs.minPratiquesGestion,
      },
      include: {
        interventions: true,
      },
    });

    return NextResponse.json(actionPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating action plan:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
