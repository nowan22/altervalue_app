import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_REQUIREMENTS } from '@/lib/bnq-requirements';
import { WORKFLOW_STEPS } from '@/lib/bnq-data';

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

    // Get target level for filtering requirements
    const targetLevel = company.bnqProgress?.targetLevel || 'ES';
    const levelOrder: Record<string, number> = { ES: 1, ESE: 2, ESE_PLUS: 3 };
    const currentLevelValue = levelOrder[targetLevel] || 1;

    // Calculate total requirements for this level
    const applicableRequirements = BNQ_REQUIREMENTS.filter(
      r => levelOrder[r.requiredForLevel] <= currentLevelValue
    );
    const totalRequirements = applicableRequirements.length;

    // Get document types for counting required docs (for the target level)
    const documentTypes = await prisma.documentType.findMany({
      where: { 
        isOptional: false,
        requiredForLevel: {
          in: targetLevel === 'ESE_PLUS' ? ['ES', 'ESE', 'ESE_PLUS'] :
              targetLevel === 'ESE' ? ['ES', 'ESE'] : ['ES']
        }
      },
    });

    // Calculate stats
    const approvedDocs = company.documents.filter((d: { status: string }) => d.status === 'APPROVED');
    const pendingDocs = company.documents.filter((d: { status: string }) => d.status === 'PENDING_VALIDATION');
    const uploadedDocTypeIds = new Set(company.documents.map((d: { documentTypeId: string }) => d.documentTypeId));
    const missingDocs = documentTypes.filter((dt: { id: string }) => !uploadedDocTypeIds.has(dt.id));

    // Use workflow template for total steps count
    const totalWorkflowSteps = WORKFLOW_STEPS?.length || 8; // Fallback to 8 if not defined
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

    // Fetch actual active alerts count
    const activeAlertsCount = await prisma.bnqAlert.count({
      where: {
        companyId,
        isResolved: false,
      },
    });

    // Calculate progress percentages
    const documentsProgress = documentTypes.length > 0 
      ? Math.round((approvedDocs.length / documentTypes.length) * 100) 
      : 0;
    const checklistProgress = totalRequirements > 0 
      ? Math.round((compliantItems.length / totalRequirements) * 100) 
      : 0;
    const workflowProgress = totalWorkflowSteps > 0 
      ? Math.round((completedSteps.length / totalWorkflowSteps) * 100) 
      : 0;

    const response = {
      progress: {
        currentProgress: company.bnqProgress?.currentProgress || Math.round((documentsProgress + checklistProgress + workflowProgress) / 3),
        documentsProgress: company.bnqProgress?.documentsProgress || documentsProgress,
        workflowProgress: company.bnqProgress?.workflowProgress || workflowProgress,
        checklistProgress: company.bnqProgress?.checklistProgress || checklistProgress,
        actionsProgress: company.bnqProgress?.actionsProgress || 0,
        targetLevel,
      },
      stats: {
        totalDocuments: documentTypes.length,
        approvedDocuments: approvedDocs.length,
        pendingDocuments: pendingDocs.length,
        missingDocuments: missingDocs.length,
        totalSteps: totalWorkflowSteps,
        completedSteps: completedSteps.length,
        totalChecklist: totalRequirements,
        compliantItems: compliantItems.length,
        activeAlerts: activeAlertsCount, // Use actual alerts count from database
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
