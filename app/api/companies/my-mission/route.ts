import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculatePresenteeism, getSignalColor } from '@/lib/presenteeism-calculator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    let company = null;

    // For PILOTE_QVCT and OBSERVATEUR, use their assignment
    if (userRole === 'PILOTE_QVCT' || userRole === 'OBSERVATEUR') {
      const assignment = await prisma.missionAssignment.findFirst({
        where: { userId },
        include: {
          company: {
            include: {
              kpis: {
                orderBy: { periodDate: 'desc' },
                take: 12,
              },
              bnqProgress: true,
            },
          },
        },
      });
      company = assignment?.company || null;
    } else {
      // For SUPER_ADMIN and EXPERT, use the provided companyId or fetch the first one
      if (companyIdParam) {
        company = await prisma.company.findUnique({
          where: { id: companyIdParam },
          include: {
            kpis: {
              orderBy: { periodDate: 'desc' },
              take: 12,
            },
            bnqProgress: true,
          },
        });
      } else {
        // Get first available company for the user
        company = await prisma.company.findFirst({
          where: {
            OR: [
              { userId },
              { isDemo: true },
            ],
          },
          include: {
            kpis: {
              orderBy: { periodDate: 'desc' },
              take: 12,
            },
            bnqProgress: true,
          },
        });
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Aucune mission trouvée' }, { status: 404 });
    }

    // Fetch settings for calculation
    const settings = await prisma.settings.findFirst();

    // Calculate presenteeism
    let calculationResult = null;
    if (settings) {
      const result = calculatePresenteeism({
        employeesCount: company.employeesCount,
        avgGrossSalary: company.avgGrossSalary,
        employerContributionRate: company.employerContributionRate / 100,
        absenteeismRate: company.absenteeismRate,
        presAbsCoefficient: settings.presAbsCoefficient,
        productivityLossCoeff: settings.productivityLossCoeff,
        workingDaysPerYear: settings.workingDaysPerYear,
      });

      const signalColor = getSignalColor(
        result.presCostPctPayroll,
        settings.presCostGreenMaxPct,
        settings.presCostOrangeMaxPct
      );

      calculationResult = {
        presRate: result.presRate,
        presDays: result.presDays,
        productivityLoss: result.productivityLoss,
        presCost: result.presCost,
        presCostPerEmployee: result.presCostPerEmployee,
        presCostPctPayroll: result.presCostPctPayroll,
        signalColor,
      };
    }

    // Serialize data
    const serializedCompany = {
      id: company.id,
      name: company.name,
      sector: company.sector,
      employeesCount: company.employeesCount,
      avgGrossSalary: company.avgGrossSalary,
      employerContributionRate: company.employerContributionRate,
      absenteeismRate: company.absenteeismRate,
      createdAt: company.createdAt.toISOString(),
      bnqProgress: company.bnqProgress
        ? {
            targetLevel: company.bnqProgress.targetLevel,
            currentProgress: company.bnqProgress.currentProgress,
            documentsProgress: company.bnqProgress.documentsProgress,
            workflowProgress: company.bnqProgress.workflowProgress,
          }
        : null,
    };

    return NextResponse.json({
      company: serializedCompany,
      calculationResult,
    });
  } catch (error) {
    console.error('Error fetching mission data:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
