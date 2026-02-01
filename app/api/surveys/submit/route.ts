import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Types for validation
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface QuestionDefinition {
  id: string;
  type: string;
  required?: boolean;
  scale?: string;
  options?: Array<{ value: string | number; label: string }>;
  min?: number;
  max?: number;
  max_choices?: number;
  allow_skip?: boolean;
}

// Extract questions from survey definition
function extractQuestions(definition: any): Map<string, QuestionDefinition> {
  const questionsMap = new Map<string, QuestionDefinition>();
  
  const modules = definition?.questionnaire_structure?.modules || [];
  for (const module of modules) {
    const sections = module.sections || [];
    for (const section of sections) {
      const questions = section.questions || [];
      for (const question of questions) {
        questionsMap.set(question.id, question);
      }
    }
  }
  
  return questionsMap;
}

// Validate a single response against its question definition
function validateResponse(
  questionId: string,
  value: any,
  question: QuestionDefinition
): ValidationResult {
  const errors: string[] = [];
  
  // Check if value is missing for required question
  if (value === null || value === undefined || value === '') {
    if (question.required && !question.allow_skip) {
      errors.push(`Question ${questionId} est obligatoire`);
    }
    return { isValid: errors.length === 0, errors };
  }
  
  // Validate based on question type
  switch (question.type) {
    case 'scale':
      // Likert scale validation (0-10 or other ranges)
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push(`Question ${questionId}: la valeur doit être un entier`);
      } else {
        const scaleMatch = question.scale?.match(/^(\d+)-(\d+)$/);
        const min = scaleMatch ? parseInt(scaleMatch[1]) : 0;
        const max = scaleMatch ? parseInt(scaleMatch[2]) : 10;
        
        if (value < min || value > max) {
          errors.push(`Question ${questionId}: la valeur doit être entre ${min} et ${max}`);
        }
      }
      break;
      
    case 'single_choice':
    case 'dropdown':
    case 'consent':
      // Single choice: value must be one of the options
      if (question.options) {
        const validValues = question.options.map(o => o.value);
        if (!validValues.includes(value) && value !== 'OTHER') {
          errors.push(`Question ${questionId}: valeur "${value}" non reconnue`);
        }
      }
      break;
      
    case 'multiple_choice':
      // Multiple choice: value must be an array of valid options
      if (!Array.isArray(value)) {
        errors.push(`Question ${questionId}: doit être une liste de valeurs`);
      } else {
        if (question.options) {
          const validValues = question.options.map(o => o.value);
          for (const v of value) {
            if (!validValues.includes(v) && v !== 'OTHER') {
              errors.push(`Question ${questionId}: valeur "${v}" non reconnue`);
            }
          }
        }
        
        // Check max_choices constraint
        if (question.max_choices && value.length > question.max_choices) {
          errors.push(`Question ${questionId}: maximum ${question.max_choices} choix autorisés`);
        }
      }
      break;
      
    case 'rank':
      // Ranking: value must be an ordered array
      if (!Array.isArray(value)) {
        errors.push(`Question ${questionId}: doit être une liste ordonnée`);
      } else {
        // Check for duplicates
        const unique = new Set(value);
        if (unique.size !== value.length) {
          errors.push(`Question ${questionId}: le classement ne doit pas contenir de doublons`);
        }
      }
      break;
      
    case 'number':
      // Numeric validation
      if (typeof value !== 'number') {
        errors.push(`Question ${questionId}: doit être un nombre`);
      } else {
        if (question.min !== undefined && value < question.min) {
          errors.push(`Question ${questionId}: la valeur minimum est ${question.min}`);
        }
        if (question.max !== undefined && value > question.max) {
          errors.push(`Question ${questionId}: la valeur maximum est ${question.max}`);
        }
      }
      break;
      
    case 'open_ended':
      // Text validation - just ensure it's a string
      if (typeof value !== 'string') {
        errors.push(`Question ${questionId}: doit être du texte`);
      }
      break;
  }
  
  return { isValid: errors.length === 0, errors };
}

