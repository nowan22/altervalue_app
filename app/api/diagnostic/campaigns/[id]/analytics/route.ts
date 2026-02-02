import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Default benchmark values by sphere
const DEFAULT_BENCHMARKS = {
  sphere1: 65, // Habitudes de vie
  sphere2: 60, // Conciliation vie pro/perso
  sphere3: 70, // Environnement de travail
  sphere4: 55, // Pratiques de gestion
};

// BNQ Sphere definitions
const SPHERES = [
  { id: 'SPHERE_1', name: 'Habitudes de vie', short: 'Santé', color: '#14b8a6' },
  { id: 'SPHERE_2', name: 'Conciliation vie pro/perso', short: 'Équilibre', color: '#f59e0b' },
  { id: 'SPHERE_3', name: 'Environnement de travail', short: 'Environnement', color: '#8b5cf6' },
  { id: 'SPHERE_4', name: 'Pratiques de gestion', short: 'Management', color: '#ec4899' },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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
        responses: true,
        result: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    const responses = campaign.responses || [];
    const totalResponses = responses.length;
    const targetPopulation = campaign.targetPopulation || campaign.company.employeesCount || 0;
    const participationRate = targetPopulation > 0 ? Math.round((totalResponses / targetPopulation) * 100) : 0;
    const anonymityThreshold = campaign.anonymityThreshold || campaign.surveyType.anonymityThreshold || 15;

    // Calculate sphere scores from responses
    const sphereScores = calculateSphereScores(responses);

    // Calculate priority matrix (Q38 data + scores)
    const priorityMatrix = calculatePriorityMatrix(responses, sphereScores);

    // Calculate department breakdown
    const departments = campaign.company.departments || [];
    const departmentBreakdown = calculateDepartmentBreakdown(responses, departments, anonymityThreshold);

    // Calculate financial metrics (ROI)
    const avgDailyRate = campaign.moduleConfig ? (campaign.moduleConfig as any).averageDailyRate : null;
    const financialMetrics = calculateFinancialMetrics(
      responses,
      targetPopulation,
      avgDailyRate || Math.round((campaign.company.avgGrossSalary * (1 + campaign.company.employerContributionRate / 100)) / 220)
    );

    // Get benchmarks
    const benchmarks = await getBenchmarks(campaign.company.sector);

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        companyName: campaign.company.name,
        companyId: campaign.company.id,
        surveyTypeName: campaign.surveyType.name,
        launchedAt: campaign.launchedAt,
        closedAt: campaign.closedAt,
        scheduledEndDate: campaign.scheduledEndDate,
      },
      // v4.2: Demo mode flag
      isDemo: campaign.company.isDemo,
      participation: {
        totalResponses,
        targetPopulation,
        participationRate,
        minRespondents: campaign.minRespondents || anonymityThreshold,
        meetsThreshold: totalResponses >= anonymityThreshold,
      },
      anonymityThreshold,
      sphereScores,
      benchmarks,
      priorityMatrix,
      departmentBreakdown,
      financialMetrics,
      departments: departments.map((d: any) => ({
        code: d.code,
        name: d.name,
        responseCount: departmentBreakdown.find((db: any) => db.code === d.code)?.responseCount || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Calculate scores for each BNQ sphere (0-100)
function calculateSphereScores(responses: any[]): { sphere: string; score: number; name: string; short: string; color: string }[] {
  if (responses.length === 0) {
    return SPHERES.map(s => ({ sphere: s.id, score: 0, name: s.name, short: s.short, color: s.color }));
  }

  // Map question IDs to spheres based on BNQ structure
  const sphereQuestions: Record<string, string[]> = {
    SPHERE_1: ['Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13'], // Habitudes de vie
    SPHERE_2: ['Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20', 'Q21'], // Conciliation
    SPHERE_3: ['Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29'], // Environnement
    SPHERE_4: ['Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36', 'Q37'], // Pratiques gestion
  };

  const sphereScoreAggregates: Record<string, { total: number; count: number }> = {};

  for (const sphereId of Object.keys(sphereQuestions)) {
    sphereScoreAggregates[sphereId] = { total: 0, count: 0 };
  }

  for (const response of responses) {
    const data = response.responses as Record<string, any>;
    if (!data) continue;

    for (const [sphereId, questions] of Object.entries(sphereQuestions)) {
      for (const qId of questions) {
        const value = data[qId];
        if (typeof value === 'number' && value >= 0 && value <= 10) {
          sphereScoreAggregates[sphereId].total += value;
          sphereScoreAggregates[sphereId].count++;
        }
      }
    }
  }

  return SPHERES.map(s => {
    const agg = sphereScoreAggregates[s.id];
    const avgScore = agg.count > 0 ? (agg.total / agg.count) : 0;
    // Convert 0-10 scale to 0-100
    const score100 = Math.round(avgScore * 10);
    return {
      sphere: s.id,
      score: score100,
      name: s.name,
      short: s.short,
      color: s.color,
    };
  });
}

// Calculate priority matrix based on Q38 responses and sphere scores
function calculatePriorityMatrix(
  responses: any[],
  sphereScores: { sphere: string; score: number; name: string; short: string; color: string }[]
): { sphere: string; name: string; score: number; importance: number; priority: 'HIGH' | 'MEDIUM' | 'LOW'; color: string }[] {
  // Count Q38 selections (importance votes)
  const importanceVotes: Record<string, number> = {
    SPHERE_1: 0,
    SPHERE_2: 0,
    SPHERE_3: 0,
    SPHERE_4: 0,
  };

  for (const response of responses) {
    const data = response.responses as Record<string, any>;
    if (!data?.Q38) continue;
    const vote = data.Q38;
    if (importanceVotes[vote] !== undefined) {
      importanceVotes[vote]++;
    }
  }

  const totalVotes = Object.values(importanceVotes).reduce((a, b) => a + b, 0);

  return sphereScores.map(s => {
    const votes = importanceVotes[s.sphere] || 0;
    const importance = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    // Risk = 100 - score (higher risk when lower score)
    const risk = 100 - s.score;
    
    // Priority quadrant:
    // HIGH: High importance (>25%) AND high risk (score < 50)
    // MEDIUM: Either high importance OR high risk
    // LOW: Low importance AND low risk
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (importance > 25 && s.score < 50) {
      priority = 'HIGH';
    } else if (importance > 25 || s.score < 50) {
      priority = 'MEDIUM';
    }

    return {
      sphere: s.sphere,
      name: s.name,
      score: s.score,
      importance,
      priority,
      color: s.color,
    };
  });
}

// Calculate responses by department with anonymity check
function calculateDepartmentBreakdown(
  responses: any[],
  departments: { code: string; name: string }[],
  anonymityThreshold: number
): { code: string; name: string; responseCount: number; isAnonymous: boolean; sphereScores?: any[] }[] {
  const deptResponses: Record<string, any[]> = {};

  for (const response of responses) {
    const data = response.responses as Record<string, any>;
    const dept = data?.Q4;
    if (dept) {
      if (!deptResponses[dept]) deptResponses[dept] = [];
      deptResponses[dept].push(response);
    }
  }

  return departments.map(d => {
    const deptResps = deptResponses[d.code] || [];
    const meetsThreshold = deptResps.length >= anonymityThreshold;
    
    return {
      code: d.code,
      name: d.name,
      responseCount: deptResps.length,
      isAnonymous: !meetsThreshold,
      sphereScores: meetsThreshold ? calculateSphereScores(deptResps) : undefined,
    };
  });
}

// Calculate financial metrics (presenteeism ROI)
function calculateFinancialMetrics(
  responses: any[],
  targetPopulation: number,
  avgDailyRate: number
): {
  presenteeismRate: number;
  lostDays: number;
  annualCost: number;
  costPerEmployee: number;
  potentialSavings10Percent: number;
} {
  // Extract health/presenteeism data from Module 3 questions if available
  // For now, use aggregate estimation based on sphere 1 (health) scores
  let presenteeismIndicators = 0;
  let healthScoreTotal = 0;
  let healthCount = 0;

  for (const response of responses) {
    const data = response.responses as Record<string, any>;
    // Health perception questions (Q60-Q64 in module 3)
    for (const qId of ['Q60', 'Q61', 'Q62', 'Q63', 'Q64', 'Q65']) {
      const value = data?.[qId];
      if (typeof value === 'number') {
        healthScoreTotal += value;
        healthCount++;
      }
    }
    // Direct presenteeism question if available
    if (data?.Q67 !== undefined) {
      presenteeismIndicators++;
    }
  }

  // Estimate presenteeism rate (inverse of health score)
  // If no health data, use industry average of 6%
  let presenteeismRate = 6;
  if (healthCount > 0) {
    const avgHealthScore = healthScoreTotal / healthCount;
    // Convert: low health score (0-4) = high presenteeism, high score (7-10) = low presenteeism
    presenteeismRate = Math.max(2, Math.min(15, 15 - avgHealthScore * 1.3));
  }

  // Calculate lost days
  const workingDaysPerYear = 220;
  const lostDays = Math.round((presenteeismRate / 100) * targetPopulation * workingDaysPerYear);

  // Calculate annual cost
  const annualCost = Math.round(lostDays * avgDailyRate);
  const costPerEmployee = targetPopulation > 0 ? Math.round(annualCost / targetPopulation) : 0;

  // Potential savings with 10% reduction
  const potentialSavings10Percent = Math.round(annualCost * 0.1);

  return {
    presenteeismRate: Math.round(presenteeismRate * 10) / 10,
    lostDays,
    annualCost,
    costPerEmployee,
    potentialSavings10Percent,
  };
}

// Get benchmarks for comparison
async function getBenchmarks(sector: string | null): Promise<{ sphere: string; benchmark: number }[]> {
  try {
    // Try to get sector-specific benchmarks
    if (sector) {
      const benchmark = await prisma.qVCTBenchmark.findFirst({
        where: { sector },
      });
      if (benchmark) {
        return [
          { sphere: 'SPHERE_1', benchmark: benchmark.sphere1HabitudesVie || DEFAULT_BENCHMARKS.sphere1 },
          { sphere: 'SPHERE_2', benchmark: benchmark.sphere2Conciliation || DEFAULT_BENCHMARKS.sphere2 },
          { sphere: 'SPHERE_3', benchmark: benchmark.sphere3Environnement || DEFAULT_BENCHMARKS.sphere3 },
          { sphere: 'SPHERE_4', benchmark: benchmark.sphere4Pratiques || DEFAULT_BENCHMARKS.sphere4 },
        ];
      }
    }
  } catch {
    // Fall through to defaults
  }

  return [
    { sphere: 'SPHERE_1', benchmark: DEFAULT_BENCHMARKS.sphere1 },
    { sphere: 'SPHERE_2', benchmark: DEFAULT_BENCHMARKS.sphere2 },
    { sphere: 'SPHERE_3', benchmark: DEFAULT_BENCHMARKS.sphere3 },
    { sphere: 'SPHERE_4', benchmark: DEFAULT_BENCHMARKS.sphere4 },
  ];
}
