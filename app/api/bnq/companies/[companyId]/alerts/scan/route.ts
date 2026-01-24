import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { AlertType, AlertSeverity } from '@prisma/client';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// POST: Scan and generate automatic alerts
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        documents: {
          include: { documentType: true },
          where: { status: { not: 'ARCHIVED' } },
        },
        workflowSteps: {
          include: { tasks: true },
        },
        actionPlans: {
          where: { status: 'ACTIVE' },
          include: { interventions: true },
        },
        checklistItems: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Get document types for completeness check
    const documentTypes = await prisma.documentType.findMany();

    const alertsToCreate: Array<{
      companyId: string;
      type: AlertType;
      severity: AlertSeverity;
      title: string;
      message: string;
      triggerDate: Date;
      dueDate?: Date;
      interventionId?: string;
    }> = [];

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // 1. Check for document expiry
    for (const doc of company.documents) {
      if (doc.expiresAt) {
        const expiresAt = new Date(doc.expiresAt);
        if (expiresAt <= now) {
          // Already expired
          alertsToCreate.push({
            companyId,
            type: 'DOCUMENT_EXPIRY',
            severity: 'CRITICAL',
            title: `Document expiré : ${doc.documentType.name}`,
            message: `Le document "${doc.fileName}" a expiré le ${expiresAt.toLocaleDateString('fr-FR')}. Veuillez le renouveler immédiatement.`,
            triggerDate: now,
            dueDate: now,
          });
        } else if (expiresAt <= in30Days) {
          // Expires within 30 days
          alertsToCreate.push({
            companyId,
            type: 'DOCUMENT_EXPIRY',
            severity: 'URGENT',
            title: `Document bientôt expiré : ${doc.documentType.name}`,
            message: `Le document "${doc.fileName}" expire le ${expiresAt.toLocaleDateString('fr-FR')} (dans moins de 30 jours).`,
            triggerDate: now,
            dueDate: expiresAt,
          });
        } else if (expiresAt <= in90Days) {
          // Expires within 90 days
          alertsToCreate.push({
            companyId,
            type: 'DOCUMENT_EXPIRY',
            severity: 'WARNING',
            title: `Échéance document : ${doc.documentType.name}`,
            message: `Le document "${doc.fileName}" expire le ${expiresAt.toLocaleDateString('fr-FR')}. Pensez à planifier son renouvellement.`,
            triggerDate: now,
            dueDate: expiresAt,
          });
        }
      }
    }

    // 2. Check for missing required documents
    const requiredDocTypes = documentTypes.filter(dt => !dt.isOptional);
    const uploadedDocTypeIds = company.documents.map(d => d.documentType.id);
    const missingDocs = requiredDocTypes.filter(dt => !uploadedDocTypeIds.includes(dt.id));

    if (missingDocs.length > 0) {
      const severity: AlertSeverity = missingDocs.length >= 5 ? 'CRITICAL' : missingDocs.length >= 3 ? 'URGENT' : 'WARNING';
      alertsToCreate.push({
        companyId,
        type: 'DOCUMENT_MISSING',
        severity,
        title: `${missingDocs.length} document(s) requis manquant(s)`,
        message: `Documents manquants : ${missingDocs.slice(0, 5).map(d => d.name).join(', ')}${missingDocs.length > 5 ? '...' : ''}`,
        triggerDate: now,
      });
    }

    // 3. Check for workflow overdue tasks
    for (const step of company.workflowSteps) {
      if (step.status !== 'COMPLETED' && step.dueDate) {
        const dueDate = new Date(step.dueDate);
        if (dueDate < now) {
          alertsToCreate.push({
            companyId,
            type: 'WORKFLOW_OVERDUE',
            severity: 'CRITICAL',
            title: `Étape workflow en retard : ${step.stepName}`,
            message: `L'étape "${step.stepName}" devait être terminée le ${dueDate.toLocaleDateString('fr-FR')}.`,
            triggerDate: now,
            dueDate,
          });
        } else if (dueDate <= in30Days) {
          alertsToCreate.push({
            companyId,
            type: 'WORKFLOW_OVERDUE',
            severity: 'WARNING',
            title: `Échéance workflow proche : ${step.stepName}`,
            message: `L'étape "${step.stepName}" doit être terminée avant le ${dueDate.toLocaleDateString('fr-FR')}.`,
            triggerDate: now,
            dueDate,
          });
        }
      }
    }

    // 4. Check for intervention deadlines
    for (const plan of company.actionPlans) {
      for (const intervention of plan.interventions) {
        if (intervention.status !== 'COMPLETED' && intervention.status !== 'CANCELLED') {
          const targetEndDate = intervention.targetEndDate ? new Date(intervention.targetEndDate) : null;
          if (targetEndDate) {
            if (targetEndDate < now && intervention.status !== 'POSTPONED') {
              alertsToCreate.push({
                companyId,
                type: 'INTERVENTION_OVERDUE',
                severity: 'URGENT',
                title: `Intervention en retard : ${intervention.title}`,
                message: `L'intervention "${intervention.title}" devait se terminer le ${targetEndDate.toLocaleDateString('fr-FR')}.`,
                triggerDate: now,
                dueDate: targetEndDate,
                interventionId: intervention.id,
              });
            } else if (targetEndDate <= in30Days && targetEndDate > now) {
              alertsToCreate.push({
                companyId,
                type: 'INTERVENTION_DEADLINE',
                severity: 'INFO',
                title: `Échéance intervention : ${intervention.title}`,
                message: `L'intervention "${intervention.title}" doit se terminer le ${targetEndDate.toLocaleDateString('fr-FR')}.`,
                triggerDate: now,
                dueDate: targetEndDate,
                interventionId: intervention.id,
              });
            }
          }
        }
      }
    }

    // 5. Check for non-compliant requirements (use CUSTOM type for general issues)
    const nonCompliantItems = company.checklistItems.filter(item => item.isCompliant === false);
    if (nonCompliantItems.length > 0) {
      const severity: AlertSeverity = nonCompliantItems.length >= 10 ? 'CRITICAL' : nonCompliantItems.length >= 5 ? 'URGENT' : 'WARNING';
      alertsToCreate.push({
        companyId,
        type: 'CUSTOM',
        severity,
        title: `${nonCompliantItems.length} non-conformité(s) détectée(s)`,
        message: `${nonCompliantItems.length} exigences BNQ sont marquées comme non conformes. Vérifiez l'onglet Exigences.`,
        triggerDate: now,
      });
    }

    // 6. Check for pending validation documents (stale) - use DOCUMENT_REVISION
    const pendingDocs = company.documents.filter(d => d.status === 'PENDING_VALIDATION');
    const stalePendingDocs = pendingDocs.filter(d => {
      const createdAt = new Date(d.createdAt);
      return (now.getTime() - createdAt.getTime()) > 14 * 24 * 60 * 60 * 1000; // > 14 days
    });

    if (stalePendingDocs.length > 0) {
      alertsToCreate.push({
        companyId,
        type: 'DOCUMENT_REVISION',
        severity: 'WARNING',
        title: `${stalePendingDocs.length} document(s) en attente de validation`,
        message: `${stalePendingDocs.length} document(s) sont en attente de validation depuis plus de 14 jours.`,
        triggerDate: now,
      });
    }

    // 7. Check for review reminder (annual review)
    const lastEvaluatedAt = company.checklistItems
      .filter(item => item.evaluatedAt)
      .map(item => new Date(item.evaluatedAt!))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (lastEvaluatedAt) {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (lastEvaluatedAt < oneYearAgo) {
        alertsToCreate.push({
          companyId,
          type: 'ANNUAL_REVIEW',
          severity: 'INFO',
          title: 'Revue annuelle recommandée',
          message: `La dernière évaluation des exigences BNQ date de plus d'un an (${lastEvaluatedAt.toLocaleDateString('fr-FR')}). Une revue est recommandée.`,
          triggerDate: now,
        });
      }
    }

    // Get existing unresolved alerts to avoid duplicates
    const existingAlerts = await prisma.bnqAlert.findMany({
      where: {
        companyId,
        isResolved: false,
      },
      select: {
        type: true,
        title: true,
      },
    });

    const existingAlertKeys = new Set(
      existingAlerts.map(a => `${a.type}:${a.title}`)
    );

    // Filter out duplicates
    const newAlerts = alertsToCreate.filter(
      a => !existingAlertKeys.has(`${a.type}:${a.title}`)
    );

    // Create new alerts
    if (newAlerts.length > 0) {
      await prisma.bnqAlert.createMany({
        data: newAlerts.map(a => ({
          companyId: a.companyId,
          type: a.type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          triggerDate: a.triggerDate,
          dueDate: a.dueDate,
          interventionId: a.interventionId,
        })),
      });
    }

    // Return summary
    return NextResponse.json({
      success: true,
      alertsCreated: newAlerts.length,
      alertsSkipped: alertsToCreate.length - newAlerts.length,
      summary: {
        documentExpiry: newAlerts.filter(a => a.type === 'DOCUMENT_EXPIRY').length,
        missingDocuments: newAlerts.filter(a => a.type === 'DOCUMENT_MISSING').length,
        workflowOverdue: newAlerts.filter(a => a.type === 'WORKFLOW_OVERDUE').length,
        interventionDeadline: newAlerts.filter(a => a.type === 'INTERVENTION_DEADLINE' || a.type === 'INTERVENTION_OVERDUE').length,
        complianceGap: newAlerts.filter(a => a.type === 'CUSTOM').length,
        pendingValidation: newAlerts.filter(a => a.type === 'DOCUMENT_REVISION').length,
        reviewReminder: newAlerts.filter(a => a.type === 'ANNUAL_REVIEW').length,
      },
    });
  } catch (error) {
    console.error('Error scanning for alerts:', error);
    return NextResponse.json(
      { error: 'Erreur lors du scan des alertes' },
      { status: 500 }
    );
  }
}
