import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// POST /api/surveys/configure - Create a new survey campaign with configuration
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Only SUPER_ADMIN and EXPERT can create surveys
    if (!['SUPER_ADMIN', 'EXPERT'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Accès réservé aux experts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      companyId,
      surveyTypeId,
      // Module configuration
      module2Enabled,
      module3Enabled,
      module3Consent,
      // ROI parameters
      averageDailyRate,
      // Anonymity
      anonymityThreshold,
      // Dates
      scheduledStartDate,
      scheduledEndDate,
      // Target
      targetPopulation,
      minRespondents,
      maxRespondents,
    } = body;

    // Validation
    if (!name || !companyId || !surveyTypeId) {
      return NextResponse.json(
        { error: 'Nom, mission et type d\'enquête requis' },
        { status: 400 }
      );
    }

    // Check company exists and user has access
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { userId },
          { isDemo: true },
          {
            missionAssignments: {
              some: { userId },
            },
          },
        ],
      },
      include: { departments: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Mission non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    // Check survey type exists
    const surveyType = await prisma.surveyType.findUnique({
      where: { id: surveyTypeId },
    });

    if (!surveyType) {
      return NextResponse.json(
        { error: 'Type d\'enquête non trouvé' },
        { status: 404 }
      );
    }

    // Build active modules array (0 and 1 are always active)
    const activeModules = [0, 1];
    if (module2Enabled) activeModules.push(2);
    if (module3Enabled) activeModules.push(3);

    // Build module config
    const moduleConfig: Record<string, any> = {};
    
    // ROI parameters (for presenteeism calculation)
    if (averageDailyRate) {
      moduleConfig.roi = {
        averageDailyRate: parseFloat(averageDailyRate),
      };
    }

    // Get departments for custom services
    const customServices = company.departments
      .filter((d: { isActive: boolean }) => d.isActive)
      .map((d: { code: string; name: string; headcount: number | null }) => ({
        code: d.code,
        label: d.name,
        headcount: d.headcount,
      }));

    // Determine anonymity threshold (30 if Module 3 is enabled)
    const finalAnonymityThreshold = module3Enabled
      ? Math.max(anonymityThreshold || 15, 30)
      : anonymityThreshold || 15;

    // Create the campaign
    const campaign = await prisma.surveyCampaign.create({
      data: {
        companyId,
        surveyTypeId,
        name,
        createdById: userId,
        status: 'DRAFT',
        activeModules,
        moduleConfig,
        customServices: customServices.length > 0 ? customServices : undefined,
        anonymityThreshold: finalAnonymityThreshold,
        module3Enabled: module3Enabled || false,
        module3Consent: module3Consent || false,
        targetPopulation: targetPopulation ? parseInt(targetPopulation) : null,
        minRespondents: minRespondents ? parseInt(minRespondents) : finalAnonymityThreshold,
        maxRespondents: maxRespondents ? parseInt(maxRespondents) : null,
        scheduledStartDate: scheduledStartDate ? new Date(scheduledStartDate) : null,
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
      },
      include: {
        company: true,
        surveyType: true,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating survey campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/surveys/configure - Update an existing campaign configuration
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Only SUPER_ADMIN and EXPERT can update surveys
    if (!['SUPER_ADMIN', 'EXPERT'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Accès réservé aux experts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      campaignId,
      // Module configuration
      module2Enabled,
      module3Enabled,
      module3Consent,
      // ROI parameters
      averageDailyRate,
      // Anonymity
      anonymityThreshold,
      // Dates
      scheduledStartDate,
      scheduledEndDate,
      // Target
      targetPopulation,
      minRespondents,
      maxRespondents,
      // Custom services
      customServices,
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'ID de campagne requis' },
        { status: 400 }
      );
    }

    // Check campaign exists and user has access
    const existing = await prisma.surveyCampaign.findUnique({
      where: { id: campaignId },
      include: {
        company: { include: { departments: { where: { isActive: true } } } },
        surveyType: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Cannot update active or completed campaigns
    if (existing.status === 'ACTIVE' || existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Impossible de modifier une campagne lancée ou terminée' },
        { status: 400 }
      );
    }

    // Build active modules array
    const activeModules = [0, 1];
    if (module2Enabled) activeModules.push(2);
    if (module3Enabled) activeModules.push(3);

    // Build module config
    const moduleConfig: Record<string, any> = existing.moduleConfig as Record<string, any> || {};
    delete moduleConfig.needsFullConfig; // Remove the flag since we're configuring now
    
    if (averageDailyRate) {
      moduleConfig.roi = {
        averageDailyRate: parseFloat(averageDailyRate),
      };
    }

    // Determine final anonymity threshold
    const finalAnonymityThreshold = module3Enabled
      ? Math.max(anonymityThreshold || 15, 30)
      : anonymityThreshold || 15;

    // Use provided custom services or get from company departments
    let finalCustomServices = customServices;
    if (!finalCustomServices && existing.company.departments.length > 0) {
      finalCustomServices = existing.company.departments
        .filter((d: { isActive: boolean }) => d.isActive)
        .map((d: { code: string; name: string; headcount: number | null }) => ({
          code: d.code,
          label: d.name,
          headcount: d.headcount,
        }));
    }

    // Update the campaign
    const campaign = await prisma.surveyCampaign.update({
      where: { id: campaignId },
      data: {
        activeModules,
        moduleConfig,
        customServices: finalCustomServices || undefined,
        anonymityThreshold: finalAnonymityThreshold,
        module3Enabled: module3Enabled || false,
        module3Consent: module3Consent || false,
        targetPopulation: targetPopulation ? parseInt(targetPopulation) : null,
        minRespondents: minRespondents ? parseInt(minRespondents) : finalAnonymityThreshold,
        maxRespondents: maxRespondents ? parseInt(maxRespondents) : null,
        scheduledStartDate: scheduledStartDate ? new Date(scheduledStartDate) : null,
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
      },
      include: {
        company: true,
        surveyType: true,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating survey campaign:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/surveys/configure?campaignId=xxx - Get campaign configuration
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'ID campagne requis' },
        { status: 400 }
      );
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: campaignId },
      include: {
        company: {
          include: { departments: { where: { isActive: true } } },
        },
        surveyType: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
