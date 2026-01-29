import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_REQUIREMENTS } from '@/lib/bnq-requirements';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        bnqProgress: true,
        checklistItems: true,
        documents: {
          where: { status: { not: 'ARCHIVED' } },
          include: { documentType: { select: { code: true, name: true } } },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Mission non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      checklistItems: company.checklistItems.map((item: any) => ({
        id: item.id,
        articleRef: item.articleRef,
        requirement: item.requirement,
        isCompliant: item.isCompliant,
        evaluatedAt: item.evaluatedAt?.toISOString() || null,
        evidence: item.evidence,
        notes: item.notes,
      })),
      linkedDocuments: company.documents.map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        status: doc.status,
      })),
      targetLevel: company.bnqProgress?.targetLevel || 'ES',
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Update requirement compliance status
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, articleRef, isCompliant, evidence, notes } = body;

    if (!companyId || !articleRef) {
      return NextResponse.json({ error: 'Company ID et articleRef requis' }, { status: 400 });
    }

    // Find the requirement definition
    const requirementDef = BNQ_REQUIREMENTS.find(r => r.section === articleRef);
    if (!requirementDef) {
      return NextResponse.json({ error: 'Exigence non trouvée' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userName = session.user?.name || session.user?.email || 'Utilisateur';

    // Check if checklist item exists
    const existingItem = await prisma.bnqChecklistItem.findFirst({
      where: { companyId, articleRef },
    });

    let checklistItem;
    if (existingItem) {
      // Update existing
      checklistItem = await prisma.bnqChecklistItem.update({
        where: { id: existingItem.id },
        data: {
          isCompliant,
          evaluatedAt: new Date(),
          evaluatedBy: userName,
          evidence: evidence || existingItem.evidence,
          notes: notes || existingItem.notes,
        },
      });
    } else {
      // Create new
      checklistItem = await prisma.bnqChecklistItem.create({
        data: {
          companyId,
          chapter: requirementDef.chapter,
          articleRef,
          requirement: requirementDef.requirement,
          requiredForLevel: requirementDef.requiredForLevel,
          isCompliant,
          evaluatedAt: new Date(),
          evaluatedBy: userName,
          evidence,
          notes,
        },
      });
    }

    // Update BNQ progress
    await updateBnqProgress(companyId);

    return NextResponse.json({
      success: true,
      checklistItem: {
        id: checklistItem.id,
        articleRef: checklistItem.articleRef,
        isCompliant: checklistItem.isCompliant,
        evaluatedAt: checklistItem.evaluatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper function to update BNQ progress
async function updateBnqProgress(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      bnqProgress: true,
      checklistItems: true,
    },
  });

  if (!company || !company.bnqProgress) return;

  const targetLevel = company.bnqProgress.targetLevel;
  const levelOrder = { ES: 1, ESE: 2, ESE_PLUS: 3 };

  // Filter requirements for this level
  const applicableRequirements = BNQ_REQUIREMENTS.filter(
    r => levelOrder[r.requiredForLevel] <= levelOrder[targetLevel]
  );

  const totalRequirements = applicableRequirements.length;
  const compliantItems = company.checklistItems.filter(item => item.isCompliant === true);
  const checklistProgress = totalRequirements > 0 
    ? Math.round((compliantItems.length / totalRequirements) * 100)
    : 0;

  // Update progress
  await prisma.companyBnqProgress.update({
    where: { id: company.bnqProgress.id },
    data: {
      checklistProgress,
      currentProgress: Math.round(
        (company.bnqProgress.documentsProgress + 
         company.bnqProgress.workflowProgress + 
         checklistProgress) / 3
      ),
    },
  });
}
