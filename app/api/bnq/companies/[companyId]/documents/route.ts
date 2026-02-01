import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET: Fetch all documents for a company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    const documents = await prisma.document.findMany({
      where: { companyId },
      include: {
        documentType: true,
      },
      orderBy: [
        { documentType: { sortOrder: 'asc' } },
        { version: 'desc' },
      ],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    );
  }
}

// POST: Create/upload a new document
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const { documentTypeId, fileName, fileUrl, cloudStoragePath, notes, expiresAt } = body;

    if (!documentTypeId || !fileName) {
      return NextResponse.json(
        { error: 'Type de document et nom de fichier requis' },
        { status: 400 }
      );
    }

    // Get existing documents of this type to determine version
    const existingDocs = await prisma.document.findMany({
      where: { companyId, documentTypeId },
      orderBy: { version: 'desc' },
    });

    const newVersion = existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

    // Archive previous versions
    if (existingDocs.length > 0) {
      await prisma.document.updateMany({
        where: { companyId, documentTypeId, status: { not: 'ARCHIVED' } },
        data: { status: 'ARCHIVED' },
      });
    }

    const document = await prisma.document.create({
      data: {
        companyId,
        documentTypeId,
        fileName,
        fileUrl,
        cloudStoragePath,
        version: newVersion,
        status: 'DRAFT',
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        documentType: true,
      },
    });

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du document' },
      { status: 500 }
    );
  }
}

async function updateBnqProgress(companyId: string) {
  // Get all document types required for ES level
  const requiredTypes = await prisma.documentType.findMany({
    where: { requiredForLevel: 'ES', isOptional: false },
  });

  // Get approved documents for this company
  const approvedDocs = await prisma.document.findMany({
    where: { 
      companyId, 
      status: { in: ['APPROVED', 'PENDING_VALIDATION'] },
    },
    select: { documentTypeId: true },
  });

  const approvedTypeIds = new Set(approvedDocs.map((d: { documentTypeId: string }) => d.documentTypeId));
  const documentsProgress = (approvedTypeIds.size / requiredTypes.length) * 100;

  // Get workflow progress
  const workflowSteps = await prisma.workflowStep.findMany({
    where: { companyId },
  });
  const completedSteps = workflowSteps.filter((s: { status: string }) => s.status === 'COMPLETED').length;
  const workflowProgress = workflowSteps.length > 0 ? (completedSteps / workflowSteps.length) * 100 : 0;

  // Calculate overall progress
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
