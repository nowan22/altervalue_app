import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { SurveyCalculationEngine } from '@/lib/survey-calculation-engine';

// POST: Recalculate results for a campaign
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

    // Check anonymity threshold
    const anonymityThreshold = campaign.surveyType.anonymityThreshold || 15;
    const meetsThreshold = calculationResult.responseCount >= anonymityThreshold;

    // Save or update results
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

    return NextResponse.json({
      result: calculationResult,
      meetsAnonymityThreshold: meetsThreshold,
      anonymityThreshold,
      message: meetsThreshold 
        ? 'Résultats calculés avec succès'
        : `Attention: seuil d'anonymat non atteint (${calculationResult.responseCount}/${anonymityThreshold})`,
    });
  } catch (error) {
    console.error('Error calculating results:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des résultats' },
      { status: 500 }
    );
  }
}
