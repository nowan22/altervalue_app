import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    const configs = await prisma.alertConfig.findMany({
      where: { companyId },
    });

    return NextResponse.json({
      config: configs.map(c => ({
        type: c.alertType,
        enabled: c.enabled,
        severity: c.severity,
        reminderDays: c.reminderDays,
      })),
    });
  } catch (error) {
    console.error('Error fetching alert config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'EXPERT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, config } = body;

    if (!companyId || !config) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Upsert each alert configuration
    for (const item of config) {
      await prisma.alertConfig.upsert({
        where: {
          companyId_alertType: {
            companyId,
            alertType: item.type,
          },
        },
        create: {
          companyId,
          alertType: item.type,
          enabled: item.enabled,
          severity: item.severity,
          reminderDays: item.reminderDays || 30,
        },
        update: {
          enabled: item.enabled,
          severity: item.severity,
          reminderDays: item.reminderDays || 30,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving alert config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
