export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculatePresenteeism } from "@/lib/presenteeism-calculator";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const kpis = await prisma.kpiSnapshot.findMany({
      where: { companyId: params.id },
      orderBy: { periodDate: 'asc' },
    });

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des KPI" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!company) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const kpis = body.kpis;

    if (!Array.isArray(kpis) || kpis.length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée KPI fournie" },
        { status: 400 }
      );
    }

    // Récupérer les paramètres
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    const createdKpis = [];
    const errors = [];

    for (let i = 0; i < kpis.length; i++) {
      const kpi = kpis[i];
      
      try {
        if (!kpi.periodDate) {
          errors.push({ row: i + 1, error: "Date de période manquante" });
          continue;
        }

        // Utiliser les valeurs du KPI ou celles de l'entreprise
        const employeesCount = kpi.employeesCount ?? company.employeesCount;
        const avgGrossSalary = kpi.avgGrossSalary ?? company.avgGrossSalary;
        const employerContributionRate = kpi.employerContributionRate ?? company.employerContributionRate;
        const absenteeismRate = kpi.absenteeismRate ?? company.absenteeismRate;

        // Calculer le présentéisme
        const calcResult = calculatePresenteeism({
          employeesCount,
          avgGrossSalary,
          employerContributionRate,
          absenteeismRate,
          presAbsCoefficient: settings?.presAbsCoefficient ?? 1.3,
          productivityLossCoeff: settings?.productivityLossCoeff ?? 0.33,
          workingDaysPerYear: settings?.workingDaysPerYear ?? 220,
        });

        // Vérifier si un KPI existe déjà pour cette période
        const existingKpi = await prisma.kpiSnapshot.findFirst({
          where: {
            companyId: params.id,
            periodDate: new Date(kpi.periodDate),
          },
        });

        const kpiData = {
          companyId: params.id,
          periodDate: new Date(kpi.periodDate),
          periodType: kpi.periodType || 'MONTHLY',
          employeesCount,
          avgGrossSalary,
          employerContributionRate,
          absenteeismRate,
          turnoverRate: kpi.turnoverRate ?? null,
          avgSeniorityYears: kpi.avgSeniorityYears ?? null,
          atMpGravityRate: kpi.atMpGravityRate ?? null,
          engagementScore: kpi.engagementScore ?? null,
          presRateCalculated: calcResult.presRate,
          presDaysCalculated: calcResult.presDays,
          productivityLoss: calcResult.productivityLoss,
          presCostCalculated: calcResult.presCost,
          presCostPerEmployee: calcResult.presCostPerEmployee,
        };

        let createdKpi;
        if (existingKpi) {
          createdKpi = await prisma.kpiSnapshot.update({
            where: { id: existingKpi.id },
            data: kpiData,
          });
        } else {
          createdKpi = await prisma.kpiSnapshot.create({
            data: kpiData,
          });
        }

        createdKpis.push(createdKpi);
      } catch (err) {
        errors.push({ row: i + 1, error: "Erreur de traitement" });
      }
    }

    return NextResponse.json({
      success: createdKpis.length,
      errors: errors.length,
      errorDetails: errors,
      kpis: createdKpis,
    });
  } catch (error) {
    console.error("Error creating KPIs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création des KPI" },
      { status: 500 }
    );
  }
}
