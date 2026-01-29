import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET: Get campaign details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            employeesCount: true,
            avgGrossSalary: true,
            employerContributionRate: true,
            hoursPerYear: true,
            annualValueAdded: true,
          },
        },
        surveyType: true,
        _count: {
          select: { responses: true },
        },
        result: true,
        deliverables: {
          orderBy: { generatedAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la campagne' },
      { status: 500 }
    );
  }
}

// PUT: Update campaign
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Only allow updates on DRAFT or SCHEDULED campaigns
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Seules les campagnes en brouillon peuvent être modifiées' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, targetPopulation, minRespondents, maxRespondents, scheduledStartDate, scheduledEndDate } = body;

    const updated = await prisma.surveyCampaign.update({
      where: { id: params.id },
      data: {
        name: name || campaign.name,
        targetPopulation: targetPopulation !== undefined ? targetPopulation : campaign.targetPopulation,
        minRespondents: minRespondents || campaign.minRespondents,
        maxRespondents: maxRespondents !== undefined ? maxRespondents : campaign.maxRespondents,
        scheduledStartDate: scheduledStartDate ? new Date(scheduledStartDate) : campaign.scheduledStartDate,
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : campaign.scheduledEndDate,
      },
      include: {
        company: { select: { id: true, name: true } },
        surveyType: { select: { id: true, typeId: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la campagne' },
      { status: 500 }
    );
  }
}

// DELETE: Delete campaign (only DRAFT)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Only allow deletion of DRAFT campaigns
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Seules les campagnes en brouillon peuvent être supprimées' },
        { status: 400 }
      );
    }

    await prisma.surveyCampaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la campagne' },
      { status: 500 }
    );
  }
}
