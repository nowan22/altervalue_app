export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux Super-Administrateurs' }, { status: 403 });
    }

    const demoCompanies = await prisma.company.findMany({
      where: { isDemo: true },
      include: {
        surveyCampaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            launchedAt: true,
            _count: {
              select: { responses: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      demoCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        sector: c.sector,
        employeesCount: c.employeesCount,
        campaigns: c.surveyCampaigns,
      }))
    );
  } catch (error) {
    console.error('Error fetching demo missions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
