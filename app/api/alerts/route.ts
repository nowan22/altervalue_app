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

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Get accessible companies based on role
    let companyIds: string[] = [];
    
    if (userRole === 'PILOTE_QVCT' || userRole === 'OBSERVATEUR') {
      const assignments = await prisma.missionAssignment.findMany({
        where: { userId },
        select: { companyId: true },
      });
      companyIds = assignments.map(a => a.companyId);
    } else {
      // SUPER_ADMIN and EXPERT
      if (companyId) {
        companyIds = [companyId];
      } else {
        const companies = await prisma.company.findMany({
          where: {
            OR: [
              { userId },
              { isDemo: true },
            ],
          },
          select: { id: true },
        });
        companyIds = companies.map(c => c.id);
      }
    }

    if (companyIds.length === 0) {
      return NextResponse.json({ alerts: [], stats: { critical: 0, warning: 0, info: 0, resolved: 0 } });
    }

    // Fetch document types to check for missing documents
    const documentTypes = await prisma.documentType.findMany({
      where: { requiredForLevel: 'ES', isOptional: false },
    });

    // Fetch existing alerts from BnqAlert
    const existingAlerts = await prisma.bnqAlert.findMany({
      where: {
        companyId: { in: companyIds },
        isDismissed: false,
      },
      include: {
        company: { select: { name: true } },
      },
      orderBy: [
        { severity: 'desc' },
        { triggerDate: 'desc' },
      ],
    });

    // Generate dynamic alerts from missing documents
    const dynamicAlerts: any[] = [];
    
    for (const cId of companyIds) {
      const company = await prisma.company.findUnique({
        where: { id: cId },
        include: {
          documents: {
            where: { status: { not: 'ARCHIVED' } },
            select: { documentTypeId: true, status: true },
          },
        },
      });
      
      if (!company) continue;
      
      const uploadedDocTypeIds = new Set(company.documents.map(d => d.documentTypeId));
      const pendingDocs = company.documents.filter(d => d.status === 'PENDING_VALIDATION');
      
      // Missing documents alerts
      for (const docType of documentTypes) {
        if (!uploadedDocTypeIds.has(docType.id)) {
          dynamicAlerts.push({
            id: `missing-${cId}-${docType.id}`,
            type: 'DOCUMENT_MISSING',
            severity: 'WARNING',
            title: `Document manquant: ${docType.name}`,
            message: `Le document "${docType.name}" est requis pour la certification.`,
            companyId: cId,
            companyName: company.name,
            createdAt: new Date().toISOString(),
            isDynamic: true,
          });
        }
      }
      
      // Pending validation alerts (lower priority)
      if (pendingDocs.length > 0) {
        dynamicAlerts.push({
          id: `pending-${cId}`,
          type: 'DOCUMENT_PENDING',
          severity: 'INFO',
          title: `${pendingDocs.length} document(s) en attente de validation`,
          message: `${pendingDocs.length} document(s) sont en attente de validation pour ${company.name}.`,
          companyId: cId,
          companyName: company.name,
          createdAt: new Date().toISOString(),
          isDynamic: true,
        });
      }
    }

    // Combine and format alerts
    const formattedExisting = existingAlerts.map(a => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      companyId: a.companyId,
      companyName: a.company.name,
      createdAt: a.triggerDate.toISOString(),
      dueDate: a.dueDate?.toISOString(),
      isRead: a.isRead,
      isResolved: a.isResolved,
      isDynamic: false,
    }));

    const allAlerts = [...formattedExisting, ...dynamicAlerts];

    // Calculate stats
    const stats = {
      critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
      warning: allAlerts.filter(a => a.severity === 'WARNING').length,
      info: allAlerts.filter(a => a.severity === 'INFO').length,
      resolved: existingAlerts.filter(a => a.isResolved).length,
    };

    return NextResponse.json({
      alerts: allAlerts.slice(0, 50), // Limit to 50 most recent
      stats,
      totalMissingDocuments: dynamicAlerts.filter(a => a.type === 'DOCUMENT_MISSING').length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
