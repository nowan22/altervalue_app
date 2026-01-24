import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateMethodB, calculateSurveyAggregate, SurveyResponseData } from '@/lib/method-b-calculator';

/**
 * POST /api/surveys/[surveyId]/calculate-preview
 * Calculate presenteeism (Method B) as indicative/preview even when survey is not closed
 * Returns calculation result with isIndicative flag
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId } = await params;

    // Get survey with company and responses
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        company: true,
        responses: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Enquête non trouvée' }, { status: 404 });
    }

    // Allow calculation for ACTIVE or CLOSED surveys
    if (survey.status !== 'ACTIVE' && survey.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'L\'enquête doit être active ou clôturée pour calculer' },
        { status: 400 }
      );
    }

    const responses = survey.responses;
    
    // Minimum 10 responses required
    if (responses.length < 10) {
      return NextResponse.json(
        { 
          error: 'Minimum 10 réponses requises pour le calcul',
          currentResponses: responses.length,
          minRequired: 10
        },
        { status: 400 }
      );
    }

    // Calculate aggregate from responses
    const responseData: SurveyResponseData[] = responses.map(r => ({
      q1Prevalence: r.q1Prevalence,
      q2EfficiencyPercent: r.q2EfficiencyPercent,
      q3Factors: r.q3Factors || undefined,
      q4Impact: r.q4Impact || undefined,
      q5WorkingHours: r.q5WorkingHours,
    }));

    const aggregateData = calculateSurveyAggregate(responseData);
    
    // Calculate Method B cost
    const company = survey.company;
    const responseRate = responses.length / company.employeesCount;
    
    let qualityFlag = 'LOW';
    if (responseRate >= 0.30) qualityFlag = 'HIGH';
    else if (responseRate >= 0.15) qualityFlag = 'MEDIUM';

    const methodBInput = {
      employeesCount: company.employeesCount,
      avgGrossSalary: company.avgGrossSalary,
      employerContributionRate: company.employerContributionRate,
      hoursPerYear: company.hoursPerYear ?? 1600,
      annualValueAdded: company.annualValueAdded ?? undefined,
      respondentsCount: aggregateData.respondentsCount,
      prevalence: aggregateData.prevalence,
      avgEfficiencyScore: aggregateData.avgEfficiencyScore,
    };

    const methodBResult = calculateMethodB(methodBInput);

    if (!methodBResult) {
      return NextResponse.json(
        { error: 'Erreur lors du calcul' },
        { status: 500 }
      );
    }

    // Return the indicative result
    const result = {
      isIndicative: survey.status === 'ACTIVE', // true if survey not closed yet
      calculatedAt: new Date().toISOString(),
      surveyStatus: survey.status,
      respondentsCount: aggregateData.respondentsCount,
      prevalence: aggregateData.prevalence,
      avgEfficiencyScore: aggregateData.avgEfficiencyScore,
      responseRate,
      qualityFlag,
      factorDistribution: aggregateData.factorDistribution,
      impactDistribution: aggregateData.impactDistribution,
      presCostB: methodBResult.presCostB,
      presCostBPct: methodBResult.presCostBPct,
      presCostBPerEmployee: methodBResult.presCostBPerEmployee,
      productivityLoss: methodBResult.productivityLoss,
      affectedEmployees: methodBResult.affectedEmployees,
      degradedHours: methodBResult.degradedHours,
      valuePerHour: methodBResult.valuePerHour,
      payroll: methodBResult.payroll,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating preview:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
