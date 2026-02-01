import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  calculateBNQResults,
  ResponseData,
  CompanyContext,
  BNQCalculationResult,
  SphereScoreResult,
  RPSDimensionScore,
  PresenteeismResult,
  TMSResult,
  DistressResult,
  CriticalityMatrix,
} from '@/lib/bnq-calculation-engine';
import { getCachedBNQResults, invalidateCache } from '@/lib/bnq-calculation-cache';

// Transform raw JSON responses to ResponseData format
function transformResponses(rawResponses: any[]): ResponseData[][] {
  return rawResponses.map((response: any) => {
    const responseData = response.responses as Record<string, any>;
    const transformed: ResponseData[] = [];
    
    for (const [questionId, value] of Object.entries(responseData)) {
      // Skip metadata fields
      if (questionId.startsWith('_') || questionId === 'fingerprint') {
        continue;
      }
      
      transformed.push({
        questionId,
        value: value as number | string | string[] | null,
        skipped: value === null || value === undefined,
      });
    }
    
    return transformed;
  });
}

// Apply anonymity filter to results
function applyAnonymityFilter(
  result: BNQCalculationResult,
  threshold: number,
  module3Threshold: number = 30
): BNQCalculationResult {
  // Filter sphere scores
  const filteredSphereScores = result.sphereScores.map((sphere) => {
    if (sphere.respondentCount < threshold) {
      return {
        ...sphere,
        score: 0,
        itemScores: [],
        priorityRate: 0,
        criticalityIndex: 0,
        isConfidential: true,
        color: 'red' as const,
      };
    }
    return sphere;
  });
  
  // Filter RPS scores
  const filteredRpsScores = result.rpsScores?.map((rps) => {
    if (rps.respondentCount < threshold) {
      return {
        ...rps,
        score: 0,
        isConfidential: true,
        color: 'red' as const,
      };
    }
    return rps;
  });
  
  // Filter Module 3 results (higher threshold)
  let filteredPresenteeism = result.presenteeism;
  let filteredTms = result.tms;
  let filteredDistress = result.distress;
  let filteredFinancialMetrics = result.financialMetrics;
  
  if (result.presenteeism && result.presenteeism.respondentCount < module3Threshold) {
    filteredPresenteeism = {
      ...result.presenteeism,
      prevalenceRate: 0,
      avgEfficiency: 0,
      productivityLossCoeff: 0,
      presenteeismDays: 0,
      annualCost: 0,
      costPerEmployee: 0,
      costAsPayrollPct: 0,
      roiEstimate: 0,
      isConfidential: true,
    };
    filteredFinancialMetrics = undefined;
  }
  
  if (result.tms && result.tms.respondentCount < module3Threshold) {
    filteredTms = {
      ...result.tms,
      prevalence: 0,
      topZones: [],
      impactScore: 0,
      isConfidential: true,
    };
  }
  
  if (result.distress && result.distress.respondentCount < module3Threshold) {
    filteredDistress = {
      ...result.distress,
      rate: 0,
      avgStressLevel: 0,
      color: 'green' as const,
      isConfidential: true,
    };
  }
  
  // Filter priority matrix
  const filteredPriorityMatrix = result.priorityMatrix.map((item) => {
    const sphere = filteredSphereScores.find(s => s.sphereId === item.sphereId);
    if (sphere?.isConfidential) {
      return {
        ...item,
        score: 0,
        priorityRate: 0,
        criticalityIndex: 0,
      };
    }
    return item;
  });
  
  // Filter critical indicators based on confidentiality
  const filteredCriticalIndicators: Record<string, { triggered: boolean; severity: string; message: string }> = {};
  
  for (const [key, indicator] of Object.entries(result.criticalIndicators)) {
    // Only include non-confidential indicators
    if (key.startsWith('low_')) {
      const sphereId = parseInt(key.replace('low_', ''));
      const sphere = filteredSphereScores.find(s => s.sphereId === sphereId);
      if (sphere && !sphere.isConfidential) {
        filteredCriticalIndicators[key] = indicator;
      }
    } else if (key === 'high_presenteeism' || key === 'severe_productivity_loss') {
      if (filteredPresenteeism && !filteredPresenteeism.isConfidential) {
        filteredCriticalIndicators[key] = indicator;
      }
    } else if (key === 'high_distress') {
      if (filteredDistress && !filteredDistress.isConfidential) {
        filteredCriticalIndicators[key] = indicator;
      }
    } else {
      filteredCriticalIndicators[key] = indicator;
    }
  }
  
  return {
    ...result,
    sphereScores: filteredSphereScores,
    priorityMatrix: filteredPriorityMatrix,
    rpsScores: filteredRpsScores,
    presenteeism: filteredPresenteeism,
    tms: filteredTms,
    distress: filteredDistress,
    criticalIndicators: filteredCriticalIndicators,
    financialMetrics: filteredFinancialMetrics,
  };
}

