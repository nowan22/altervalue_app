export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logActivityServer } from '@/lib/activity-logger';
import crypto from 'crypto';

// =============================================================================
// V4.3 INTELLIGENT DEMO SCENARIOS - REALISTIC & NARRATIVE DATA
// =============================================================================

// 4 scénarios de démo intelligents avec distributions explicites
// Scores en % (0-100) pour chaque sphère
interface ScenarioConfig {
  label: string;
  description: string;
  sphereRanges: {
    SPHERE_1: [number, number]; // Management (min%, max%)
    SPHERE_2: [number, number]; // Équilibre vie pro/perso
    SPHERE_3: [number, number]; // Santé
    SPHERE_4: [number, number]; // Environnement
  };
  q38Distribution: Record<string, number>; // Sphère prioritaire (probas)
  presenteeismDays: [number, number]; // Jours de présentéisme/mois
  outlierRate: number; // % de répondants extrêmes
  negativeOutlierBias: number; // % des outliers qui sont négatifs
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  // 🔥 SCÉNARIO A — DÉGRADÉ (burnout / RPS élevés)
  A: {
    label: 'Entreprise en difficulté',
    description: 'Burnout / RPS élevés / Management défaillant',
    sphereRanges: {
      SPHERE_1: [20, 35],  // Management très dégradé
      SPHERE_2: [25, 40],  // Équilibre vie pro/perso critique
      SPHERE_3: [30, 45],  // Santé impactée
      SPHERE_4: [50, 65],  // Environnement correct
    },
    q38Distribution: { SPHERE_1: 0.15, SPHERE_2: 0.10, SPHERE_3: 0.05, SPHERE_4: 0.70 },
    presenteeismDays: [3, 5],
    outlierRate: 0.20,
    negativeOutlierBias: 0.80,
  },

  // 🎯 SCÉNARIO B — TECH TYPIQUE (bon environnement, mauvais équilibre)
  B: {
    label: 'Entreprise Tech typique',
    description: 'Bon environnement mais équilibre vie pro/perso dégradé',
    sphereRanges: {
      SPHERE_1: [55, 70],  // Management correct
      SPHERE_2: [30, 45],  // Équilibre vie pro/perso critique
      SPHERE_3: [60, 75],  // Santé correcte
      SPHERE_4: [70, 85],  // Environnement excellent
    },
    q38Distribution: { SPHERE_1: 0.10, SPHERE_2: 0.60, SPHERE_3: 0.10, SPHERE_4: 0.20 },
    presenteeismDays: [1, 3],
    outlierRate: 0.15,
    negativeOutlierBias: 0.50,
  },

  // ⚖️ SCÉNARIO C — NEUTRE (scores moyens homogènes)
  C: {
    label: 'Entreprise neutre',
    description: 'Scores moyens homogènes, pas de point critique',
    sphereRanges: {
      SPHERE_1: [45, 60],
      SPHERE_2: [45, 60],
      SPHERE_3: [45, 60],
      SPHERE_4: [45, 60],
    },
    q38Distribution: { SPHERE_1: 0.25, SPHERE_2: 0.25, SPHERE_3: 0.25, SPHERE_4: 0.25 },
    presenteeismDays: [1, 2],
    outlierRate: 0.10,
    negativeOutlierBias: 0.50,
  },

  // ⭐ SCÉNARIO D — EXCELLENT (BNQ mature)
  D: {
    label: 'Entreprise excellente',
    description: 'BNQ mature, scores élevés partout',
    sphereRanges: {
      SPHERE_1: [75, 90],
      SPHERE_2: [70, 85],
      SPHERE_3: [75, 90],
      SPHERE_4: [80, 95],
    },
    q38Distribution: { SPHERE_1: 0.30, SPHERE_2: 0.30, SPHERE_3: 0.20, SPHERE_4: 0.20 },
    presenteeismDays: [0, 1],
    outlierRate: 0.15,
    negativeOutlierBias: 0.20,
  },
};

