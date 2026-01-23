import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateMethodB, calculateSurveyAggregate, SurveyResponseData } from '@/lib/method-b-calculator';

// GET /api/surveys/[surveyId] - Get survey details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId } = await params;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        company: true,
        aggregate: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Enquête non trouvée' }, { status: 404 });
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/surveys/[surveyId] - Update survey (status, dates, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId } = await params;
    const body = await request.json();
    const { status, title, description, startDate, endDate } = body;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { company: true }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Enquête non trouvée' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    
    if (status !== undefined) {
      updateData.status = status;
      
      // If closing the survey, calculate aggregates
      if (status === 'CLOSED') {
        updateData.closedAt = new Date();
        
        // Get all responses and calculate aggregate
        const responses = await prisma.surveyResponse.findMany({
          where: { surveyId }
        });

        if (responses.length >= 10) {
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
          const avgTotalSalary = company.avgGrossSalary * (1 + company.employerContributionRate);
          const payroll = avgTotalSalary * company.employeesCount;
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

          // Upsert aggregate
          await prisma.surveyAggregate.upsert({
            where: { surveyId },
            create: {
              surveyId,
              respondentsCount: aggregateData.respondentsCount,
              prevalence: aggregateData.prevalence,
              avgEfficiencyScore: aggregateData.avgEfficiencyScore,
              responseRate,
              qualityFlag,
              factorDistribution: JSON.stringify(aggregateData.factorDistribution),
              impactDistribution: JSON.stringify(aggregateData.impactDistribution),
              workingHoursDistribution: JSON.stringify(aggregateData.workingHoursDistribution),
              presCostB: methodBResult?.presCostB,
              presCostBPct: methodBResult?.presCostBPct,
              presCostBPerEmployee: methodBResult?.presCostBPerEmployee,
              calculatedAt: new Date(),
            },
            update: {
              respondentsCount: aggregateData.respondentsCount,
              prevalence: aggregateData.prevalence,
              avgEfficiencyScore: aggregateData.avgEfficiencyScore,
              responseRate,
              qualityFlag,
              factorDistribution: JSON.stringify(aggregateData.factorDistribution),
              impactDistribution: JSON.stringify(aggregateData.impactDistribution),
              workingHoursDistribution: JSON.stringify(aggregateData.workingHoursDistribution),
              presCostB: methodBResult?.presCostB,
              presCostBPct: methodBResult?.presCostBPct,
              presCostBPerEmployee: methodBResult?.presCostBPerEmployee,
              calculatedAt: new Date(),
            }
          });
        }
      }
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: updateData,
      include: {
        company: true,
        aggregate: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    return NextResponse.json(updatedSurvey);
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/surveys/[surveyId] - Delete a survey
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId } = await params;

    await prisma.survey.delete({
      where: { id: surveyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