// GET /api/surveys/[surveyId]/analytics - Get analytics for a survey campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId: campaignId } = await params;

    // Get campaign with all related data
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: campaignId },
      include: {
        company: true,
        surveyType: true,
        responses: {
          where: { isComplete: true },
          orderBy: { submittedAt: 'asc' },
        },
        result: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Check if BNQ Ultimate survey type
    const definition = campaign.surveyType.definition as any;
    const isBNQUltimate = definition?.survey_type_id === 'BNQ_ULTIMATE';

    // Get anonymity thresholds
    const anonymityThreshold = campaign.anonymityThreshold || campaign.surveyType.anonymityThreshold || 15;
    const module3Threshold = definition?.data_governance?.anonymity_threshold_module3 || 30;
    const activeModules = (campaign.activeModules as number[]) || [0, 1];

    // Check minimum respondent count
    const responseCount = campaign.responses.length;
    if (responseCount < 1) {
      return NextResponse.json({
        success: true,
        campaignId,
        campaignName: campaign.name,
        responseCount: 0,
        meetsAnonymityThreshold: false,
        anonymityThreshold,
        message: 'Aucune réponse reçue',
        results: null,
      });
    }

    // Transform responses for calculation engine
    const transformedResponses = transformResponses(campaign.responses);

    // Company context for financial calculations
    const companyContext: CompanyContext = {
      employeesCount: campaign.company.employeesCount,
      avgGrossSalary: campaign.company.avgGrossSalary,
      employerContributionRate: campaign.company.employerContributionRate,
      workingDaysPerYear: 220,
    };

    // Calculate configuration
    const calcConfig = {
      targetPopulation: campaign.targetPopulation || undefined,
      activeModules,
      module1Threshold: anonymityThreshold,
      module3Threshold,
    };

    // Get URL params for cache control
    const url = new URL(request.url);
    const forceRecalculate = url.searchParams.get('refresh') === 'true';

    // Calculate results with caching
    const { result: rawResult, fromCache, cacheAge } = getCachedBNQResults(
      campaignId,
      transformedResponses,
      companyContext,
      calcConfig,
      forceRecalculate
    );

    // Apply anonymity filter server-side (CRITICAL: Always apply before sending to frontend)
    const filteredResult = applyAnonymityFilter(rawResult, anonymityThreshold, module3Threshold);

    // Check if meets threshold
    const meetsAnonymityThreshold = responseCount >= anonymityThreshold;

    // Calculate module 3 threshold status separately
    const meetsModule3Threshold = responseCount >= module3Threshold;

    // Prepare response
    const analyticsResponse = {
      success: true,
      campaignId,
      campaignName: campaign.name,
      companyName: campaign.company.name,
      surveyType: campaign.surveyType.name,
      
      // Metadata
      responseCount: filteredResult.responseCount,
      participationRate: filteredResult.participationRate,
      completionRate: filteredResult.completionRate,
      avgDuration: filteredResult.avgDuration,
      
      // Threshold status
      anonymityThreshold,
      module3Threshold,
      meetsAnonymityThreshold,
      meetsModule3Threshold,
      
      // Active modules
      activeModules,
      
      // Core results (Module 1)
      sphereScores: filteredResult.sphereScores,
      priorityMatrix: filteredResult.priorityMatrix,
      topLevers: filteredResult.topLevers,
      
      // Module 2: RPS (if enabled)
      rpsScores: activeModules.includes(2) ? filteredResult.rpsScores : undefined,
      rpsCriticalDimension: activeModules.includes(2) ? filteredResult.rpsCriticalDimension : undefined,
      
      // Module 3: Health & Presenteeism (if enabled)
      presenteeism: activeModules.includes(3) ? filteredResult.presenteeism : undefined,
      tms: activeModules.includes(3) ? filteredResult.tms : undefined,
      distress: activeModules.includes(3) ? filteredResult.distress : undefined,
      
      // Critical indicators
      criticalIndicators: filteredResult.criticalIndicators,
      
      // Financial metrics (only if Module 3 enabled and threshold met)
      financialMetrics: activeModules.includes(3) && meetsModule3Threshold 
        ? filteredResult.financialMetrics 
        : undefined,
      
      // Cache info
      cache: {
        fromCache,
        cacheAge: cacheAge !== undefined ? `${cacheAge}s` : undefined,
      },
      
      // Warnings
      warnings: [] as string[],
    };

    // Add warnings if thresholds not met
    if (!meetsAnonymityThreshold) {
      analyticsResponse.warnings.push(
        `Seuil d'anonymat non atteint (${responseCount}/${anonymityThreshold}). Certaines données sont masquées.`
      );
    }
    
    if (activeModules.includes(3) && !meetsModule3Threshold) {
      analyticsResponse.warnings.push(
        `Seuil Module 3 (Santé) non atteint (${responseCount}/${module3Threshold}). Les données de santé/présentéisme sont masquées.`
      );
    }

    return NextResponse.json(analyticsResponse);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des analyses' },
      { status: 500 }
    );
  }
}

