export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logActivityServer } from '@/lib/activity-logger';
import crypto from 'crypto';

// Distribution profiles for generating synthetic data
const DISTRIBUTION_PROFILES = {
  uniform: { mean: 5, stdDev: 2.5 },     // Wide distribution centered at 5
  positive: { mean: 7.5, stdDev: 1.5 },  // High scores (healthy company)
  degraded: { mean: 3.5, stdDev: 1.5 },  // Low scores (struggling company)
};

// Box-Muller transform for generating normally distributed random numbers
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.max(0, Math.min(10, z * stdDev + mean)));
}

// Generate a random choice from options
function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

// Weighted random selection based on headcounts
function weightedRandomDepartment(departments: { code: string; headcount: number | null }[]): string {
  const totalWeight = departments.reduce((sum, d) => sum + (d.headcount || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const dept of departments) {
    random -= (dept.headcount || 1);
    if (random <= 0) return dept.code;
  }
  
  return departments[departments.length - 1]?.code || 'AUTRE';
}

// Generate responses for all questions in a questionnaire
function generateResponses(
  questionnaire: any,
  profile: keyof typeof DISTRIBUTION_PROFILES,
  departmentCode: string
): Record<string, any> {
  const responses: Record<string, any> = {};
  const { mean, stdDev } = DISTRIBUTION_PROFILES[profile];
  
  const modules = questionnaire?.modules || [];
  
  for (const mod of modules) {
    // Handle both section-based and direct question structures
    const questions = mod.questions || [];
    const sections = mod.sections || [];
    
    // Direct questions in module
    for (const q of questions) {
      responses[q.id] = generateQuestionResponse(q, mean, stdDev, profile, departmentCode);
    }
    
    // Questions in sections
    for (const section of sections) {
      for (const q of section.questions || []) {
        responses[q.id] = generateQuestionResponse(q, mean, stdDev, profile, departmentCode);
      }
    }
  }
  
  return responses;
}

function generateQuestionResponse(
  question: any,
  mean: number,
  stdDev: number,
  profile: keyof typeof DISTRIBUTION_PROFILES,
  departmentCode: string
): any {
  const { type, id, options } = question;
  
  // Q1 is always consent (true)
  if (id === 'Q1') return true;
  
  // Q4 is department - use assigned department
  if (id === 'Q4') return departmentCode;
  
  // Scale questions (0-10 Likert)
  if (type === 'scale') {
    return gaussianRandom(mean, stdDev);
  }
  
  // Single choice questions
  if (type === 'single_choice' || type === 'dropdown') {
    if (options && options.length > 0) {
      // For Q38 (sphere priority), use weighted random based on profile
      if (id === 'Q38') {
        const sphereOptions = ['SPHERE_1', 'SPHERE_2', 'SPHERE_3', 'SPHERE_4'];
        return randomChoice(sphereOptions);
      }
      
      // For other single choice, pick random option
      const optionValues = options.map((o: any) => o.value || o);
      return randomChoice(optionValues);
    }
  }
  
  // Number questions
  if (type === 'number') {
    const min = question.min || 0;
    const max = question.max || 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Multiple choice - select 1-3 random options
  if (type === 'multiple_choice') {
    if (options && options.length > 0) {
      const optionValues = options.map((o: any) => o.value || o);
      const numChoices = Math.min(1 + Math.floor(Math.random() * 2), optionValues.length);
      const shuffled = [...optionValues].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, numChoices);
    }
  }
  
  // Open-ended questions - skip or add generic comment
  if (type === 'open_ended') {
    // 80% chance to skip, 20% chance to add comment
    if (Math.random() > 0.8) {
      const comments = [
        'RAS',
        'Pas de commentaire particulier.',
        'Améliorer la communication.',
        'Continuer les efforts.',
      ];
      return randomChoice(comments);
    }
    return null;
  }
  
  // Default for unknown types
  return null;
}

export async function POST(
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
        { error: 'Accès refusé. Seuls les Super-Administrateurs peuvent générer des données de démo.' },
        { status: 403 }
      );
    }

    // Get campaign with company info
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: {
          include: {
            departments: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        surveyType: true,
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

    // Parse request body
    const body = await request.json();
    const {
      count = 100,
      distributionProfile = 'uniform',
      departmentDistribution = 'proportional',
    } = body;

    // Validate count
    const validCounts = [10, 50, 100, 250, 500];
    const responseCount = validCounts.includes(count) ? count : 100;

    // Validate distribution profile
    const validProfiles = ['uniform', 'positive', 'degraded'];
    const profile = validProfiles.includes(distributionProfile) ? distributionProfile : 'uniform';

    // Get questionnaire definition
    const definition = campaign.surveyType.definition as any;
    const questionnaire = definition?.questionnaire_structure || {};

    // Get departments (from frozen services or company departments)
    let departments = (campaign.customServices as any[]) || [];
    if (departments.length === 0) {
      departments = campaign.company.departments.map(d => ({
        code: d.code,
        label: d.name,
        headcount: d.headcount,
      }));
    }
    
    // Fallback to default departments
    if (departments.length === 0) {
      departments = [
        { code: 'DIRECTION', label: 'Direction', headcount: 5 },
        { code: 'RH', label: 'Ressources Humaines', headcount: 10 },
        { code: 'FINANCE', label: 'Finance', headcount: 15 },
        { code: 'COMMERCIAL', label: 'Commercial', headcount: 20 },
        { code: 'IT', label: 'IT', headcount: 15 },
        { code: 'PRODUCTION', label: 'Production', headcount: 35 },
      ];
    }

    // Calculate department distribution
    let departmentCounts: Record<string, number> = {};
    
    if (departmentDistribution === 'uniform') {
      // Equal distribution across departments
      const perDept = Math.floor(responseCount / departments.length);
      const remainder = responseCount % departments.length;
      departments.forEach((d: any, i: number) => {
        departmentCounts[d.code] = perDept + (i < remainder ? 1 : 0);
      });
    } else {
      // Proportional distribution based on headcount
      const totalHeadcount = departments.reduce((sum: number, d: any) => sum + (d.headcount || 1), 0);
      let assigned = 0;
      departments.forEach((d: any, i: number) => {
        const proportion = (d.headcount || 1) / totalHeadcount;
        const count = i === departments.length - 1 
          ? responseCount - assigned // Last dept gets remainder
          : Math.round(responseCount * proportion);
        departmentCounts[d.code] = count;
        assigned += count;
      });
    }

    // Generate and save responses
    const createdResponses: any[] = [];
    let responseIndex = 0;

    for (const [deptCode, deptCount] of Object.entries(departmentCounts)) {
      for (let i = 0; i < deptCount; i++) {
        // Generate unique respondent hash
        const hashInput = `demo-${campaign.id}-${deptCode}-${responseIndex}-${Date.now()}`;
        const respondentHash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);

        // Generate responses for this respondent
        const responses = generateResponses(
          questionnaire,
          profile as keyof typeof DISTRIBUTION_PROFILES,
          deptCode
        );

        try {
          const created = await prisma.campaignResponse.create({
            data: {
              campaignId: campaign.id,
              respondentHash,
              responses,
              isComplete: true,
              isSynthetic: true,
              userAgent: 'AlterValue Demo Generator v4.2',
            },
          });
          createdResponses.push(created);
        } catch (e) {
          // Skip duplicates silently
          console.log(`Skipping duplicate response for hash ${respondentHash}`);
        }

        responseIndex++;
      }
    }

    // Log activity
    const profileLabels: Record<string, string> = {
      uniform: 'Uniforme',
      positive: 'Plutôt positive',
      degraded: 'Plutôt dégradée',
    };
    const distLabels: Record<string, string> = {
      proportional: 'proportionnelle',
      uniform: 'uniforme',
    };

    await logActivityServer(prisma, {
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email,
      userRole: user.role,
      type: 'DEMO_DATA_GENERATED',
      action: `Génération de ${createdResponses.length} réponses de démo`,
      description: `Campagne "${campaign.name}" - Profil: ${profileLabels[profile]}, Répartition: ${distLabels[departmentDistribution]}`,
      companyId: campaign.companyId,
      companyName: campaign.company.name,
      entityType: 'campaign',
      entityId: campaign.id,
      entityName: campaign.name,
    });

    return NextResponse.json({
      success: true,
      message: `${createdResponses.length} réponses de démo générées avec succès.`,
      summary: {
        count: createdResponses.length,
        profile: profile,
        profileLabel: profileLabels[profile],
        departmentDistribution: departmentDistribution,
        departmentDistributionLabel: distLabels[departmentDistribution],
        departmentBreakdown: departmentCounts,
      },
    });
  } catch (error) {
    console.error('Error generating demo responses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des données de démo' },
      { status: 500 }
    );
  }
}
