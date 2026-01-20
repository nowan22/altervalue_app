import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string; documentId: string }>;
}

// GET: Fetch a single document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { documentType: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du document' },
      { status: 500 }
    );
  }
}

// PUT: Update document (status, validation, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { documentId, companyId } = await params;
    const body = await request.json();
    const { status, notes, validatedBy, validationSignature, expiresAt } = body;

    const updateData: Record<string, unknown> = {};
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);
    
    // Handle validation
    if (status === 'APPROVED' || status === 'PENDING_VALIDATION') {
      if (validatedBy) updateData.validatedBy = validatedBy;
      if (validationSignature) updateData.validationSignature = validationSignature;
      if (status === 'APPROVED') {
        updateData.validatedAt = new Date();
      }
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: { documentType: true },
    });

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du document' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { documentId, companyId } = await params;

    await prisma.document.delete({
      where: { id: documentId },
    });

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
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
  const documentsProgress = (approvedTypeIds.size / requiredTypes.length) * 100;

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
