import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Get all mission assignments for a user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // For EXPERTS, return BOTH their owned companies AND their mission assignments
    if (user.role === 'EXPERT') {
      // Get owned companies (missions créées)
      const companies = await prisma.company.findMany({
        where: { userId: params.id },
        select: {
          id: true,
          name: true,
          sector: true,
          employeesCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform to match the assignment structure
      const ownedMissions = companies.map(company => ({
        id: `owned-${company.id}`,
        companyId: company.id,
        userId: params.id,
        assignedAt: company.createdAt,
        type: 'owned' as const, // Mark as owned mission
        company: {
          id: company.id,
          name: company.name,
          sector: company.sector,
          employeesCount: company.employeesCount,
        },
      }));

      // Get mission assignments (missions assignées)
      const assignments = await prisma.missionAssignment.findMany({
        where: { userId: params.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              sector: true,
              employeesCount: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      });

      const assignedMissions = assignments.map(a => ({
        ...a,
        type: 'assigned' as const, // Mark as assigned mission
      }));

      // Return both types
      return NextResponse.json({
        ownedMissions,
        assignedMissions,
      });
    }

    // For PILOTE_QVCT and OBSERVATEUR, return mission assignments only
    const assignments = await prisma.missionAssignment.findMany({
      where: { userId: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            sector: true,
            employeesCount: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assignations' },
      { status: 500 }
    );
  }
}

// POST: Assign a mission to a user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if current user is SUPER_ADMIN or EXPERT
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || !['SUPER_ADMIN', 'EXPERT'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Seuls les Super-Admin et Experts peuvent assigner des missions' },
        { status: 403 }
      );
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID de mission requis' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.missionAssignment.findUnique({
      where: {
        userId_companyId: {
          userId: params.id,
          companyId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cette mission est déjà assignée à cet utilisateur' },
        { status: 400 }
      );
    }

    const assignment = await prisma.missionAssignment.create({
      data: {
        userId: params.id,
        companyId,
        assignedBy: currentUser.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            sector: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'assignation' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a mission assignment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if current user is SUPER_ADMIN or EXPERT
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || !['SUPER_ADMIN', 'EXPERT'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Seuls les Super-Admin et Experts peuvent retirer des assignations' },
        { status: 403 }
      );
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID de mission requis' },
        { status: 400 }
      );
    }

    // Delete the mission assignment (works for all roles including EXPERT)
    await prisma.missionAssignment.delete({
      where: {
        userId_companyId: {
          userId: params.id,
          companyId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'assignation' },
      { status: 500 }
    );
  }
}
