import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET: Fetch BNQ progress for a company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    // Get or create progress
    let progress = await prisma.companyBnqProgress.findUnique({
      where: { companyId },
    });

    if (!progress) {
      progress = await prisma.companyBnqProgress.create({
        data: {
          companyId,
          targetLevel: 'ES',
          currentProgress: 0,
          documentsProgress: 0,
          workflowProgress: 0,
        },
      });
    }

    // Get document stats
    const documentTypes = await prisma.documentType.findMany({
      where: { requiredForLevel: 'ES', isOptional: false },
    });
    
    const documents = await prisma.document.findMany({
      where: { companyId },
      include: { documentType: true },
    });

    const approvedDocs = documents.filter((d: { status: string }) => d.status === 'APPROVED');
    const pendingDocs = documents.filter((d: { status: string }) => d.status === 'PENDING_VALIDATION');
    const draftDocs = documents.filter((d: { status: string }) => d.status === 'DRAFT');

    // Get workflow stats
    const workflowSteps = await prisma.workflowStep.findMany({
      where: { companyId },
      include: { tasks: true },
    });

    const completedSteps = workflowSteps.filter((s: { status: string }) => s.status === 'COMPLETED');
    const inProgressSteps = workflowSteps.filter(s => s.status === 'IN_PROGRESS');

    return NextResponse.json({
      progress,
      stats: {
        documents: {
          total: documentTypes.length,
          approved: approvedDocs.length,
          pending: pendingDocs.length,
          draft: draftDocs.length,
          missing: documentTypes.length - new Set(documents.map((d: { documentTypeId: string }) => d.documentTypeId)).size,
        },
        workflow: {
          total: workflowSteps.length,
          completed: completedSteps.length,
          inProgress: inProgressSteps.length,
          notStarted: workflowSteps.length - completedSteps.length - inProgressSteps.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching BNQ progress:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la progression BNQ' },
      { status: 500 }
    );
  }
}

// PUT: Update target level
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const { targetLevel } = body;

    const progress = await prisma.companyBnqProgress.upsert({
      where: { companyId },
      update: { targetLevel },
      create: {
        companyId,
        targetLevel,
        currentProgress: 0,
        documentsProgress: 0,
        workflowProgress: 0,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating BNQ progress:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 }
    );
  }
}
