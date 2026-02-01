/**
 * AlterValue PDF Report Generator v4.1
 * 
 * Génération de rapports PDF pour les campagnes d'enquête
 */

import { SurveyTypeDefinition } from './survey-calculation-engine';

export interface CampaignReportData {
  campaign: {
    id: string;
    name: string;
    status: string;
    launchedAt: string | null;
    closedAt: string | null;
  };
  company: {
    name: string;
    sector: string;
    employeesCount: number;
  };
  surveyType: {
    name: string;
    category: string;
    estimatedDuration: number;
  };
  result: {
    responseCount: number;
    participationRate: number | null;
    scores: Record<string, number>;
    criticalIndicators: Record<string, any>;
    financialMetrics: Record<string, number> | null;
    narrative: string | null;
    calculatedAt: string | null;
  };
}

const DIMENSION_LABELS: Record<string, string> = {
  sens_travail: 'Sens du travail',
  charge_travail: 'Charge de travail',
  autonomie: 'Autonomie',
  relations_collegues: 'Relations collègues',
  soutien_management: 'Soutien management',
  reconnaissance: 'Reconnaissance',
  equilibre_vie: 'Équilibre vie pro/perso',
  environnement_physique: 'Environnement physique',
  securite_emploi: 'Sécurité de l\'emploi',
  developpement_competences: 'Développement compétences',
  qvct_global: 'Score QVCT Global',
  presenteeism_rate: 'Taux présentéisme',
  productivity_loss: 'Perte productivité',
  engagement_score: 'Score engagement',
  health_wellbeing: 'Santé / Bien-être',
  work_environment: 'Environnement travail',
  bnq_score_global: 'Score BNQ Global',
  pratiques_organisationnelles: 'Pratiques organisationnelles',
  pratiques_manageriales: 'Pratiques managériales',
  conciliation_travail: 'Conciliation travail-vie',
  sante_securite: 'Santé & Sécurité',
};

