import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/surveys/[surveyId]/respond - Submit anonymous response (PUBLIC - no auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params;
    const body = await request.json();
    const { 
      q1Prevalence,
      q2EfficiencyPercent,
      q3Factors,
      q3OtherText,
      q4Impact,
      q5WorkingHours,
      surveyToken
    } = body;

    // Verify survey exists and is active
    const survey = await prisma.survey.findFirst({
      where: {
        OR: [
          { id: surveyId },
          { surveyToken: surveyToken }
        ],
        status: 'ACTIVE'
      }
    });

    if (!survey) {
      return NextResponse.json({ 
        error: 'Enquête non disponible. Elle est soit terminée, soit n\'existe pas.' 
      }, { status: 404 });
    }

    // Check if survey has expired
    if (survey.endDate && new Date() > survey.endDate) {
      return NextResponse.json({ 
        error: 'Cette enquête est terminée.' 
      }, { status: 400 });
    }

    // Validate required fields
    if (!q1Prevalence || !q2EfficiencyPercent || !q5WorkingHours) {
      return NextResponse.json({ 
        error: 'Veuillez répondre à toutes les questions obligatoires.' 
      }, { status: 400 });
    }

    // Get user agent for fraud detection (anonymous)
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create anonymous response
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        q1Prevalence,
        q2EfficiencyPercent: parseInt(q2EfficiencyPercent),
        q3Factors: q3Factors ? JSON.stringify(q3Factors) : null,
        q3OtherText: q3OtherText || null,
        q4Impact: q4Impact ? JSON.stringify(q4Impact) : null,
        q5WorkingHours,
        userAgent,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Merci pour votre participation. Vos réponses sont anonymes.' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