// POST /api/surveys/[surveyId]/analytics - Trigger recalculation and save results
export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId: campaignId } = await params;

    // Get campaign with all related data
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: campaignId },
      include: {
        company: true,
        surveyType: true,
        responses: {
          where: { isComplete: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Invalidate cache to force recalculation
    invalidateCache(campaignId);

    // Get thresholds
    const definition = campaign.surveyType.definition as any;
    const anonymityThreshold = campaign.anonymityThreshold || campaign.surveyType.anonymityThreshold || 15;
    const module3Threshold = definition?.data_governance?.anonymity_threshold_module3 || 30;
    const activeModules = (campaign.activeModules as number[]) || [0, 1];

    // Transform and calculate
    const transformedResponses = transformResponses(campaign.responses);
    
    const companyContext: CompanyContext = {
      employeesCount: campaign.company.employeesCount,
      avgGrossSalary: campaign.company.avgGrossSalary,
      employerContributionRate: campaign.company.employerContributionRate,
      workingDaysPerYear: 220,
    };

    const calcConfig = {
      targetPopulation: campaign.targetPopulation || undefined,
      activeModules,
      module1Threshold: anonymityThreshold,
      module3Threshold,
    };

    // Force recalculation
    const { result } = getCachedBNQResults(
      campaignId,
      transformedResponses,
      companyContext,
      calcConfig,
      true // Force recalculate
    );

    // Save results to database (convert arrays to JSON for Prisma)
    await prisma.campaignResult.upsert({
      where: { campaignId },
      create: {
        campaignId,
        responseCount: result.responseCount,
        participationRate: result.participationRate,
        completionRate: result.completionRate,
        avgDuration: result.avgDuration || 0,
        scores: {},
        sphereScores: JSON.parse(JSON.stringify(result.sphereScores)),
        priorityMatrix: JSON.parse(JSON.stringify(result.priorityMatrix)),
        topLevers: JSON.parse(JSON.stringify(result.topLevers)),
        rpsScores: result.rpsScores ? JSON.parse(JSON.stringify(result.rpsScores)) : undefined,
        rpsCriticalDimension: result.rpsCriticalDimension,
        presenteeismRate: result.presenteeism?.prevalenceRate,
        presenteeismCost: result.presenteeism?.annualCost,
        productivityLoss: result.presenteeism?.productivityLossCoeff,
        tmsPrevalence: result.tms?.prevalence,
        distressRate: result.distress?.rate,
        criticalIndicators: JSON.parse(JSON.stringify(result.criticalIndicators)),
        financialMetrics: result.financialMetrics ? JSON.parse(JSON.stringify(result.financialMetrics)) : undefined,
        calculatedAt: new Date(),
      },
      update: {
        responseCount: result.responseCount,
        participationRate: result.participationRate,
        completionRate: result.completionRate,
        avgDuration: result.avgDuration || 0,
        sphereScores: JSON.parse(JSON.stringify(result.sphereScores)),
        priorityMatrix: JSON.parse(JSON.stringify(result.priorityMatrix)),
        topLevers: JSON.parse(JSON.stringify(result.topLevers)),
        rpsScores: result.rpsScores ? JSON.parse(JSON.stringify(result.rpsScores)) : undefined,
        rpsCriticalDimension: result.rpsCriticalDimension,
        presenteeismRate: result.presenteeism?.prevalenceRate,
        presenteeismCost: result.presenteeism?.annualCost,
        productivityLoss: result.presenteeism?.productivityLossCoeff,
        tmsPrevalence: result.tms?.prevalence,
        distressRate: result.distress?.rate,
        criticalIndicators: JSON.parse(JSON.stringify(result.criticalIndicators)),
        financialMetrics: result.financialMetrics ? JSON.parse(JSON.stringify(result.financialMetrics)) : undefined,
        calculatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Résultats recalculés et sauvegardés',
      responseCount: result.responseCount,
      meetsAnonymityThreshold: result.responseCount >= anonymityThreshold,
    });
  } catch (error) {
    console.error('Error recalculating analytics:', error);
    return NextResponse.json(
      { error: 'Erreur lors du recalcul des analyses' },
      { status: 500 }
    );
  }
}
