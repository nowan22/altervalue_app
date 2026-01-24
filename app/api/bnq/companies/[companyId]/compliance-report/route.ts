import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_LEVEL_LABELS, CATEGORY_LABELS, STATUS_LABELS } from '@/lib/bnq-data';
import type { BnqLevel, DocumentCategory } from '@prisma/client';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// GET: Generate BNQ compliance report
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId } = await params;

    // Fetch company with all BNQ data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        documents: {
          include: { documentType: true },
          where: { status: { not: 'ARCHIVED' } },
          orderBy: { documentType: { sortOrder: 'asc' } },
        },
        workflowSteps: {
          include: { tasks: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { stepNumber: 'asc' },
        },
        checklistItems: {
          orderBy: [{ chapter: 'asc' }, { articleRef: 'asc' }],
        },
        bnqProgress: true,
        actionPlans: {
          where: { status: 'ACTIVE' },
          include: {
            interventions: {
              orderBy: { sphere: 'asc' },
            },
          },
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { severity: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Get document types for completeness check
    const documentTypes = await prisma.documentType.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Calculate stats
    const targetLevel = (company.bnqProgress?.targetLevel || 'ES') as BnqLevel;
    const levelInfo = BNQ_LEVEL_LABELS[targetLevel];

    // Document stats
    const requiredDocs = documentTypes.filter(dt => !dt.isOptional);
    const approvedDocs = company.documents.filter(d => d.status === 'APPROVED');
    const pendingDocs = company.documents.filter(d => d.status === 'PENDING_VALIDATION');
    const missingDocs = requiredDocs.filter(
      dt => !company.documents.some(d => d.documentType.id === dt.id)
    );

    // Workflow stats
    const completedSteps = company.workflowSteps.filter(s => s.status === 'COMPLETED');
    const totalTasks = company.workflowSteps.reduce((sum, s) => sum + s.tasks.length, 0);
    const completedTasks = company.workflowSteps.reduce(
      (sum, s) => sum + s.tasks.filter(t => t.isCompleted).length,
      0
    );

    // Checklist stats
    const totalRequirements = company.checklistItems.length;
    const compliantItems = company.checklistItems.filter(i => i.isCompliant === true).length;
    const nonCompliantItems = company.checklistItems.filter(i => i.isCompliant === false).length;
    const notEvaluatedItems = company.checklistItems.filter(i => i.isCompliant === null).length;

    // Action plan stats
    const activePlan = company.actionPlans[0];
    const interventionsByStatus = activePlan?.interventions.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Generate HTML report
    const html = generateComplianceReportHtml({
      company: {
        name: company.name,
        sector: company.sector,
        employeesCount: company.employeesCount,
      },
      targetLevel,
      levelInfo,
      progress: company.bnqProgress || {
        currentProgress: 0,
        documentsProgress: 0,
        workflowProgress: 0,
        checklistProgress: 0,
        actionsProgress: 0,
      },
      documents: {
        total: documentTypes.length,
        required: requiredDocs.length,
        approved: approvedDocs.length,
        pending: pendingDocs.length,
        missing: missingDocs,
        byCategory: groupDocsByCategory(company.documents, documentTypes),
      },
      workflow: {
        totalSteps: company.workflowSteps.length,
        completedSteps: completedSteps.length,
        totalTasks,
        completedTasks,
        steps: company.workflowSteps.map(s => ({
          name: s.stepName,
          status: s.status,
          tasksCompleted: s.tasks.filter(t => t.isCompleted).length,
          tasksTotal: s.tasks.length,
        })),
      },
      checklist: {
        total: totalRequirements,
        compliant: compliantItems,
        nonCompliant: nonCompliantItems,
        notEvaluated: notEvaluatedItems,
      },
      actionPlan: activePlan ? {
        title: activePlan.title,
        year: activePlan.year,
        interventionsTotal: activePlan.interventions.length,
        byStatus: interventionsByStatus,
      } : null,
      alerts: {
        total: company.alerts.length,
        critical: company.alerts.filter(a => a.severity === 'CRITICAL').length,
        urgent: company.alerts.filter(a => a.severity === 'URGENT').length,
        warning: company.alerts.filter(a => a.severity === 'WARNING').length,
      },
      generatedAt: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}

function groupDocsByCategory(
  documents: Array<{ status: string; documentType: { id: string; category: string; name: string } }>,
  documentTypes: Array<{ id: string; category: string; name: string; isOptional: boolean }>
) {
  const categories = Object.keys(CATEGORY_LABELS) as DocumentCategory[];
  return categories.map(category => {
    const typesInCategory = documentTypes.filter(dt => dt.category === category);
    const docsInCategory = documents.filter(d => d.documentType.category === category);
    const approvedCount = docsInCategory.filter(d => d.status === 'APPROVED').length;
    const requiredCount = typesInCategory.filter(dt => !dt.isOptional).length;
    
    return {
      category,
      label: CATEGORY_LABELS[category],
      required: requiredCount,
      approved: approvedCount,
      percentage: requiredCount > 0 ? Math.round((approvedCount / requiredCount) * 100) : 100,
    };
  });
}

interface ReportData {
  company: { name: string; sector: string; employeesCount: number };
  targetLevel: BnqLevel;
  levelInfo: { name: string; badge: string; color: string };
  progress: {
    currentProgress: number;
    documentsProgress: number;
    workflowProgress: number;
    checklistProgress: number;
    actionsProgress: number;
  };
  documents: {
    total: number;
    required: number;
    approved: number;
    pending: number;
    missing: Array<{ name: string; bnqArticle: string | null }>;
    byCategory: Array<{ category: string; label: string; required: number; approved: number; percentage: number }>;
  };
  workflow: {
    totalSteps: number;
    completedSteps: number;
    totalTasks: number;
    completedTasks: number;
    steps: Array<{ name: string; status: string; tasksCompleted: number; tasksTotal: number }>;
  };
  checklist: {
    total: number;
    compliant: number;
    nonCompliant: number;
    notEvaluated: number;
  };
  actionPlan: {
    title: string;
    year: number;
    interventionsTotal: number;
    byStatus: Record<string, number>;
  } | null;
  alerts: {
    total: number;
    critical: number;
    urgent: number;
    warning: number;
  };
  generatedAt: string;
}

function generateComplianceReportHtml(data: ReportData): string {
  const overallProgress = data.progress.currentProgress;
  const progressColor = overallProgress >= 80 ? '#22c55e' : overallProgress >= 50 ? '#f97316' : '#ef4444';
  
  const missingDocsRows = data.documents.missing.slice(0, 10).map(doc => `
    <tr>
      <td style="color: #dc2626;">\u2717</td>
      <td>${doc.name}</td>
      <td>${doc.bnqArticle || '-'}</td>
    </tr>
  `).join('');

  const categoryRows = data.documents.byCategory.map(cat => `
    <tr>
      <td>${cat.label}</td>
      <td>${cat.approved} / ${cat.required}</td>
      <td>
        <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px;">
          <div style="background: ${cat.percentage >= 100 ? '#22c55e' : '#3b82f6'}; width: ${cat.percentage}%; height: 100%; border-radius: 4px;"></div>
        </div>
      </td>
      <td>${cat.percentage}%</td>
    </tr>
  `).join('');

  const workflowRows = data.workflow.steps.map(step => {
    const statusColor = step.status === 'COMPLETED' ? '#22c55e' : step.status === 'IN_PROGRESS' ? '#3b82f6' : '#9ca3af';
    const statusLabel = step.status === 'COMPLETED' ? 'Terminé' : step.status === 'IN_PROGRESS' ? 'En cours' : 'Non démarré';
    return `
      <tr>
        <td>${step.name}</td>
        <td><span style="color: ${statusColor}; font-weight: 600;">\u25CF ${statusLabel}</span></td>
        <td>${step.tasksCompleted} / ${step.tasksTotal}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport de Conformité BNQ - ${data.company.name}</title>
      <style>
        @page { margin: 1.5cm; size: A4; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          color: #1f2937; 
          line-height: 1.5;
          padding: 30px;
          font-size: 11pt;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .header h1 { font-size: 22pt; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 11pt; }
        .badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          margin-top: 10px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        .summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .summary-card .value {
          font-size: 24pt;
          font-weight: 700;
          color: #3b82f6;
        }
        .summary-card .label {
          font-size: 9pt;
          color: #6b7280;
          text-transform: uppercase;
        }
        .section {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 14pt;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #3b82f6;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
        th { background: #f3f4f6; font-weight: 600; font-size: 9pt; text-transform: uppercase; }
        .progress-ring {
          width: 120px;
          height: 120px;
          margin: 0 auto 15px;
        }
        .progress-text {
          text-align: center;
          font-size: 28pt;
          font-weight: 700;
          color: ${progressColor};
        }
        .progress-label {
          text-align: center;
          font-size: 10pt;
          color: #6b7280;
        }
        .alert-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: 600;
        }
        .alert-critical { background: #fef2f2; color: #dc2626; }
        .alert-urgent { background: #fff7ed; color: #ea580c; }
        .alert-warning { background: #fefce8; color: #ca8a04; }
        .checklist-bar {
          display: flex;
          height: 24px;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }
        .checklist-bar > div { display: flex; align-items: center; justify-content: center; color: white; font-size: 9pt; font-weight: 600; }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9pt;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Rapport de Conformité BNQ 9700-800</h1>
        <p>${data.company.name} • ${data.company.sector} • ${data.company.employeesCount} employés</p>
        <div class="badge">Objectif : ${data.levelInfo.badge} ${data.levelInfo.name}</div>
      </div>

      <!-- Overall Progress -->
      <div class="section" style="text-align: center;">
        <div class="progress-text">${Math.round(overallProgress)}%</div>
        <div class="progress-label">Progression globale vers la certification</div>
        <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
          <div><strong>${Math.round(data.progress.documentsProgress)}%</strong><br/><small>Documents</small></div>
          <div><strong>${Math.round(data.progress.workflowProgress)}%</strong><br/><small>Workflow</small></div>
          <div><strong>${Math.round(data.progress.checklistProgress)}%</strong><br/><small>Exigences</small></div>
          <div><strong>${Math.round(data.progress.actionsProgress)}%</strong><br/><small>Plan d'action</small></div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${data.documents.approved}</div>
          <div class="label">Documents approuvés</div>
        </div>
        <div class="summary-card">
          <div class="value">${data.workflow.completedSteps}/${data.workflow.totalSteps}</div>
          <div class="label">Étapes complétées</div>
        </div>
        <div class="summary-card">
          <div class="value">${data.checklist.compliant}</div>
          <div class="label">Exigences conformes</div>
        </div>
        <div class="summary-card">
          <div class="value" style="color: ${data.alerts.critical > 0 ? '#dc2626' : '#22c55e'};">${data.alerts.total}</div>
          <div class="label">Alertes actives</div>
        </div>
      </div>

      <!-- Documents Section -->
      <div class="section">
        <div class="section-title">📄 Documents</div>
        <p><strong>${data.documents.approved}</strong> documents approuvés sur <strong>${data.documents.required}</strong> requis • <strong>${data.documents.pending}</strong> en attente de validation</p>
        
        <table>
          <thead>
            <tr><th>Catégorie</th><th>Complétude</th><th>Progression</th><th>%</th></tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>

        ${data.documents.missing.length > 0 ? `
          <h4 style="margin-top: 20px; color: #dc2626;">Documents manquants (${data.documents.missing.length})</h4>
          <table>
            <thead><tr><th></th><th>Document</th><th>Article BNQ</th></tr></thead>
            <tbody>${missingDocsRows}</tbody>
          </table>
          ${data.documents.missing.length > 10 ? '<p style="font-size: 9pt; color: #6b7280;">... et ' + (data.documents.missing.length - 10) + ' autres</p>' : ''}
        ` : '<p style="color: #22c55e; margin-top: 15px;">\u2713 Tous les documents requis sont présents</p>'}
      </div>

      <!-- Workflow Section -->
      <div class="section">
        <div class="section-title">📝 Workflow d'adhésion</div>
        <p><strong>${data.workflow.completedTasks}</strong> tâches complétées sur <strong>${data.workflow.totalTasks}</strong></p>
        <table>
          <thead><tr><th>Étape</th><th>Statut</th><th>Tâches</th></tr></thead>
          <tbody>${workflowRows}</tbody>
        </table>
      </div>

      <!-- Checklist Section -->
      <div class="section">
        <div class="section-title">✅ Exigences BNQ</div>
        <p>Répartition des ${data.checklist.total} exigences évaluées :</p>
        <div class="checklist-bar">
          ${data.checklist.compliant > 0 ? `<div style="background: #22c55e; width: ${(data.checklist.compliant / data.checklist.total) * 100}%;">Conforme (${data.checklist.compliant})</div>` : ''}
          ${data.checklist.nonCompliant > 0 ? `<div style="background: #ef4444; width: ${(data.checklist.nonCompliant / data.checklist.total) * 100}%;">Non conforme (${data.checklist.nonCompliant})</div>` : ''}
          ${data.checklist.notEvaluated > 0 ? `<div style="background: #9ca3af; width: ${(data.checklist.notEvaluated / data.checklist.total) * 100}%;">Non évalué (${data.checklist.notEvaluated})</div>` : ''}
        </div>
      </div>

      <!-- Action Plan Section -->
      ${data.actionPlan ? `
        <div class="section">
          <div class="section-title">🎯 Plan d'action ${data.actionPlan.year}</div>
          <p><strong>${data.actionPlan.title}</strong> • ${data.actionPlan.interventionsTotal} interventions prévues</p>
          <div style="display: flex; gap: 20px; margin-top: 15px;">
            <div>Planifiées : <strong>${data.actionPlan.byStatus['PLANNED'] || 0}</strong></div>
            <div>En cours : <strong>${data.actionPlan.byStatus['IN_PROGRESS'] || 0}</strong></div>
            <div style="color: #22c55e;">Terminées : <strong>${data.actionPlan.byStatus['COMPLETED'] || 0}</strong></div>
          </div>
        </div>
      ` : ''}

      <!-- Alerts Section -->
      ${data.alerts.total > 0 ? `
        <div class="section">
          <div class="section-title">⚠️ Alertes actives</div>
          <div style="display: flex; gap: 15px;">
            ${data.alerts.critical > 0 ? `<span class="alert-badge alert-critical">Critiques : ${data.alerts.critical}</span>` : ''}
            ${data.alerts.urgent > 0 ? `<span class="alert-badge alert-urgent">Urgentes : ${data.alerts.urgent}</span>` : ''}
            ${data.alerts.warning > 0 ? `<span class="alert-badge alert-warning">Avertissements : ${data.alerts.warning}</span>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Rapport généré le ${data.generatedAt} • AlterValue v3.1</p>
        <p>Ce rapport constitue un état des lieux de la conformité BNQ 9700-800 et ne remplace pas l'audit officiel de certification.</p>
      </div>
    </body>
    </html>
  `;
}
