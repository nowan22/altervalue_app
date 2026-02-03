import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateStrategicReportHTML, StrategicReportData } from '@/lib/pdf-strategic-report';

// Sphere mapping for PDF (SPHERE_1..4 -> readable names)
const SPHERE_MAPPING: Record<string, { name: string; key: string; color: string }> = {
  SPHERE_1: { name: 'Santé & Bien-être', key: 'SANTE', color: '#ef4444' },
  SPHERE_2: { name: 'Équilibre Vie Pro/Perso', key: 'EQUILIBRE', color: '#8b5cf6' },
  SPHERE_3: { name: 'Environnement de Travail', key: 'ENVIRONNEMENT', color: '#14b8a6' },
  SPHERE_4: { name: 'Management & Organisation', key: 'MANAGEMENT', color: '#c9a227' },
};

// Question labels for Top 3 display
const QUESTION_LABELS: Record<string, { label: string; sphere: string }> = {
  Q5: { label: 'Activité physique régulière', sphere: 'SPHERE_1' },
  Q6: { label: 'Alimentation équilibrée', sphere: 'SPHERE_1' },
  Q7: { label: 'Qualité du sommeil', sphere: 'SPHERE_1' },
  Q8: { label: 'Gestion du stress quotidien', sphere: 'SPHERE_1' },
  Q9: { label: 'Consommation substances', sphere: 'SPHERE_1' },
  Q10: { label: 'Énergie au quotidien', sphere: 'SPHERE_1' },
  Q11: { label: 'Santé mentale générale', sphere: 'SPHERE_1' },
  Q12: { label: 'Motivation au travail', sphere: 'SPHERE_1' },
  Q13: { label: 'Symptômes physiques récurrents', sphere: 'SPHERE_1' },
  Q14: { label: 'Flexibilité des horaires', sphere: 'SPHERE_2' },
  Q15: { label: 'Télétravail disponible', sphere: 'SPHERE_2' },
  Q16: { label: 'Charge de travail acceptable', sphere: 'SPHERE_2' },
  Q17: { label: 'Respect des temps de repos', sphere: 'SPHERE_2' },
  Q18: { label: 'Droit à la déconnexion', sphere: 'SPHERE_2' },
  Q19: { label: 'Temps pour vie personnelle', sphere: 'SPHERE_2' },
  Q20: { label: 'Équilibre ressenti', sphere: 'SPHERE_2' },
  Q21: { label: 'Pression des deadlines', sphere: 'SPHERE_2' },
  Q22: { label: 'Conditions matérielles', sphere: 'SPHERE_3' },
  Q23: { label: 'Ergonomie du poste', sphere: 'SPHERE_3' },
  Q24: { label: 'Ambiance sonore', sphere: 'SPHERE_3' },
  Q25: { label: 'Qualité de l\'air et température', sphere: 'SPHERE_3' },
  Q26: { label: 'Outils et équipements', sphere: 'SPHERE_3' },
  Q27: { label: 'Espaces de détente', sphere: 'SPHERE_3' },
  Q28: { label: 'Sécurité au travail', sphere: 'SPHERE_3' },
  Q29: { label: 'Relations avec collègues', sphere: 'SPHERE_3' },
  Q30: { label: 'Clarté des objectifs', sphere: 'SPHERE_4' },
  Q31: { label: 'Reconnaissance du manager', sphere: 'SPHERE_4' },
  Q32: { label: 'Autonomie décisionnelle', sphere: 'SPHERE_4' },
  Q33: { label: 'Feedback régulier', sphere: 'SPHERE_4' },
  Q34: { label: 'Opportunités d\'évolution', sphere: 'SPHERE_4' },
  Q35: { label: 'Sens du travail', sphere: 'SPHERE_4' },
  Q36: { label: 'Communication managériale', sphere: 'SPHERE_4' },
  Q37: { label: 'Soutien hiérarchique', sphere: 'SPHERE_4' },
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Fetch campaign with company and survey type info
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            sector: true,
            employeesCount: true,
            avgGrossSalary: true,
          },
        },
        surveyType: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    if (campaign.status !== 'CLOSED' && campaign.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'La campagne doit être clôturée pour générer le rapport' },
        { status: 400 }
      );
    }

    // =====================================================
    // CRITICAL: Fetch analytics from the SAME API endpoint
    // that powers the dashboard to ensure data consistency
    // =====================================================
    const analyticsData = await fetchAnalyticsData(params.id);
    
    if (!analyticsData) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des données analytiques' },
        { status: 500 }
      );
    }

    // Transform sphereScores from array format to record format
    const sphereScoresRecord: Record<string, number> = {};
    for (const s of analyticsData.sphereScores || []) {
      // Map SPHERE_1..4 to MANAGEMENT, ENVIRONNEMENT, etc.
      const mapping = SPHERE_MAPPING[s.sphere];
      if (mapping) {
        sphereScoresRecord[mapping.key] = s.score;
      }
    }

    // Transform priorityMatrix from sphere-based to include proper names/colors
    const transformedMatrix = (analyticsData.sphereScores || []).map((s: any) => {
      const mapping = SPHERE_MAPPING[s.sphere];
      const importance = calculateSphereImportance(s.sphere, analyticsData);
      const priority = determinePriority(s.score, importance);
      
      return {
        dimension: mapping?.key || s.sphere,
        sphere: mapping?.key || s.sphere,
        name: mapping?.name || s.name,
        score: s.score,
        importance,
        priority,
        quadrant: getQuadrant(s.score, importance),
        color: mapping?.color || s.color,
      };
    });

    // Calculate question-level scores for Top 3 critical questions
    const questionScores = await calculateQuestionScores(params.id);

    // Prepare report data
    const reportData: StrategicReportData = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        launchedAt: campaign.launchedAt?.toISOString() || null,
        closedAt: campaign.closedAt?.toISOString() || null,
      },
      company: {
        name: campaign.company.name,
        sector: campaign.company.sector,
        employeesCount: campaign.company.employeesCount,
        avgGrossSalary: campaign.company.avgGrossSalary,
      },
      surveyType: {
        name: campaign.surveyType.name,
        category: campaign.surveyType.category,
      },
      analytics: {
        totalResponses: analyticsData.participation?.totalResponses || 0,
        participationRate: analyticsData.participation?.participationRate || 0,
        sphereScores: sphereScoresRecord,
        priorityMatrix: transformedMatrix,
        financialMetrics: analyticsData.financialMetrics || {
          avgPresenteeismDays: 0,
          estimatedProductivityLoss: 33,
          estimatedAnnualCost: 0,
          costPerEmployee: 0,
          potentialSavings: 0,
        },
        q38Distribution: extractQ38Distribution(analyticsData),
        departmentBreakdown: analyticsData.departmentBreakdown || {},
        dimensionScores: {},
        questionScores, // NEW: Individual question scores for Top 3
      },
      generatedAt: new Date().toISOString(),
    };

    // Generate HTML
    const htmlContent = generateStrategicReportHTML(reportData);

    // Create PDF generation request
    const createResponse = await fetch(
      'https://apps.abacus.ai/api/createConvertHtmlToPdfRequest',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: htmlContent,
          pdf_options: {
            format: 'A4',
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
            print_background: true,
          },
        }),
      }
    );

    if (!createResponse.ok) {
      console.error('PDF creation failed:', await createResponse.text());
      return NextResponse.json(
        { error: 'Erreur lors de la création du PDF' },
        { status: 500 }
      );
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json(
        { error: 'Aucun ID de requête retourné' },
        { status: 500 }
      );
    }

    // Poll for status
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        'https://apps.abacus.ai/api/getConvertHtmlToPdfStatus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id,
            deployment_token: process.env.ABACUSAI_API_KEY,
          }),
        }
      );

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS') {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64');
          const filename = `rapport_strategique_${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        }
        return NextResponse.json(
          { error: 'PDF généré mais aucune donnée' },
          { status: 500 }
        );
      } else if (status === 'FAILED') {
        const errorMsg = result?.error || 'Génération PDF échouée';
        console.error('PDF generation failed:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      attempts++;
    }

    return NextResponse.json(
      { error: 'Délai de génération PDF dépassé' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating strategic report:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport stratégique' },
      { status: 500 }
    );
  }
}

/**
 * Fetch analytics data directly from the database using the SAME logic
 * as the /api/diagnostic/campaigns/[id]/analytics endpoint
 */
async function fetchAnalyticsData(campaignId: string) {
  try {
    // Sphere definitions
    const SPHERES = [
      { id: 'SPHERE_1', name: 'Santé & Bien-être', short: 'Santé', color: '#ef4444' },
      { id: 'SPHERE_2', name: 'Équilibre Vie Pro/Perso', short: 'Équilibre', color: '#8b5cf6' },
      { id: 'SPHERE_3', name: 'Environnement de Travail', short: 'Environnement', color: '#14b8a6' },
      { id: 'SPHERE_4', name: 'Management & Organisation', short: 'Management', color: '#c9a227' },
    ];

    // Question to sphere mapping
    const sphereQuestions: Record<string, string[]> = {
      SPHERE_1: ['Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13'],
      SPHERE_2: ['Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20', 'Q21'],
      SPHERE_3: ['Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29'],
      SPHERE_4: ['Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36', 'Q37'],
    };

    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: campaignId },
      include: {
        company: true,
        responses: true,
      },
    });

    if (!campaign) return null;

    const responses = campaign.responses || [];
    const targetPopulation = campaign.targetPopulation || campaign.company.employeesCount;
    const anonymityThreshold = campaign.minRespondents || 5;

    // Calculate participation
    const participationRate = targetPopulation > 0 
      ? Math.round((responses.length / targetPopulation) * 100) 
      : 0;

    // Calculate sphere scores
    const sphereScoreAggregates: Record<string, { total: number; count: number }> = {};
    for (const sphereId of Object.keys(sphereQuestions)) {
      sphereScoreAggregates[sphereId] = { total: 0, count: 0 };
    }

    // Process responses - use response.responses (NOT response.answers)
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

    const sphereScores = SPHERES.map(s => {
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

    // Calculate Q38 distribution
    const importanceVotes: Record<string, number> = {
      SPHERE_1: 0, SPHERE_2: 0, SPHERE_3: 0, SPHERE_4: 0,
    };
    for (const response of responses) {
      const data = response.responses as Record<string, any>;
      if (data?.Q38 && importanceVotes[data.Q38] !== undefined) {
        importanceVotes[data.Q38]++;
      }
    }

    // Calculate financial metrics
    let totalPresenteeismDays = 0;
    let presenteeismCount = 0;
    for (const response of responses) {
      const data = response.responses as Record<string, any>;
      const q37 = data?.Q37;
      if (typeof q37 === 'number') {
        totalPresenteeismDays += q37;
        presenteeismCount++;
      }
    }

    const avgPresenteeismDays = presenteeismCount > 0 
      ? totalPresenteeismDays / presenteeismCount 
      : 2;
    const annualPresenteeismDays = avgPresenteeismDays * 12;
    const dailyCost = (campaign.company.avgGrossSalary * 1.45) / 218;
    const productivityLoss = 0.33;
    const estimatedAnnualCost = campaign.company.employeesCount * annualPresenteeismDays * dailyCost * productivityLoss;
    const potentialSavings = estimatedAnnualCost * 0.30;

    return {
      participation: {
        totalResponses: responses.length,
        targetPopulation,
        participationRate,
        meetsThreshold: responses.length >= anonymityThreshold,
      },
      sphereScores,
      importanceVotes,
      financialMetrics: {
        avgPresenteeismDays,
        estimatedProductivityLoss: productivityLoss * 100,
        estimatedAnnualCost: Math.round(estimatedAnnualCost),
        costPerEmployee: Math.round(estimatedAnnualCost / campaign.company.employeesCount),
        potentialSavings: Math.round(potentialSavings),
      },
      departmentBreakdown: [],
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}

/**
 * Calculate individual question scores for Top 3 critical questions
 */
async function calculateQuestionScores(campaignId: string): Promise<Array<{
  questionId: string;
  label: string;
  sphere: string;
  sphereName: string;
  score: number;
  responseCount: number;
}>> {
  const campaign = await prisma.surveyCampaign.findUnique({
    where: { id: campaignId },
    include: { responses: true },
  });

  if (!campaign) return [];

  const questionAggregates: Record<string, { total: number; count: number }> = {};

  for (const response of campaign.responses) {
    const data = response.responses as Record<string, any>;
    if (!data) continue;

    for (const [qId, value] of Object.entries(data)) {
      if (QUESTION_LABELS[qId] && typeof value === 'number' && value >= 0 && value <= 10) {
        if (!questionAggregates[qId]) {
          questionAggregates[qId] = { total: 0, count: 0 };
        }
        questionAggregates[qId].total += value;
        questionAggregates[qId].count++;
      }
    }
  }

  const results = Object.entries(questionAggregates).map(([qId, agg]) => {
    const labelInfo = QUESTION_LABELS[qId];
    const avgScore = agg.count > 0 ? (agg.total / agg.count) * 10 : 0; // Convert to 0-100
    const sphereMapping = SPHERE_MAPPING[labelInfo.sphere];
    
    return {
      questionId: qId,
      label: labelInfo.label,
      sphere: labelInfo.sphere,
      sphereName: sphereMapping?.name || labelInfo.sphere,
      score: Math.round(avgScore),
      responseCount: agg.count,
    };
  });

  // Sort by score ascending (lowest scores = most critical)
  return results.sort((a, b) => a.score - b.score);
}

/**
 * Calculate sphere importance from Q38 votes
 */
function calculateSphereImportance(sphereId: string, analyticsData: any): number {
  const votes = analyticsData.importanceVotes || {};
  const totalVotes = Object.values(votes).reduce((a: number, b: any) => a + (b as number), 0);
  if (totalVotes === 0) return 0;
  return Math.round(((votes[sphereId] || 0) / totalVotes) * 100);
}

/**
 * Determine priority level
 */
function determinePriority(score: number, importance: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score < 50 && importance > 25) return 'HIGH';
  if (score < 50 || importance > 25) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get quadrant name
 */
function getQuadrant(score: number, importance: number): string {
  if (score < 50 && importance > 25) return 'danger';
  if (score < 50) return 'warning';
  if (importance > 25) return 'consolidate';
  return 'maintain';
}

/**
 * Extract Q38 distribution
 */
function extractQ38Distribution(analyticsData: any): Record<string, number> {
  return analyticsData.importanceVotes || {
    SPHERE_1: 0, SPHERE_2: 0, SPHERE_3: 0, SPHERE_4: 0,
  };
}
