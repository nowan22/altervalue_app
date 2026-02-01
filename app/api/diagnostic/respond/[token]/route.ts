import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// GET: Get questionnaire for a campaign (public, no auth required)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // First try to find in new SurveyCampaign table
    let campaign = await prisma.surveyCampaign.findUnique({
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

    // If not found, try legacy Survey table (Method B surveys)
    if (!campaign) {
      const legacySurvey = await prisma.survey.findUnique({
        where: { surveyToken: params.token },
        include: {
          company: {
            select: { name: true },
          },
          _count: {
            select: { responses: true },
          },
        },
      });

      if (!legacySurvey) {
        return NextResponse.json(
          { error: 'Enquête non trouvée', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Map legacy Survey to expected format
      // Method B survey uses a fixed questionnaire structure
      const methodBQuestionnaire = {
        modules: [
          {
            id: 'method_b',
            title: 'Enquête Présentéisme - Méthode B',
            questions: [
              {
                id: 'q1_prevalence',
                type: 'single_choice',
                text: 'Au cours des 4 dernières semaines, avez-vous travaillé en étant moins efficace que d\'habitude ?',
                required: true,
                options: [
                  { value: 'NEVER', label: 'Jamais', score: 0 },
                  { value: 'OCCASIONALLY', label: 'Occasionnellement', score: 1 },
                  { value: 'REGULARLY', label: 'Régulièrement', score: 2 },
                  { value: 'VERY_FREQUENTLY', label: 'Très fréquemment', score: 3 },
                ],
              },
              {
                id: 'q2_efficiency',
                type: 'single_choice',
                text: 'Lorsque vous étiez moins efficace, à quel pourcentage estimez-vous votre efficacité ?',
                required: true,
                options: [
                  { value: 100, label: '100%', score: 100 },
                  { value: 90, label: '90%', score: 90 },
                  { value: 80, label: '80%', score: 80 },
                  { value: 70, label: '70%', score: 70 },
                  { value: 60, label: '60%', score: 60 },
                  { value: 50, label: '50% ou moins', score: 50 },
                ],
              },
              {
                id: 'q3_factors',
                type: 'multiple_choice',
                text: 'Quels facteurs ont contribué à cette baisse d\'efficacité ?',
                required: false,
                options: [
                  { value: 'FATIGUE', label: 'Fatigue' },
                  { value: 'STRESS', label: 'Stress' },
                  { value: 'PAIN', label: 'Douleurs physiques' },
                  { value: 'CONCENTRATION', label: 'Difficultés de concentration' },
                  { value: 'OTHER', label: 'Autre' },
                ],
              },
              {
                id: 'q4_impact',
                type: 'multiple_choice',
                text: 'Quel a été l\'impact sur votre travail ?',
                required: false,
                options: [
                  { value: 'QUALITY', label: 'Qualité du travail' },
                  { value: 'DELAYS', label: 'Retards' },
                  { value: 'COLLEAGUES', label: 'Relations avec les collègues' },
                  { value: 'ERRORS', label: 'Erreurs' },
                ],
              },
              {
                id: 'q5_working_hours',
                type: 'single_choice',
                text: 'Combien d\'heures travaillez-vous par semaine ?',
                required: true,
                options: [
                  { value: '<35', label: 'Moins de 35h' },
                  { value: '35-39', label: '35-39h' },
                  { value: '40-44', label: '40-44h' },
                  { value: '45-49', label: '45-49h' },
                  { value: '>=50', label: '50h ou plus' },
                ],
              },
            ],
          },
        ],
      };

      return NextResponse.json({
        campaignName: legacySurvey.title,
        companyName: legacySurvey.company.name,
        surveyTypeName: 'Enquête Présentéisme - Méthode B',
        estimatedDuration: 5,
        anonymityThreshold: 15,
        questionnaire: methodBQuestionnaire,
        metadata: {
          name: legacySurvey.title,
          framework: 'Méthode B - Présentéisme',
          primary_objective: 'Mesurer le présentéisme par l\'auto-évaluation',
        },
        dataGovernance: {
          anonymity_threshold: 15,
          rgpd_compliant: true,
        },
        currentResponses: legacySurvey._count.responses,
        endDate: legacySurvey.endDate,
        isLegacySurvey: true,
        surveyId: legacySurvey.id,
      });
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
    const body = await request.json();
    const { responses, fingerprint, isLegacySurvey, surveyId } = body;

    // Try to find in new SurveyCampaign table first
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { token: params.token },
      include: {
        surveyType: true,
        _count: { select: { responses: true } },
      },
    });

    // If not found and this is a legacy survey submission, handle it differently
    if (!campaign && isLegacySurvey && surveyId) {
      const legacySurvey = await prisma.survey.findUnique({
        where: { id: surveyId },
        include: {
          _count: { select: { responses: true } },
        },
      });

      if (!legacySurvey) {
        return NextResponse.json(
          { error: 'Enquête non trouvée' },
          { status: 404 }
        );
      }

      // Check if survey is still accepting responses
      if (legacySurvey.status === 'CLOSED') {
        return NextResponse.json(
          { error: 'Cette enquête n\'accepte plus de réponses' },
          { status: 400 }
        );
      }

      // Extract Method B responses from the generic responses object
      const methodBResponses = {
        q1Prevalence: responses.q1_prevalence || 'NEVER',
        q2EfficiencyPercent: parseInt(responses.q2_efficiency) || 100,
        q3Factors: responses.q3_factors ? JSON.stringify(responses.q3_factors) : null,
        q3OtherText: responses.q3_other_text || null,
        q4Impact: responses.q4_impact ? JSON.stringify(responses.q4_impact) : null,
        q5WorkingHours: responses.q5_working_hours || '<35',
      };

      // Get user agent
      const userAgent = request.headers.get('user-agent') || '';

      // Create legacy survey response
      const response = await prisma.surveyResponse.create({
        data: {
          surveyId: legacySurvey.id,
          ...methodBResponses,
          userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Merci pour votre participation !',
        responseId: response.id,
        currentResponses: legacySurvey._count.responses + 1,
        anonymityThreshold: 15,
      });
    }

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