// Validate all responses against the survey schema
function validateResponses(
  responses: Record<string, any>,
  definition: any,
  activeModules?: number[]
): ValidationResult {
  const allErrors: string[] = [];
  const questionsMap = extractQuestions(definition);
  
  // Validate each response against its question definition
  for (const [questionId, value] of Object.entries(responses)) {
    // Skip metadata fields
    if (questionId.startsWith('_') || questionId === 'fingerprint') {
      continue;
    }
    
    const question = questionsMap.get(questionId);
    if (!question) {
      // Unknown question ID - could be custom field, allow but log
      console.warn(`Unknown question ID: ${questionId}`);
      continue;
    }
    
    const result = validateResponse(questionId, value, question);
    allErrors.push(...result.errors);
  }
  
  // Check for missing required questions
  for (const [questionId, question] of questionsMap) {
    if (question.required && !question.allow_skip) {
      if (!(questionId in responses) || responses[questionId] === null || responses[questionId] === undefined) {
        // Check if this question is in an active module
        // For now, we'll skip this check if activeModules is not defined
        allErrors.push(`Question ${questionId} est obligatoire`);
      }
    }
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

// POST /api/surveys/submit - Submit survey response with validation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      token,           // Campaign token
      responses,       // Response data { questionId: value }
      fingerprint,     // Browser fingerprint for deduplication
      isLegacySurvey,  // Flag for legacy Method B surveys
      surveyId,        // Legacy survey ID (if applicable)
      skipValidation,  // Skip schema validation (for testing)
    } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de campagne requis' },
        { status: 400 }
      );
    }

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Réponses invalides ou manquantes' },
        { status: 400 }
      );
    }

    // Handle legacy Method B surveys
    if (isLegacySurvey && surveyId) {
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

      if (legacySurvey.status === 'CLOSED') {
        return NextResponse.json(
          { error: 'Cette enquête n\'accepte plus de réponses' },
          { status: 400 }
        );
      }

      // Basic validation for Method B responses
      const methodBFields = ['q1_prevalence', 'q2_efficiency', 'q5_working_hours'];
      for (const field of methodBFields) {
        if (!responses[field]) {
          return NextResponse.json(
            { error: `Champ requis manquant: ${field}` },
            { status: 400 }
          );
        }
      }

      // Create legacy survey response
      const userAgent = request.headers.get('user-agent') || '';
      const response = await prisma.surveyResponse.create({
        data: {
          surveyId: legacySurvey.id,
          q1Prevalence: responses.q1_prevalence || 'NEVER',
          q2EfficiencyPercent: parseInt(responses.q2_efficiency) || 100,
          q3Factors: responses.q3_factors ? JSON.stringify(responses.q3_factors) : null,
          q3OtherText: responses.q3_other_text || null,
          q4Impact: responses.q4_impact ? JSON.stringify(responses.q4_impact) : null,
          q5WorkingHours: responses.q5_working_hours || '<35',
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

    // Find campaign by token
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { token },
      include: {
        surveyType: true,
        _count: { select: { responses: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
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
        { error: statusMessages[campaign.status] || 'Enquête non disponible' },
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

    // Check end date
    if (campaign.scheduledEndDate && new Date() > campaign.scheduledEndDate) {
      return NextResponse.json(
        { error: 'La période de réponse à cette enquête est terminée' },
        { status: 400 }
      );
    }

    // Validate responses against survey schema (unless skipped)
    if (!skipValidation) {
      const definition = campaign.surveyType.definition as any;
      const activeModules = campaign.activeModules as number[] | null;
      
      const validation = validateResponses(responses, definition, activeModules || undefined);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation échouée',
            details: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    // Generate anonymous hash for deduplication
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
    const campaignResponse = await prisma.campaignResponse.create({
      data: {
        campaignId: campaign.id,
        respondentHash,
        responses,
        userAgent,
        isComplete: true,
        submittedAt: new Date(),
      },
    });

    // Get updated count
    const newCount = campaign._count.responses + 1;
    const anonymityThreshold = campaign.anonymityThreshold || campaign.surveyType.anonymityThreshold || 15;

    return NextResponse.json({
      success: true,
      message: 'Merci pour votre participation !',
      responseId: campaignResponse.id,
      currentResponses: newCount,
      anonymityThreshold,
      meetsThreshold: newCount >= anonymityThreshold,
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de votre réponse' },
      { status: 500 }
    );
  }
}
