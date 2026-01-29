import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { logActivityServer } from '@/lib/activity-logger';
import { SurveyCalculationEngine } from '@/lib/survey-calculation-engine';

// PATCH: Close a campaign and calculate results
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
        company: true,
        surveyType: true,
        responses: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Only ACTIVE can be closed
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Seules les campagnes actives peuvent être clôturées' },
        { status: 400 }
      );
    }

    // Check minimum responses
    const responseCount = campaign.responses.length;
    if (responseCount < campaign.minRespondents) {
      return NextResponse.json(
        { 
          error: `Nombre de réponses insuffisant. Minimum requis: ${campaign.minRespondents}, actuel: ${responseCount}`,
          responseCount,
          minRequired: campaign.minRespondents,
        },
        { status: 400 }
      );
    }

    // Calculate results
    const engine = new SurveyCalculationEngine(campaign.surveyType.definition);
    const responsesData = campaign.responses.map((r: any) => r.responses as Record<string, any>);
    
    const companyParams = {
      headcount: campaign.company.employeesCount,
      avgGrossSalary: campaign.company.avgGrossSalary,
      employerContributionRate: campaign.company.employerContributionRate,
      hoursPerYear: campaign.company.hoursPerYear,
      annualValueAdded: campaign.company.annualValueAdded || undefined,
    };

    const calculationResult = engine.calculate(
      responsesData,
      companyParams,
      campaign.targetPopulation || undefined
    );

    // Save results
    await prisma.campaignResult.upsert({
      where: { campaignId: campaign.id },
      create: {
        campaignId: campaign.id,
        responseCount: calculationResult.responseCount,
        participationRate: calculationResult.participationRate,
        scores: calculationResult.scores,
        criticalIndicators: calculationResult.criticalIndicators,
        financialMetrics: calculationResult.financialMetrics || undefined,
        qualitativeInsights: calculationResult.qualitativeInsights || undefined,
        narrative: calculationResult.narrative,
        calculatedAt: new Date(),
      },
      update: {
        responseCount: calculationResult.responseCount,
        participationRate: calculationResult.participationRate,
        scores: calculationResult.scores,
        criticalIndicators: calculationResult.criticalIndicators,
        financialMetrics: calculationResult.financialMetrics || undefined,
        qualitativeInsights: calculationResult.qualitativeInsights || undefined,
        narrative: calculationResult.narrative,
        calculatedAt: new Date(),
      },
    });

    // Update campaign status
    const updated = await prisma.surveyCampaign.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        closedAt: new Date(),
      },
    });

    // Log activity

    return NextResponse.json({
      ...updated,
      message: 'Campagne clôturée et résultats calculés',
      result: calculationResult,
    });
  } catch (error) {
    console.error('Error closing campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la clôture de la campagne' },
      { status: 500 }
    );
  }
}
