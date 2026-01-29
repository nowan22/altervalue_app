import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

    // Fetch company with BNQ data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        bnqProgress: true,
        documents: {
          where: { status: { not: 'ARCHIVED' } },
          include: { documentType: true },
        },
        workflowSteps: true,
        checklistItems: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Mission non trouvée' }, { status: 404 });
    }

    // Get document types for counting required docs
    const documentTypes = await prisma.documentType.findMany({
      where: { requiredForLevel: 'ES', isOptional: false },
    });

    // Calculate stats
    const approvedDocs = company.documents.filter((d: { status: string }) => d.status === 'APPROVED');
    const pendingDocs = company.documents.filter((d: { status: string }) => d.status === 'PENDING_VALIDATION');
    const uploadedDocTypeIds = new Set(company.documents.map((d: { documentTypeId: string }) => d.documentTypeId));
    const missingDocs = documentTypes.filter((dt: { id: string }) => !uploadedDocTypeIds.has(dt.id));

    const completedSteps = company.workflowSteps.filter((s: { status: string }) => s.status === 'COMPLETED');
    const compliantItems = company.checklistItems.filter((item: { isCompliant: boolean | null }) => item.isCompliant === true);

    // Fetch recent activity logs
    const recentActivity = await prisma.activityLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    const response = {
      progress: {
        currentProgress: company.bnqProgress?.currentProgress || 0,
        documentsProgress: company.bnqProgress?.documentsProgress || 0,
        workflowProgress: company.bnqProgress?.workflowProgress || 0,
        checklistProgress: company.bnqProgress?.checklistProgress || 0,
        actionsProgress: company.bnqProgress?.actionsProgress || 0,
        targetLevel: company.bnqProgress?.targetLevel || 'ES',
      },
      stats: {
        totalDocuments: documentTypes.length,
        approvedDocuments: approvedDocs.length,
        pendingDocuments: pendingDocs.length,
        missingDocuments: missingDocs.length,
        totalSteps: company.workflowSteps.length,
        completedSteps: completedSteps.length,
        totalChecklist: company.checklistItems.length,
        compliantItems: compliantItems.length,
        activeAlerts: missingDocs.length + pendingDocs.length, // Simple alert count
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type.toLowerCase().includes('document') ? 'document' 
          : a.type.toLowerCase().includes('checklist') ? 'checklist' 
          : 'other',
        description: a.description || a.type,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching BNQ overview:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