// Biais par département : modifie les scores par sphère
// Coefficient multiplicateur (1.0 = neutre, > 1 = meilleur, < 1 = pire)
const DEPARTMENT_MODIFIERS: Record<string, Record<string, number>> = {
  COMMERCIAL: {
    SPHERE_1: 1.10, // Bon management commercial
    SPHERE_2: 0.80, // Mauvais équilibre (objectifs)
    SPHERE_3: 0.95,
    SPHERE_4: 1.05,
  },
  SALES: {
    SPHERE_1: 1.08,
    SPHERE_2: 0.75,
    SPHERE_3: 0.92,
    SPHERE_4: 1.00,
  },
  IT: {
    SPHERE_1: 1.05,
    SPHERE_2: 0.85,
    SPHERE_3: 0.75, // Sédentarité
    SPHERE_4: 1.15,
  },
  DSI: {
    SPHERE_1: 1.08,
    SPHERE_2: 0.82,
    SPHERE_3: 0.78,
    SPHERE_4: 1.12,
  },
  RH: {
    SPHERE_1: 1.20, // RH = bon management perçu
    SPHERE_2: 1.10,
    SPHERE_3: 1.05,
    SPHERE_4: 1.00,
  },
  PRODUCTION: {
    SPHERE_1: 0.85,
    SPHERE_2: 0.70, // Horaires contraints
    SPHERE_3: 0.65, // Pénibilité physique
    SPHERE_4: 1.10,
  },
  OPERATIONS: {
    SPHERE_1: 0.88,
    SPHERE_2: 0.75,
    SPHERE_3: 0.70,
    SPHERE_4: 1.08,
  },
  DIRECTION: {
    SPHERE_1: 1.25, // Direction = bon management (auto-évaluation)
    SPHERE_2: 0.65, // Pire équilibre (responsabilités)
    SPHERE_3: 0.90,
    SPHERE_4: 1.15,
  },
  FINANCE: {
    SPHERE_1: 1.00,
    SPHERE_2: 0.78, // Stress périodes clôture
    SPHERE_3: 0.85,
    SPHERE_4: 1.05,
  },
  SUPPORT: {
    SPHERE_1: 0.95,
    SPHERE_2: 1.05,
    SPHERE_3: 1.00,
    SPHERE_4: 0.95,
  },
  ADMIN: {
    SPHERE_1: 0.92,
    SPHERE_2: 1.08,
    SPHERE_3: 1.02,
    SPHERE_4: 0.98,
  },
  DEFAULT: {
    SPHERE_1: 1.0,
    SPHERE_2: 1.0,
    SPHERE_3: 1.0,
    SPHERE_4: 1.0,
  },
};

// Questions associées à chaque sphère (mapping BNQ Ultimate)
const QUESTION_SPHERE_MAP: Record<string, string> = {
  // Module 1 - Sphère 1 : Management et pratiques organisationnelles
  Q5: 'SPHERE_1', Q6: 'SPHERE_1', Q7: 'SPHERE_1', Q8: 'SPHERE_1', Q9: 'SPHERE_1',
  Q10: 'SPHERE_1', Q11: 'SPHERE_1', Q12: 'SPHERE_1', Q13: 'SPHERE_1', Q14: 'SPHERE_1',
  // Module 2 - Sphère 2 : Conciliation vie pro/perso et risques psychosociaux
  Q15: 'SPHERE_2', Q16: 'SPHERE_2', Q17: 'SPHERE_2', Q18: 'SPHERE_2', Q19: 'SPHERE_2',
  Q20: 'SPHERE_2', Q21: 'SPHERE_2', Q22: 'SPHERE_2', Q23: 'SPHERE_2', Q24: 'SPHERE_2',
  // Module 3 - Sphère 3 : Santé et sécurité au travail
  Q25: 'SPHERE_3', Q26: 'SPHERE_3', Q27: 'SPHERE_3', Q28: 'SPHERE_3', Q29: 'SPHERE_3',
  Q30: 'SPHERE_3', Q31: 'SPHERE_3', Q32: 'SPHERE_3', Q33: 'SPHERE_3', Q34: 'SPHERE_3',
  // Module 4 - Sphère 4 : Environnement de travail
  Q35: 'SPHERE_4', Q36: 'SPHERE_4', Q37: 'SPHERE_4',
};

// Box-Muller transform pour distribution gaussienne
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * stdDev + mean;
}

// Génère un score 0-10 basé sur une plage de pourcentage cible
function generateScoreInRange(
  minPercent: number,
  maxPercent: number,
  stdDevPercent: number = 12
): number {
  const midPercent = (minPercent + maxPercent) / 2;
  const score = gaussianRandom(midPercent, stdDevPercent);
  // Clamp et convertir en 0-10
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round(clamped / 10);
}

// Sélection pondérée pour Q38
function weightedChoice(distribution: Record<string, number>): string {
  const entries = Object.entries(distribution);
  let random = Math.random();
  for (const [key, prob] of entries) {
    random -= prob;
    if (random <= 0) return key;
  }
  return entries[0][0];
}

function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

// Profil de répondant individuel
interface RespondentProfile {
  isOutlier: boolean;
  isNegativeOutlier: boolean;
  personalBias: number; // -0.15 à +0.15
  sphereBiases: Record<string, number>; // Biais personnel par sphère
}

