export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivityServer } from "@/lib/activity-logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sector = searchParams.get('sector') || '';
    const showDemo = searchParams.get('showDemo') === 'true';

    const userId = (session.user as any).id;

    const where: any = {
      OR: [
        { userId },
        { isDemo: true },
      ],
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (sector) {
      where.sector = sector;
    }

    if (!showDemo) {
      where.OR = [{ userId }];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        kpis: {
          orderBy: { periodDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dossiers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sector,
      country,
      employeesCount,
      avgGrossSalary,
      employerContributionRate,
      absenteeismRate,
    } = body;

    if (!name || !sector || !employeesCount || !avgGrossSalary || !employerContributionRate || absenteeismRate === undefined) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Get full user for logging
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const company = await prisma.company.create({
      data: {
        name,
        sector,
        country: country || 'France',
        employeesCount: parseInt(employeesCount),
        avgGrossSalary: parseFloat(avgGrossSalary),
        employerContributionRate: parseFloat(employerContributionRate),
        absenteeismRate: parseFloat(absenteeismRate),
        userId,
        // Initialize BNQ progress for new companies
        bnqProgress: {
          create: {
            targetLevel: 'ES',
            currentProgress: 0,
            documentsProgress: 0,
            workflowProgress: 0,
            checklistProgress: 0,
            actionsProgress: 0,
          },
        },
      },
    });

    // Log activity
    if (user) {
      await logActivityServer(prisma, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
        userRole: user.role,
        type: 'MISSION_CREATED',
        action: `Création de la mission "${name}"`,
        description: `Secteur: ${sector}, ${employeesCount} employés`,
        companyId: company.id,
        companyName: company.name,
        entityType: 'company',
        entityId: company.id,
        entityName: company.name,
      });
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du dossier" },
      { status: 500 }
    );
  }
}
