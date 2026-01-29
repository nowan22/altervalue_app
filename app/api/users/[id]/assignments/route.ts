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