function generateRespondentProfile(scenario: ScenarioConfig): RespondentProfile {
  const isOutlier = Math.random() < scenario.outlierRate;
  const isNegativeOutlier = isOutlier && Math.random() < scenario.negativeOutlierBias;
  
  return {
    isOutlier,
    isNegativeOutlier,
    personalBias: (Math.random() - 0.5) * 0.30, // +/- 15%
    // Biais personnel différent par sphère
    sphereBiases: {
      SPHERE_1: (Math.random() - 0.5) * 0.20,
      SPHERE_2: (Math.random() - 0.5) * 0.20,
      SPHERE_3: (Math.random() - 0.5) * 0.20,
      SPHERE_4: (Math.random() - 0.5) * 0.20,
    },
  };
}

// Génère les réponses pour un répondant
function generateResponses(
  questionnaire: any,
  scenario: ScenarioConfig,
  departmentCode: string
): Record<string, any> {
  const responses: Record<string, any> = {};
  const normalizedDeptCode = departmentCode.toUpperCase();
  const deptMod = DEPARTMENT_MODIFIERS[normalizedDeptCode] || DEPARTMENT_MODIFIERS.DEFAULT;
  
  // Générer un profil de répondant unique
  const respondent = generateRespondentProfile(scenario);
  
  // Calculer les scores cibles par sphère pour ce répondant
  const sphereTargets: Record<string, number> = {};
  
  for (const sphere of ['SPHERE_1', 'SPHERE_2', 'SPHERE_3', 'SPHERE_4']) {
    const [minP, maxP] = scenario.sphereRanges[sphere as keyof typeof scenario.sphereRanges];
    let targetMean = (minP + maxP) / 2;
    
    // Appliquer modificateur département
    targetMean *= deptMod[sphere] || 1.0;
    
    // Appliquer biais personnel
    targetMean *= (1 + respondent.personalBias + respondent.sphereBiases[sphere]);
    
    // Gérer les outliers
    if (respondent.isOutlier) {
      if (respondent.isNegativeOutlier) {
        targetMean = Math.min(targetMean, 25); // Forcer des scores très bas
      } else {
        targetMean = Math.max(targetMean, 80); // Forcer des scores très hauts
      }
    }
    
    sphereTargets[sphere] = Math.max(5, Math.min(95, targetMean));
  }
  
  // CORRÉLATIONS LOGIQUES câblées
  // Si Management < 40 → RPS dims (Équilibre) < 35
  if (sphereTargets.SPHERE_1 < 40) {
    sphereTargets.SPHERE_2 = Math.min(sphereTargets.SPHERE_2, 35);
  }
  // Si Vie Pro/Perso < 40 → Santé < 50
  if (sphereTargets.SPHERE_2 < 40) {
    sphereTargets.SPHERE_3 = Math.min(sphereTargets.SPHERE_3, 50);
  }
  // Si Santé < 50 → impact indirect sur Équilibre (fatigue)
  if (sphereTargets.SPHERE_3 < 50) {
    sphereTargets.SPHERE_2 = Math.min(sphereTargets.SPHERE_2, sphereTargets.SPHERE_3 + 10);
  }
  
  // Parcourir les modules et générer les réponses
  const modules = questionnaire?.modules || [];
  
  for (const mod of modules) {
    const questions = mod.questions || [];
    const sections = mod.sections || [];
    
    for (const q of questions) {
      responses[q.id] = generateQuestionResponse(q, sphereTargets, scenario, departmentCode, respondent);
    }
    
    for (const section of sections) {
      for (const q of section.questions || []) {
        responses[q.id] = generateQuestionResponse(q, sphereTargets, scenario, departmentCode, respondent);
      }
    }
  }
  
  return responses;
}

