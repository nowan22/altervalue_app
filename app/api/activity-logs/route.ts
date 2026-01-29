import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type");

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    // Build where clause based on user role
    const where: any = {};
    
    // Filter by company if specified
    if (companyId) {
      where.companyId = companyId;
    } else if (userRole !== "SUPER_ADMIN" && userRole !== "EXPERT") {
      // Non-admin users only see their own activity
      where.userId = userId;
    }

    // Filter by type if specified
    if (type) {
      where.type = type;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      action,
      description,
      companyId,
      companyName,
      entityType,
      entityId,
      entityName,
      metadata,
    } = body;

    const user = session.user as any;

    const log = await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        type,
        action,
        description,
        companyId,
        companyName,
        entityType,
        entityId,
        entityName,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du log" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    
    // Only SUPER_ADMIN can purge logs
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const olderThanMonths = parseInt(searchParams.get("olderThanMonths") || "12");

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} logs supprimés (antérieurs à ${olderThanMonths} mois)`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error purging activity logs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la purge des logs" },
      { status: 500 }
    );
  }
}
