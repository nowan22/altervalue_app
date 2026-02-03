export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logActivityServer } from '@/lib/activity-logger';

// DELETE: Clear all synthetic (demo) responses from a campaign
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Check SUPER_ADMIN role
    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les Super-Administrateurs peuvent supprimer les données de démo.' },
        { status: 403 }
      );
    }

    // Get campaign with company info
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Check company is demo
    if (!campaign.company.isDemo) {
      return NextResponse.json(
        { error: 'Cette fonctionnalité est réservée aux missions de démonstration.' },
        { status: 403 }
      );
    }

    // Parse request body for options
    let syntheticOnly = true;
    try {
      const body = await request.json();
      syntheticOnly = body.syntheticOnly !== false; // Default to true
    } catch {
      // No body provided, use defaults
    }

    // Count responses before deletion
    const countBefore = await prisma.campaignResponse.count({
      where: syntheticOnly 
        ? { campaignId: params.id, isSynthetic: true }
        : { campaignId: params.id },
    });

    // Delete responses
    const deleteResult = await prisma.campaignResponse.deleteMany({
      where: syntheticOnly 
        ? { campaignId: params.id, isSynthetic: true }
        : { campaignId: params.id },
    });

    // Also delete the campaign result if exists (to force recalculation)
    if (deleteResult.count > 0) {
      await prisma.campaignResult.deleteMany({
        where: { campaignId: params.id },
      });
    }

    // Log activity
    await logActivityServer(prisma, {
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email,
      userRole: user.role,
      type: 'DEMO_DATA_GENERATED',
      action: `Suppression de ${deleteResult.count} réponses${syntheticOnly ? ' synthétiques' : ''}`,
      description: `Campagne "${campaign.name}" - Données de démo réinitialisées`,
      companyId: campaign.companyId,
      companyName: campaign.company.name,
      entityType: 'campaign',
      entityId: campaign.id,
      entityName: campaign.name,
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} réponses supprimées avec succès.`,
      deletedCount: deleteResult.count,
      syntheticOnly,
    });
  } catch (error) {
    console.error('Error clearing campaign responses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des réponses' },
      { status: 500 }
    );
  }
}
