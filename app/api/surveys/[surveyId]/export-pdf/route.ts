import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/surveys/[surveyId]/export-pdf
 * Generate PDF report for Method B survey results
 * Returns HTML that can be converted to PDF on client side
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { surveyId } = await params;

    // Get survey with company and aggregate
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        company: true,
        aggregate: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Enquête non trouvée' }, { status: 404 });
    }

    if (!survey.aggregate) {
      return NextResponse.json({ error: 'Aucun résultat disponible' }, { status: 400 });
    }

    const company = survey.company;
    const aggregate = survey.aggregate;
    const avgTotalSalary = company.avgGrossSalary * (1 + company.employerContributionRate);
    const payroll = avgTotalSalary * company.employeesCount;

    // Parse distributions
    let factorDistribution: Record<string, number> = {};
    let impactDistribution: Record<string, number> = {};
    try {
      if (aggregate.factorDistribution) {
        factorDistribution = JSON.parse(aggregate.factorDistribution);
      }
      if (aggregate.impactDistribution) {
        impactDistribution = JSON.parse(aggregate.impactDistribution);
      }
    } catch {}

    const factorLabels: Record<string, string> = {
      FATIGUE: 'Fatigue / manque de récupération',
      STRESS: 'Surcharge mentale / stress',
      PAIN: 'Douleurs physiques',
      CONCENTRATION: 'Difficulté de concentration',
      OTHER: 'Autre',
    };

    const impactLabels: Record<string, string> = {
      QUALITY: 'Qualité du travail',
      DELAYS: 'Respect des délais',
      COLLEAGUES: 'Charge reportée sur les collègues',
      ERRORS: 'Erreurs / reprises',
    };

    const formatCurrency = (value: number) => {
      return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    };

    const qualityLabel = aggregate.qualityFlag === 'HIGH' ? 'Élevée' : aggregate.qualityFlag === 'MEDIUM' ? 'Modérée' : 'Faible';
    const qualityColor = aggregate.qualityFlag === 'HIGH' ? '#22c55e' : aggregate.qualityFlag === 'MEDIUM' ? '#f59e0b' : '#ef4444';

    // Generate report data
    const reportData = {
      generatedAt: new Date().toISOString(),
      company: {
        name: company.name,
        sector: company.sector,
        employeesCount: company.employeesCount,
        avgGrossSalary: company.avgGrossSalary,
        avgTotalSalary,
        payroll,
      },
      survey: {
        title: survey.title,
        status: survey.status,
        closedAt: survey.closedAt?.toISOString() || null,
        responsesCount: survey._count.responses,
      },
      results: {
        respondentsCount: aggregate.respondentsCount,
        prevalence: aggregate.prevalence,
        avgEfficiencyScore: aggregate.avgEfficiencyScore,
        productivityLoss: 1 - aggregate.avgEfficiencyScore,
        responseRate: aggregate.responseRate || (aggregate.respondentsCount / company.employeesCount),
        qualityFlag: aggregate.qualityFlag,
        qualityLabel,
        presCostB: aggregate.presCostB,
        presCostBPct: aggregate.presCostBPct,
        presCostBPerEmployee: aggregate.presCostBPerEmployee,
        factorDistribution,
        impactDistribution,
      },
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Méthode B - ${company.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1f2937;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8b5cf6;
    }
    .header h1 {
      font-size: 24px;
      color: #8b5cf6;
      margin-bottom: 5px;
    }
    .header .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    .header .date {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    .info-box .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .info-box .value {
      font-size: 18px;
      font-weight: 700;
    }
    .info-box .subtext {
      font-size: 10px;
      color: #9ca3af;
    }
    .highlight-box {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
      text-align: center;
    }
    .highlight-box .main-value {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .highlight-box .main-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .highlight-box .sub-values {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    .highlight-box .sub-value {
      text-align: center;
    }
    .highlight-box .sub-value .num {
      font-size: 18px;
      font-weight: 600;
    }
    .highlight-box .sub-value .txt {
      font-size: 10px;
      opacity: 0.8;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .metric-card .value {
      font-size: 20px;
      font-weight: 700;
      color: #8b5cf6;
    }
    .metric-card .label {
      font-size: 10px;
      color: #6b7280;
      margin-top: 4px;
    }
    .distribution-section {
      margin-bottom: 20px;
    }
    .distribution-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .bar-container {
      margin-bottom: 8px;
    }
    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .bar {
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 6px;
    }
    .quality-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .highlight-box {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport Présentéisme - Méthode B</h1>
    <div class="subtitle">${company.name}</div>
    <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <div class="section">
    <div class="section-title">Informations entreprise</div>
    <div class="info-grid">
      <div class="info-box">
        <div class="label">Secteur</div>
        <div class="value" style="font-size: 14px;">${company.sector}</div>
      </div>
      <div class="info-box">
        <div class="label">Effectifs</div>
        <div class="value">${company.employeesCount}</div>
        <div class="subtext">salariés</div>
      </div>
      <div class="info-box">
        <div class="label">Salaire moyen chargé</div>
        <div class="value">${formatCurrency(avgTotalSalary)} €</div>
        <div class="subtext">par an</div>
      </div>
      <div class="info-box">
        <div class="label">Masse salariale</div>
        <div class="value">${formatCurrency(payroll)} €</div>
        <div class="subtext">annuelle</div>
      </div>
    </div>
  </div>

  <div class="highlight-box">
    <div class="main-value">${aggregate.presCostB ? formatCurrency(aggregate.presCostB) : 'N/A'} €</div>
    <div class="main-label">Coût annuel du présentéisme (Méthode B)</div>
    <div class="sub-values">
      <div class="sub-value">
        <div class="num">${aggregate.presCostBPct?.toFixed(1) || 'N/A'}%</div>
        <div class="txt">de la masse salariale</div>
      </div>
      <div class="sub-value">
        <div class="num">${aggregate.presCostBPerEmployee ? formatCurrency(aggregate.presCostBPerEmployee) : 'N/A'} €</div>
        <div class="txt">par salarié</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Résultats de l'enquête : ${survey.title}</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="value">${aggregate.respondentsCount}</div>
        <div class="label">Répondants</div>
      </div>
      <div class="metric-card">
        <div class="value">${(aggregate.prevalence * 100).toFixed(1)}%</div>
        <div class="label">Prévalence</div>
      </div>
      <div class="metric-card">
        <div class="value">${(aggregate.avgEfficiencyScore * 100).toFixed(0)}%</div>
        <div class="label">Efficacité moyenne</div>
      </div>
      <div class="metric-card">
        <div class="value" style="color: ${qualityColor};">${qualityLabel}</div>
        <div class="label">Fiabilité</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="two-col">
      <div class="distribution-section">
        <div class="distribution-title">Facteurs contribuants</div>
        ${Object.entries(factorDistribution)
          .filter(([_, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => `
            <div class="bar-container">
              <div class="bar-label">
                <span>${factorLabels[key] || key}</span>
                <span>${value}%</span>
              </div>
              <div class="bar">
                <div class="bar-fill" style="width: ${value}%; background: #f59e0b;"></div>
              </div>
            </div>
          `).join('')}
      </div>
      <div class="distribution-section">
        <div class="distribution-title">Impacts sur le travail</div>
        ${Object.entries(impactDistribution)
          .filter(([_, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => `
            <div class="bar-container">
              <div class="bar-label">
                <span>${impactLabels[key] || key}</span>
                <span>${value}%</span>
              </div>
              <div class="bar">
                <div class="bar-fill" style="width: ${value}%; background: #ef4444;"></div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Méthodologie</div>
    <p style="font-size: 11px; color: #6b7280; line-height: 1.6;">
      Ce rapport est basé sur la <strong>Méthode B (Micro - Enquête interne)</strong> qui mesure le présentéisme réel 
      à partir de réponses anonymes des collaborateurs. Le coût est calculé selon la formule :
      <br><br>
      <em>Coût = N° salariés concernés × Heures annuelles × Perte productivité × Valeur horaire × Coefficient correcteur</em>
      <br><br>
      Avec : Prévalence = ${(aggregate.prevalence * 100).toFixed(1)}%, Perte de productivité = ${((1 - aggregate.avgEfficiencyScore) * 100).toFixed(0)}%
    </p>
  </div>

  <div class="footer">
    <p>Rapport généré par AlterValue | ${new Date().toLocaleString('fr-FR')}</p>
    <p>Données confidentielles - Usage interne uniquement</p>
  </div>
</body>
</html>
      `,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
