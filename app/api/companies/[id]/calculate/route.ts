export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { calculatePresenteeism } from "@/lib/presenteeism-calculator";

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

    // Récupérer les paramètres (ou utiliser les défauts)
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }

    const body = await request?.json?.().catch(() => ({})) ?? {};
    const presAbsCoefficient = body?.presAbsCoefficient ?? settings?.presAbsCoefficient ?? 1.3;
    const productivityLossCoeff = body?.productivityLossCoeff ?? settings?.productivityLossCoeff ?? 0.33;
    const workingDaysPerYear = body?.workingDaysPerYear ?? settings?.workingDaysPerYear ?? 220;

    const result = calculatePresenteeism({
      employeesCount: company.employeesCount,
      avgGrossSalary: company.avgGrossSalary,
      employerContributionRate: company.employerContributionRate,
      absenteeismRate: company.absenteeismRate,
      presAbsCoefficient,
      productivityLossCoeff,
      workingDaysPerYear,
    });

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        sector: company.sector,
        employeesCount: company.employeesCount,
        avgGrossSalary: company.avgGrossSalary,
        employerContributionRate: company.employerContributionRate,
        absenteeismRate: company.absenteeismRate,
      },
      result,
    });
  } catch (error) {
    console.error("Error calculating presenteeism:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul" },
      { status: 500 }
    );
  }
}
