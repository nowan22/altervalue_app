import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/bnq/companies/[companyId]/alerts - List alerts
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
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';
    const type = searchParams.get('type');

    const whereClause: Record<string, unknown> = { companyId };
    if (!includeResolved) {
      whereClause.isResolved = false;
    }
    if (type) {
      whereClause.type = type;
    }

    const alerts = await prisma.bnqAlert.findMany({
      where: whereClause,
      orderBy: [
        { severity: 'desc' },
        { triggerDate: 'asc' },
      ],
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/bnq/companies/[companyId]/alerts - Create alert
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
    const {
      type,
      severity = 'WARNING',
      title,
      message,
      documentId,
      workflowStepId,
      interventionId,
      triggerDate,
      dueDate,
      isRecurring = false,
      recurrencePattern,
    } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, titre et message sont obligatoires' },
        { status: 400 }
      );
    }

    const alert = await prisma.bnqAlert.create({
      data: {
        companyId,
        type,
        severity,
        title,
        message,
        documentId,
        workflowStepId,
        interventionId,
        triggerDate: triggerDate ? new Date(triggerDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        isRecurring,
        recurrencePattern,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