const getScoreColor = (score: number, max: number = 10): string => {
  const ratio = score / max;
  if (ratio >= 0.7) return '#22c55e';
  if (ratio >= 0.5) return '#f59e0b';
  return '#ef4444';
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'warning': return '#eab308';
    default: return '#3b82f6';
  }
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function generateExecutiveReportHTML(data: CampaignReportData): string {
  const { campaign, company, surveyType, result } = data;
  const avgScore = Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.keys(result.scores).length;
  const sortedScores = Object.entries(result.scores)
    .filter(([_, v]) => typeof v === 'number')
    .sort((a, b) => b[1] - a[1]);
  
  const topScores = sortedScores.slice(0, 3);
  const bottomScores = sortedScores.slice(-3).reverse();
  const criticalCount = Object.values(result.criticalIndicators || {}).filter((i: any) => 
    i.severity === 'critical' || i.severity === 'high'
  ).length;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport ${campaign.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      font-size: 11pt;
    }
    
    .page {
      padding: 40px 50px;
      min-height: 100vh;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #c9a227;
    }
    
    .logo {
      font-size: 24pt;
      font-weight: 700;
      color: #c9a227;
    }
    
    .logo span {
      color: #14b8a6;
    }
    
    .report-info {
      text-align: right;
      font-size: 9pt;
      color: #6b7280;
    }
    
    .report-date {
      font-weight: 600;
      color: #1f2937;
    }
    
    .title-section {
      margin-bottom: 30px;
    }
    
    h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 12pt;
      color: #6b7280;
    }
    
    .company-badge {
      display: inline-block;
      background: linear-gradient(135deg, #c9a227 0%, #dab02f 100%);
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 500;
      margin-top: 10px;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    
    .kpi-value {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
    }
    
    .kpi-value.score {
      color: ${getScoreColor(avgScore)};
    }
    
    .kpi-label {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #14b8a6;
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .score-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    
    .score-label {
      font-size: 10pt;
      font-weight: 500;
    }
    
    .score-value {
      font-size: 14pt;
      font-weight: 700;
    }
    
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .insight-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
    }
    
    .insight-card h4 {
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .insight-card.positive h4 {
      color: #22c55e;
    }
    
    .insight-card.negative h4 {
      color: #f59e0b;
    }
    
    .insight-list {
      list-style: none;
    }
    
    .insight-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
    }
    
    .insight-list li:last-child {
      border-bottom: none;
    }
    
    .alert-card {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    
    .alert-card.critical {
      background: #fee2e2;
      border-color: #ef4444;
    }
    
    .alert-title {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 4px;
    }
    
    .alert-message {
      font-size: 10pt;
      color: #6b7280;
    }
    
    .financial-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .financial-card {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .financial-value {
      font-size: 20pt;
      font-weight: 700;
    }
    
    .financial-label {
      font-size: 9pt;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    .narrative-box {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      font-size: 11pt;
      line-height: 1.8;
      color: #374151;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #9ca3af;
    }
    
    .confidential {
      color: #ef4444;
      font-weight: 600;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">Alter<span>Value</span></div>
      <div class="report-info">
        <div class="report-date">${formatDate(result.calculatedAt)}</div>
        <div>Rapport de diagnostic</div>
        <div>${surveyType.name}</div>
      </div>
    </div>
    
    <!-- Title -->
    <div class="title-section">
      <h1>${campaign.name}</h1>
      <div class="subtitle">${surveyType.category} • ${company.name}</div>
      <div class="company-badge">${company.sector} • ${company.employeesCount} collaborateurs</div>
    </div>
    
    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-value">${result.responseCount}</div>
        <div class="kpi-label">Répondants</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${result.participationRate ? result.participationRate + '%' : 'N/A'}</div>
        <div class="kpi-label">Taux de participation</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value score">${avgScore.toFixed(1)}/10</div>
        <div class="kpi-label">Score moyen</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" style="color: ${criticalCount > 0 ? '#ef4444' : '#22c55e'}">${criticalCount}</div>
        <div class="kpi-label">Alertes détectées</div>
      </div>
    </div>
    
    <!-- Scores by dimension -->
    <div class="section">
      <h2 class="section-title">Scores par dimension</h2>
      <div class="scores-grid">
        ${sortedScores.map(([key, value]) => `
          <div class="score-item" style="border-left-color: ${getScoreColor(value)}">
            <span class="score-label">${DIMENSION_LABELS[key] || key.replace(/_/g, ' ')}</span>
            <span class="score-value" style="color: ${getScoreColor(value)}">${value.toFixed(1)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Insights -->
    <div class="section">
      <h2 class="section-title">Analyse des résultats</h2>
      <div class="insights-grid">
        <div class="insight-card positive">
          <h4>✅ Points forts</h4>
          <ul class="insight-list">
            ${topScores.map(([key, value]) => `
              <li>
                <span>${DIMENSION_LABELS[key] || key.replace(/_/g, ' ')}</span>
                <span style="color: ${getScoreColor(value)}; font-weight: 600;">${value.toFixed(1)}/10</span>
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="insight-card negative">
          <h4>⚠️ Axes d'amélioration</h4>
          <ul class="insight-list">
            ${bottomScores.filter(([_, v]) => v < 7).slice(0, 3).map(([key, value]) => `
              <li>
                <span>${DIMENSION_LABELS[key] || key.replace(/_/g, ' ')}</span>
                <span style="color: ${getScoreColor(value)}; font-weight: 600;">${value.toFixed(1)}/10</span>
              </li>
            `).join('') || '<li>Aucun axe critique identifié</li>'}
          </ul>
        </div>
      </div>
    </div>
    
    ${Object.keys(result.criticalIndicators || {}).length > 0 ? `
    <!-- Alerts -->
    <div class="section">
      <h2 class="section-title">Indicateurs critiques</h2>
      ${Object.entries(result.criticalIndicators || {}).map(([key, indicator]: [string, any]) => `
        <div class="alert-card ${indicator.severity}">
          <div class="alert-title" style="color: ${getSeverityColor(indicator.severity)}">
            ${indicator.severity === 'critical' ? '🔴' : '🟠'} ${indicator.message || key}
          </div>
          ${indicator.recommendation ? `<div class="alert-message">${indicator.recommendation}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${result.financialMetrics && Object.keys(result.financialMetrics).length > 0 ? `
    <!-- Financial -->
    <div class="section">
      <h2 class="section-title">Impact financier estimé</h2>
      <div class="financial-grid">
        ${Object.entries(result.financialMetrics).slice(0, 3).map(([key, value]) => `
          <div class="financial-card">
            <div class="financial-value">${typeof value === 'number' && value >= 1000 ? formatCurrency(value) : value}</div>
            <div class="financial-label">${key.replace(/_/g, ' ')}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${result.narrative ? `
    <!-- Narrative -->
    <div class="section">
      <h2 class="section-title">Synthèse</h2>
      <div class="narrative-box">
        ${result.narrative}
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div>
        <span class="confidential">CONFIDENTIEL</span> - Document généré par AlterValue
      </div>
      <div>
        Campagne #${campaign.id.substring(0, 8)} • ${formatDate(new Date().toISOString())}
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function generateRadarChartSVG(scores: Record<string, number>, maxScore: number = 10): string {
  const data = Object.entries(scores).filter(([_, v]) => typeof v === 'number');
  const n = data.length;
  if (n === 0) return '';
  
  const cx = 200;
  const cy = 200;
  const r = 150;
  
  // Generate polygon points
  const points = data.map(([_, value], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const ratio = value / maxScore;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  });
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  // Generate grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridLines = gridLevels.map(level => {
    const gridPoints = data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: cx + r * level * Math.cos(angle),
        y: cy + r * level * Math.sin(angle),
      };
    });
    return gridPoints.map(p => `${p.x},${p.y}`).join(' ');
  });
  
  // Generate axis lines and labels
  const axes = data.map(([key, _], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const labelR = r + 20;
    return {
      x1: cx,
      y1: cy,
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      labelX: cx + labelR * Math.cos(angle),
      labelY: cy + labelR * Math.sin(angle),
      label: (DIMENSION_LABELS[key] || key).substring(0, 12),
    };
  });
  
  return `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Grid -->
  ${gridLines.map((points, i) => `
    <polygon points="${points}" fill="none" stroke="#e5e7eb" stroke-width="1" />
  `).join('')}
  
  <!-- Axes -->
  ${axes.map(axis => `
    <line x1="${axis.x1}" y1="${axis.y1}" x2="${axis.x2}" y2="${axis.y2}" stroke="#e5e7eb" stroke-width="1" />
  `).join('')}
  
  <!-- Data polygon -->
  <polygon points="${polygonPoints}" fill="rgba(201, 162, 39, 0.3)" stroke="#c9a227" stroke-width="2" />
  
  <!-- Data points -->
  ${points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="5" fill="#c9a227" />
  `).join('')}
  
  <!-- Labels -->
  ${axes.map(axis => `
    <text x="${axis.labelX}" y="${axis.labelY}" text-anchor="middle" font-size="10" fill="#6b7280">${axis.label}</text>
  `).join('')}
  
  <!-- Center score -->
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#c9a227">
    ${(data.reduce((sum, [_, v]) => sum + v, 0) / n).toFixed(1)}
  </text>
</svg>
`;
}
