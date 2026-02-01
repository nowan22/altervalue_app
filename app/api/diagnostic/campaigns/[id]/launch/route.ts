import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { logActivityServer } from '@/lib/activity-logger';

// PATCH: Launch a campaign
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, employeesCount: true } },
        surveyType: { select: { name: true, typeId: true, isModular: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Only DRAFT or SCHEDULED can be launched
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Cette campagne ne peut pas être lancée' },
        { status: 400 }
      );
    }

    // Guardrail: Block Module 3 if company has < 50 employees
    if (campaign.module3Enabled && campaign.company.employeesCount < 50) {
      return NextResponse.json(
        { 
          success: false,
          code: 'MODULE3_BLOCKED',
          error: `Le Module 3 (données sensibles) nécessite un effectif minimum de 50 personnes. L'entreprise "${campaign.company.name}" a ${campaign.company.employeesCount} salariés. Veuillez désactiver le Module 3 pour lancer cette campagne.`
        },
        { status: 400 }
      );
    }

    // Guardrail: Check if BNQ campaign needs configuration
    const isBNQType = campaign.surveyType.typeId === 'BNQ_ULTIMATE' || campaign.surveyType.isModular;
    const moduleConfig = campaign.moduleConfig as Record<string, any> | null;
    if (isBNQType && moduleConfig?.needsFullConfig) {
      return NextResponse.json(
        {
          success: false,
          code: 'CONFIG_REQUIRED',
          error: 'Cette campagne BNQ Ultimate nécessite une configuration avant le lancement. Veuillez accéder à la page de configuration.'
        },
        { status: 400 }
      );
    }

    // Guardrail: Anonymity threshold > target population
    const targetPop = campaign.targetPopulation || campaign.company.employeesCount;
    if (campaign.anonymityThreshold > targetPop) {
      return NextResponse.json(
        {
          success: false,
          code: 'ANONYMITY_THRESHOLD_ERROR',
          error: `Le seuil d'anonymat (${campaign.anonymityThreshold}) dépasse la population cible (${targetPop}). Veuillez ajuster la configuration.`
        },
        { status: 400 }
      );
    }

    const updated = await prisma.surveyCampaign.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        launchedAt: new Date(),
      },
    });

    // Log activity

    return NextResponse.json({
      ...updated,
      message: 'Campagne lancée avec succès',
      surveyUrl: `/survey/${updated.token}`,
    });
  } catch (error) {
    console.error('Error launching campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors du lancement de la campagne' },
      { status: 500 }
    );
  }
}
