import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// GET: Get questionnaire for a campaign (public, no auth required)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { token: params.token },
      include: {
        surveyType: {
          select: {
            name: true,
            definition: true,
            estimatedDuration: true,
            anonymityThreshold: true,
          },
        },
        company: {
          select: { name: true },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Enquête non trouvée', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        DRAFT: 'Cette enquête n\'a pas encore été lancée.',
        SCHEDULED: 'Cette enquête n\'a pas encore démarré.',
        CLOSED: 'Cette enquête est terminée.',
        COMPLETED: 'Cette enquête est terminée.',
        ARCHIVED: 'Cette enquête n\'est plus disponible.',
      };
      return NextResponse.json(
        { 
          error: statusMessages[campaign.status] || 'Enquête non disponible',
          code: 'CAMPAIGN_NOT_ACTIVE',
          status: campaign.status,
        },
        { status: 400 }
      );
    }

    // Check if max respondents reached
    if (campaign.maxRespondents && campaign._count.responses >= campaign.maxRespondents) {
      return NextResponse.json(
        { 
          error: 'Le nombre maximum de réponses a été atteint pour cette enquête.',
          code: 'MAX_RESPONDENTS_REACHED',
        },
        { status: 400 }
      );
    }

    // Check end date
    if (campaign.scheduledEndDate && new Date() > campaign.scheduledEndDate) {
      return NextResponse.json(
        { 
          error: 'La période de réponse à cette enquête est terminée.',
          code: 'CAMPAIGN_ENDED',
        },
        { status: 400 }
      );
    }

    // Extract questionnaire from definition
    const definition = campaign.surveyType.definition as any;
    const questionnaire = definition?.questionnaire_structure || {};
    const metadata = definition?.survey_metadata || {};
    const dataGovernance = definition?.data_governance || {};

    return NextResponse.json({
      campaignName: campaign.name,
      companyName: campaign.company.name,
      surveyTypeName: campaign.surveyType.name,
      estimatedDuration: campaign.surveyType.estimatedDuration,
      anonymityThreshold: campaign.surveyType.anonymityThreshold,
      questionnaire,
      metadata: {
        name: metadata.name,
        framework: metadata.framework,
        primary_objective: metadata.primary_objective,
      },
      dataGovernance: {
        anonymity_threshold: dataGovernance.anonymity_threshold,
        rgpd_compliant: dataGovernance.rgpd_compliant,
      },
      currentResponses: campaign._count.responses,
      endDate: campaign.scheduledEndDate,
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'enquête' },
      { status: 500 }
    );
  }
}

// POST: Submit a response (public, no auth required)
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { token: params.token },
      include: {
        surveyType: true,
        _count: { select: { responses: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Enquête non trouvée' },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cette enquête n\'accepte plus de réponses' },
        { status: 400 }
      );
    }

    // Check max respondents
    if (campaign.maxRespondents && campaign._count.responses >= campaign.maxRespondents) {
      return NextResponse.json(
        { error: 'Le nombre maximum de réponses a été atteint' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { responses, fingerprint } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Réponses invalides' },
        { status: 400 }
      );
    }

    // Generate anonymous hash from fingerprint or random
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const hashInput = fingerprint || `${ip}-${userAgent}-${Date.now()}`;
    const respondentHash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);

    // Check for duplicate submission
    const existingResponse = await prisma.campaignResponse.findFirst({
      where: {
        campaignId: campaign.id,
        respondentHash,
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Vous avez déjà répondu à cette enquête' },
        { status: 409 }
      );
    }

    // Create response
    const response = await prisma.campaignResponse.create({
      data: {
        campaignId: campaign.id,
        respondentHash,
        responses,
        userAgent,
        isComplete: true,
      },
    });

    // Get updated count
    const newCount = campaign._count.responses + 1;

    return NextResponse.json({
      success: true,
      message: 'Merci pour votre participation !',
      responseId: response.id,
      currentResponses: newCount,
      anonymityThreshold: campaign.surveyType.anonymityThreshold,
      meetsThreshold: newCount >= (campaign.surveyType.anonymityThreshold || 15),
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de votre réponse' },
      { status: 500 }
    );
  }
}
