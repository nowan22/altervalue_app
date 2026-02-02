export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivityServer } from "@/lib/activity-logger";

export async function GET(
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
      include: {
        kpis: {
          orderBy: { periodDate: 'desc' },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du dossier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const userId = (session.user as any).id;

    // Get user for role check
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    if (existingCompany.userId !== userId && !existingCompany.isDemo) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // v4.2: Build update data - only SUPER_ADMIN can modify isDemo
    const updateData: any = {
      name: body.name,
      sector: body.sector,
      country: body.country,
      employeesCount: parseInt(body.employeesCount),
      avgGrossSalary: parseFloat(body.avgGrossSalary),
      employerContributionRate: parseFloat(body.employerContributionRate),
      absenteeismRate: parseFloat(body.absenteeismRate),
    };

    // Only SUPER_ADMIN can change isDemo flag
    if (isSuperAdmin && body.isDemo !== undefined) {
      updateData.isDemo = body.isDemo === true;
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log activity
    if (user) {
      const demoChanged = isSuperAdmin && body.isDemo !== undefined && existingCompany.isDemo !== company.isDemo;
      await logActivityServer(prisma, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
        userRole: user.role,
        type: 'MISSION_UPDATED',
        action: `Modification de la mission "${company.name}"${company.isDemo ? ' (DÉMO)' : ''}`,
        description: demoChanged 
          ? `Statut démo: ${existingCompany.isDemo ? 'Désactivé' : 'Activé'}`
          : `Mise à jour des informations`,
        companyId: company.id,
        companyName: company.name,
        entityType: 'company',
        entityId: company.id,
        entityName: company.name,
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du dossier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    if (existingCompany.userId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (existingCompany.isDemo) {
      return NextResponse.json(
        { error: "Impossible de supprimer un dossier de démonstration" },
        { status: 403 }
      );
    }

    // Log activity before deletion
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await logActivityServer(prisma, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email,
        userRole: user.role,
        type: 'MISSION_DELETED',
        action: `Suppression de la mission "${existingCompany.name}"`,
        description: `Mission supprimée définitivement`,
        companyName: existingCompany.name,
        entityType: 'company',
        entityName: existingCompany.name,
      });
    }

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Dossier supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du dossier" },
      { status: 500 }
    );
  }
}
