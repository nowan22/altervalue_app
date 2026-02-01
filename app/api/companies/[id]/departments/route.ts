import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/companies/[id]/departments - List all departments for a company
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      where: { companyId: params.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/companies/[id]/departments - Create a new department
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, headcount } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code et nom requis' },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Mission non trouvée' },
        { status: 404 }
      );
    }

    // Get max sortOrder
    const maxOrder = await prisma.department.findFirst({
      where: { companyId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const department = await prisma.department.create({
      data: {
        companyId: params.id,
        code: code.toUpperCase().replace(/\s+/g, '_'),
        name,
        headcount: headcount ? parseInt(headcount) : null,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un département avec ce code existe déjà' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/companies/[id]/departments - Bulk update departments
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { departments } = body;

    if (!Array.isArray(departments)) {
      return NextResponse.json(
        { error: 'Format invalide' },
        { status: 400 }
      );
    }

    // Upsert all departments
    const results = await Promise.all(
      departments.map(async (dept: any, index: number) => {
        if (dept.id) {
          // Update existing
          return prisma.department.update({
            where: { id: dept.id },
            data: {
              code: dept.code.toUpperCase().replace(/\s+/g, '_'),
              name: dept.name,
              headcount: dept.headcount ? parseInt(dept.headcount) : null,
              sortOrder: index,
              isActive: dept.isActive !== false,
            },
          });
        } else {
          // Create new
          return prisma.department.create({
            data: {
              companyId: params.id,
              code: dept.code.toUpperCase().replace(/\s+/g, '_'),
              name: dept.name,
              headcount: dept.headcount ? parseInt(dept.headcount) : null,
              sortOrder: index,
            },
          });
        }
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error updating departments:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/companies/[id]/departments - Delete a department (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { error: 'ID département requis' },
        { status: 400 }
      );
    }

    await prisma.department.update({
      where: { id: departmentId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
