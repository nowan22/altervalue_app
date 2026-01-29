import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { logActivityServer } from '@/lib/activity-logger';

// PATCH: Launch a campaign
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true } },
        surveyType: { select: { name: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Only DRAFT or SCHEDULED can be launched
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Cette campagne ne peut pas être lancée' },
        { status: 400 }
      );
    }

    const updated = await prisma.surveyCampaign.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        launchedAt: new Date(),
      },
    });

    // Log activity

    return NextResponse.json({
      ...updated,
      message: 'Campagne lancée avec succès',
      surveyUrl: `/survey/${updated.token}`,
    });
  } catch (error) {
    console.error('Error launching campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors du lancement de la campagne' },
      { status: 500 }
    );
  }
}
