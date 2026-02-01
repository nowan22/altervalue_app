import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { logActivityServer } from '@/lib/activity-logger';
import { Role } from '@prisma/client';

// GET: List campaigns (filtered by role and company access)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { missionAssignments: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    // Build where clause based on role
    let whereClause: any = {};

    if (companyId) {
      whereClause.companyId = companyId;
    } else {
      // Filter by accessible companies based on role
      if (user.role === 'PILOTE_QVCT' || user.role === 'OBSERVATEUR') {
        const assignedCompanyIds = user.missionAssignments.map((a: any) => a.companyId);
        whereClause.companyId = { in: assignedCompanyIds };
      } else if (user.role === 'EXPERT') {
        // Expert sees campaigns for their companies
        const expertCompanies = await prisma.company.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        whereClause.companyId = { in: expertCompanies.map((c: any) => c.id) };
      }
      // SUPER_ADMIN sees all
    }

    if (status) {
      whereClause.status = status;
    }

    const campaigns = await prisma.surveyCampaign.findMany({
      where: whereClause,
      include: {
        company: {
          select: { id: true, name: true },
        },
        surveyType: {
          select: { id: true, typeId: true, name: true, category: true, estimatedDuration: true, isModular: true },
        },
        _count: {
          select: { responses: true },
        },
        result: {
          select: { responseCount: true, participationRate: true, calculatedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des campagnes' },
      { status: 500 }
    );
  }
}

// POST: Create a new campaign
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { missionAssignments: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Check role - OBSERVATEUR cannot create campaigns
    if (user.role === 'OBSERVATEUR') {
      return NextResponse.json(
        { error: 'Les observateurs ne peuvent pas créer de campagnes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      companyId, 
      surveyTypeId, 
      name, 
      targetPopulation, 
      minRespondents,
      maxRespondents,
      scheduledStartDate, 
      scheduledEndDate 
    } = body;

    // Validate required fields
    if (!companyId || !surveyTypeId || !name) {
      return NextResponse.json(
        { error: 'Champs requis manquants: companyId, surveyTypeId, name' },
        { status: 400 }
      );
    }

    // Check company access
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Verify access based on role
    if (user.role === 'PILOTE_QVCT') {
      const hasAccess = user.missionAssignments.some(a => a.companyId === companyId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Vous n\'avez pas accès à cette mission' },
          { status: 403 }
        );
      }
    } else if (user.role === 'EXPERT' && company.userId !== user.id && !company.isDemo) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas accès à cette mission' },
        { status: 403 }
      );
    }

    // Verify survey type exists
    const surveyType = await prisma.surveyType.findUnique({
      where: { id: surveyTypeId },
    });

    if (!surveyType || !surveyType.isActive) {
      return NextResponse.json(
        { error: 'Type d\'enquête non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // Check if this is a BNQ Ultimate type that needs wizard configuration
    const isBNQUltimate = surveyType.typeId === 'BNQ_ULTIMATE' || surveyType.isModular;

    // Create campaign
    const campaign = await prisma.surveyCampaign.create({
      data: {
        companyId,
        surveyTypeId,
        name,
        targetPopulation: targetPopulation || null,
        minRespondents: minRespondents || surveyType.anonymityThreshold || 15,
        maxRespondents: maxRespondents || null,
        scheduledStartDate: scheduledStartDate ? new Date(scheduledStartDate) : null,
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
        createdById: user.id,
        status: 'DRAFT',
        // For BNQ Ultimate, set moduleConfig to empty/default state
        moduleConfig: isBNQUltimate ? { needsFullConfig: true } : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        surveyType: { select: { id: true, typeId: true, name: true, isModular: true } },
      },
    });

    // Log activity

    // Return redirect info for BNQ Ultimate types
    if (isBNQUltimate) {
      return NextResponse.json({
        ...campaign,
        redirectToWizard: true,
        wizardUrl: `/dashboard/diagnostic/campaigns/${campaign.id}/configure`,
      }, { status: 201 });
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    
    // Return standardized error response
    const errorResponse = {
      success: false,
      code: 'CAMPAIGN_CREATE_ERROR',
      message: 'Erreur lors de la création de la campagne',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    };
    
    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      errorResponse.code = 'DUPLICATE_ENTRY';
      errorResponse.message = 'Une campagne avec ces paramètres existe déjà';
    } else if (error?.code === 'P2003') {
      errorResponse.code = 'FOREIGN_KEY_ERROR';
      errorResponse.message = 'Référence invalide (entreprise ou type d\'enquête)';
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