function generateQuestionResponse(
  question: any,
  sphereTargets: Record<string, number>,
  scenario: ScenarioConfig,
  departmentCode: string,
  respondent: RespondentProfile
): any {
  const { type, id, options } = question;
  
  // Q1 : Consentement
  if (id === 'Q1') return true;
  
  // Q4 : Département
  if (id === 'Q4') return departmentCode;
  
  // Questions échelle (0-10)
  if (type === 'scale') {
    const sphere = QUESTION_SPHERE_MAP[id] || 'SPHERE_1';
    const targetPercent = sphereTargets[sphere] || 50;
    
    // Variance par question (pas tous les mêmes scores)
    const questionVariance = (Math.random() - 0.5) * 25;
    const finalPercent = Math.max(0, Math.min(100, targetPercent + questionVariance));
    
    // Convertir en 0-10 avec léger bruit
    let score = Math.round(finalPercent / 10);
    
    // Ajouter du bruit ±1
    if (Math.random() < 0.3) {
      score = Math.max(0, Math.min(10, score + (Math.random() < 0.5 ? -1 : 1)));
    }
    
    return score;
  }
  
  // Q38 : Sphère prioritaire - pondéré selon scénario
  if (id === 'Q38') {
    return weightedChoice(scenario.q38Distribution);
  }
  
  // Single choice / dropdown
  if (type === 'single_choice' || type === 'dropdown') {
    if (options && options.length > 0) {
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
  
  // Multiple choice
  if (type === 'multiple_choice') {
    if (options && options.length > 0) {
      const optionValues = options.map((o: any) => o.value || o);
      const numChoices = Math.min(1 + Math.floor(Math.random() * 2), optionValues.length);
      const shuffled = [...optionValues].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, numChoices);
    }
  }
  
  // Open-ended : commentaires narratifs selon scénario
  if (type === 'open_ended') {
    const commentChance = respondent.isOutlier ? 0.70 : 0.25;
    
    if (Math.random() < commentChance) {
      const commentsByScenario: Record<string, { positive: string[]; negative: string[] }> = {
        A: {
          positive: ['Des efforts sont faits.', 'Certains managers sont biens.'],
          negative: [
            'Charge de travail insoutenable.',
            'Management absent ou toxique.',
            'Épuisement généralisé.',
            'Aucune reconnaissance.',
            'Je pense à démissionner.',
            'Stress chronique.',
            'Manque criant de moyens.',
            'Communication inexistante.',
          ],
        },
        B: {
          positive: ['Bons outils de travail.', 'Locaux agréables.', 'Collègues sympas.'],
          negative: [
            'Horaires à rallonge.',
            'On-call trop fréquent.',
            'Difficile de déconnecter.',
            'Pas de vie personnelle.',
            'Pression sur les deadlines.',
          ],
        },
        C: {
          positive: ['RAS', 'Correct dans l\'ensemble.', 'Pas de souci majeur.'],
          negative: ['Peut mieux faire.', 'Manque d\'ambition.', 'Routine.'],
        },
        D: {
          positive: [
            'Excellente ambiance !',
            'Très satisfait(e).',
            'Management à l\'écoute.',
            'Équilibre respecté.',
            'Fier de travailler ici.',
            'Entreprise exemplaire.',
          ],
          negative: ['Quelques points à améliorer.', 'Parfois un peu de stress.'],
        },
      };
      
      const scenarioKey = Object.keys(SCENARIOS).find(k => SCENARIOS[k] === scenario) || 'C';
      const comments = commentsByScenario[scenarioKey] || commentsByScenario.C;
      
      if (respondent.isNegativeOutlier) {
        return randomChoice(comments.negative);
      } else if (respondent.isOutlier && !respondent.isNegativeOutlier) {
        return randomChoice(comments.positive);
      }
      return Math.random() < 0.5 ? randomChoice(comments.positive) : randomChoice(comments.negative);
    }
    return null;
  }
  
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
      scenario: scenarioKey = 'A',
      departmentDistribution = 'proportional',
    } = body;

    // Validate count
    const validCounts = [10, 50, 100, 250, 500];
    const responseCount = validCounts.includes(count) ? count : 100;

    // Validate scenario
    const validScenarios = ['A', 'B', 'C', 'D'];
    const selectedScenarioKey = validScenarios.includes(scenarioKey) ? scenarioKey : 'A';
    const scenario = SCENARIOS[selectedScenarioKey];

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
        const cnt = i === departments.length - 1 
          ? responseCount - assigned // Last dept gets remainder
          : Math.round(responseCount * proportion);
        departmentCounts[d.code] = cnt;
        assigned += cnt;
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

        // Generate responses for this respondent using the scenario
        const responses = generateResponses(
          questionnaire,
          scenario,
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
              userAgent: `AlterValue Demo Generator v4.3 - Scenario ${selectedScenarioKey}`,
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
    const scenarioLabels: Record<string, string> = {
      A: '🔥 Dégradé (burnout/RPS)',
      B: '🎯 Tech typique',
      C: '⚖️ Neutre',
      D: '⭐ Excellent',
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
      description: `Campagne "${campaign.name}" - Scénario: ${scenarioLabels[selectedScenarioKey]}, Répartition: ${distLabels[departmentDistribution]}`,
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
        scenario: selectedScenarioKey,
        scenarioLabel: scenario.label,
        scenarioDescription: scenario.description,
        departmentDistribution: departmentDistribution,
        departmentDistributionLabel: distLabels[departmentDistribution],
        departmentBreakdown: departmentCounts,
        expectedSphereRanges: scenario.sphereRanges,
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
