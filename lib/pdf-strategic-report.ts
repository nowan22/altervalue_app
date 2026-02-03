/**
 * AlterValue Strategic PDF Report Generator v4.4 (Phase Zeta)
 * 
 * Génération de rapports PDF stratégiques haute qualité (20-25 pages)
 * Basé sur les données de l'API /analytics
 */

// ====================
// TYPES & INTERFACES
// ====================

export interface StrategicReportData {
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
    avgGrossSalary: number;
  };
  surveyType: {
    name: string;
    category: string;
  };
  analytics: {
    totalResponses: number;
    participationRate: number;
    sphereScores: Record<string, number>;
    priorityMatrix: Array<{
      dimension: string;
      sphere: string;
      name: string;
      score: number;
      importance: number;
      priority: string;
      quadrant: string;
      color: string;
    }>;
    financialMetrics: {
      avgPresenteeismDays: number;
      estimatedProductivityLoss: number;
      estimatedAnnualCost: number;
      costPerEmployee: number;
      potentialSavings: number;
    };
    q38Distribution: Record<string, number>;
    departmentBreakdown: Record<string, any>;
    dimensionScores: Record<string, number>;
    questionScores?: Array<{
      questionId: string;
      label: string;
      sphere: string;
      sphereName: string;
      score: number;
      responseCount: number;
    }>;
  };
  generatedAt: string;
}

// ====================
// CONSTANTS
// ====================

const COLORS = {
  gold: '#c9a227',
  goldLight: '#dab02f',
  teal: '#14b8a6',
  tealDark: '#0d9488',
  anthracite: '#1f2937',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  grayLighter: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const SPHERE_LABELS: Record<string, { name: string; icon: string; description: string }> = {
  MANAGEMENT: {
    name: 'Management & Organisation',
    icon: '👔',
    description: 'Qualité du management, reconnaissance, autonomie et sens du travail'
  },
  ENVIRONNEMENT: {
    name: 'Environnement de Travail',
    icon: '🏢',
    description: 'Conditions matérielles, sécurité, ambiance et relations professionnelles'
  },
  EQUILIBRE: {
    name: 'Équilibre Vie Pro/Perso',
    icon: '⚖️',
    description: 'Charge de travail, flexibilité, respect des temps de repos'
  },
  SANTE: {
    name: 'Santé & Bien-être',
    icon: '❤️',
    description: 'Santé physique et mentale, stress, fatigue, engagement'
  },
};

const DIMENSION_LABELS: Record<string, string> = {
  // Management
  reconnaissance: 'Reconnaissance',
  autonomie: 'Autonomie',
  sens_travail: 'Sens du travail',
  soutien_management: 'Soutien managérial',
  communication: 'Communication',
  leadership: 'Leadership',
  // Environnement
  conditions_materielles: 'Conditions matérielles',
  securite: 'Sécurité',
  ambiance: 'Ambiance de travail',
  relations_collegues: 'Relations collègues',
  outils_travail: 'Outils de travail',
  // Équilibre
  charge_travail: 'Charge de travail',
  flexibilite: 'Flexibilité',
  deconnexion: 'Droit à la déconnexion',
  temps_personnel: 'Temps personnel',
  // Santé
  stress: 'Niveau de stress',
  fatigue: 'Fatigue',
  energie: 'Énergie',
  motivation: 'Motivation',
  engagement: 'Engagement',
};

// ====================
// UTILITY FUNCTIONS
// ====================

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

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
};

const getScoreColor = (score: number): string => {
  if (score >= 70) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const getScoreLevel = (score: number): string => {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Satisfaisant';
  if (score >= 45) return 'À surveiller';
  if (score >= 30) return 'Préoccupant';
  return 'Critique';
};

// ====================
// CSS STYLES
// ====================

const getBaseStyles = (): string => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  @page {
    size: A4;
    margin: 0;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: ${COLORS.white};
    color: ${COLORS.anthracite};
    line-height: 1.5;
    font-size: 10pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    page-break-after: always;
    position: relative;
    background: ${COLORS.white};
  }
  
  .page:last-child {
    page-break-after: auto;
  }
  
  /* Cover Page Styles */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(135deg, ${COLORS.anthracite} 0%, #111827 100%);
    color: ${COLORS.white};
    padding: 0;
  }
  
  .cover-header {
    padding: 25mm 25mm 0;
  }
  
  .cover-logo {
    font-size: 32pt;
    font-weight: 800;
    letter-spacing: -1px;
  }
  
  .cover-logo .alter {
    color: ${COLORS.gold};
  }
  
  .cover-logo .value {
    color: ${COLORS.teal};
  }
  
  .cover-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 25mm;
  }
  
  .cover-badge {
    display: inline-block;
    background: ${COLORS.gold};
    color: ${COLORS.anthracite};
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  
  .cover-title {
    font-size: 36pt;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 15px;
    color: ${COLORS.white};
  }
  
  .cover-subtitle {
    font-size: 16pt;
    font-weight: 400;
    color: ${COLORS.grayLight};
    margin-bottom: 40px;
  }
  
  .cover-company {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 20px 25px;
    margin-top: 20px;
  }
  
  .cover-company-name {
    font-size: 18pt;
    font-weight: 700;
    color: ${COLORS.gold};
    margin-bottom: 8px;
  }
  
  .cover-company-info {
    font-size: 10pt;
    color: ${COLORS.grayLight};
  }
  
  .cover-footer {
    padding: 0 25mm 25mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  
  .cover-date {
    font-size: 11pt;
    color: ${COLORS.grayLight};
  }
  
  .cover-confidential {
    background: ${COLORS.danger};
    color: ${COLORS.white};
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .cover-decoration {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40mm;
    height: 200mm;
    background: linear-gradient(180deg, ${COLORS.gold}22 0%, ${COLORS.teal}22 100%);
    border-radius: 100px 0 0 100px;
  }
  
  /* Content Page Styles */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    margin-bottom: 15px;
    border-bottom: 2px solid ${COLORS.gold};
  }
  
  .page-logo {
    font-size: 14pt;
    font-weight: 700;
  }
  
  .page-logo .alter { color: ${COLORS.gold}; }
  .page-logo .value { color: ${COLORS.teal}; }
  
  .page-info {
    font-size: 8pt;
    color: ${COLORS.gray};
    text-align: right;
  }
  
  .page-title {
    font-size: 20pt;
    font-weight: 700;
    color: ${COLORS.anthracite};
    margin-bottom: 5px;
  }
  
  .page-subtitle {
    font-size: 10pt;
    color: ${COLORS.gray};
    margin-bottom: 20px;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 12pt;
    font-weight: 600;
    color: ${COLORS.anthracite};
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid ${COLORS.teal};
  }
  
  /* KPI Cards */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .kpi-card {
    background: ${COLORS.background};
    border: 1px solid ${COLORS.grayLighter};
    border-radius: 10px;
    padding: 15px;
    text-align: center;
  }
  
  .kpi-card.highlight {
    background: linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.teal}15 100%);
    border-color: ${COLORS.gold}40;
  }
  
  .kpi-icon {
    font-size: 20pt;
    margin-bottom: 8px;
  }
  
  .kpi-value {
    font-size: 22pt;
    font-weight: 700;
    color: ${COLORS.anthracite};
    line-height: 1;
  }
  
  .kpi-value.score {
    color: ${COLORS.gold};
  }
  
  .kpi-label {
    font-size: 8pt;
    color: ${COLORS.gray};
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .kpi-sublabel {
    font-size: 7pt;
    color: ${COLORS.grayLight};
    margin-top: 2px;
  }
  
  /* Summary Box */
  .summary-box {
    background: ${COLORS.background};
    border-left: 4px solid ${COLORS.teal};
    border-radius: 0 10px 10px 0;
    padding: 18px 20px;
    margin-bottom: 20px;
  }
  
  .summary-box h4 {
    font-size: 11pt;
    font-weight: 600;
    color: ${COLORS.teal};
    margin-bottom: 10px;
  }
  
  .summary-box p {
    font-size: 10pt;
    line-height: 1.7;
    color: ${COLORS.anthracite};
  }
  
  /* Health Indicator */
  .health-indicator {
    display: flex;
    align-items: center;
    gap: 15px;
    background: ${COLORS.background};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .health-gauge {
    width: 100px;
    height: 100px;
    position: relative;
  }
  
  .health-gauge svg {
    transform: rotate(-90deg);
  }
  
  .health-gauge-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18pt;
    font-weight: 700;
  }
  
  .health-details {
    flex: 1;
  }
  
  .health-level {
    font-size: 14pt;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .health-description {
    font-size: 9pt;
    color: ${COLORS.gray};
  }
  
  /* ROI Box */
  .roi-box {
    background: linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.tealDark} 100%);
    color: ${COLORS.white};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .roi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .roi-title {
    font-size: 11pt;
    font-weight: 600;
    opacity: 0.9;
  }
  
  .roi-badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 500;
  }
  
  .roi-value {
    font-size: 28pt;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .roi-sublabel {
    font-size: 9pt;
    opacity: 0.8;
  }
  
  /* Page Footer */
  .page-footer {
    position: absolute;
    bottom: 15mm;
    left: 20mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: ${COLORS.grayLight};
    padding-top: 8px;
    border-top: 1px solid ${COLORS.grayLighter};
  }
  
  .page-number {
    font-weight: 500;
  }
  
  .confidential-footer {
    color: ${COLORS.danger};
    font-weight: 600;
  }
`;

// ====================
// PAGE GENERATORS
// ====================

/**
 * Page 1: Page de Garde
 */
function generateCoverPage(data: StrategicReportData): string {
  const { campaign, company, surveyType, generatedAt } = data;
  
  return `
    <div class="page cover-page">
      <div class="cover-decoration"></div>
      
      <div class="cover-header">
        <div class="cover-logo">
          <span class="alter">Alter</span><span class="value">Value</span>
        </div>
      </div>
      
      <div class="cover-content">
        <span class="cover-badge">Rapport Stratégique</span>
        <h1 class="cover-title">Diagnostic QVCT<br/>BNQ 9700-800</h1>
        <p class="cover-subtitle">${surveyType.name}</p>
        
        <div class="cover-company">
          <div class="cover-company-name">${company.name}</div>
          <div class="cover-company-info">
            ${company.sector} • ${formatNumber(company.employeesCount)} collaborateurs
          </div>
        </div>
      </div>
      
      <div class="cover-footer">
        <div class="cover-date">
          <strong>Campagne :</strong> ${campaign.name}<br/>
          <strong>Date du rapport :</strong> ${formatDate(generatedAt)}
        </div>
        <div class="cover-confidential">Confidentiel</div>
      </div>
    </div>
  `;
}

/**
 * Page 2: Synthèse Décisionnelle (Executive Summary)
 */
function generateExecutiveSummaryPage(data: StrategicReportData, pageNumber: number): string {
  const { campaign, company, analytics } = data;
  
  // Calculate global score
  const sphereValues = Object.values(analytics.sphereScores);
  const globalScore = sphereValues.length > 0
    ? Math.round(sphereValues.reduce((a, b) => a + b, 0) / sphereValues.length)
    : 0;
  
  const scoreColor = getScoreColor(globalScore);
  const scoreLevel = getScoreLevel(globalScore);
  
  // Generate health narrative
  const healthNarrative = generateHealthNarrative(globalScore, analytics);
  
  // ROI calculation
  const potentialSavings = analytics.financialMetrics?.potentialSavings || 0;
  const annualCost = analytics.financialMetrics?.estimatedAnnualCost || 0;
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-logo"><span class="alter">Alter</span><span class="value">Value</span></div>
        <div class="page-info">${company.name}<br/>${formatDate(data.generatedAt)}</div>
      </div>
      
      <h2 class="page-title">Synthèse Décisionnelle</h2>
      <p class="page-subtitle">Vue d'ensemble des indicateurs clés de votre organisation</p>
      
      <!-- Health Indicator -->
      <div class="health-indicator">
        <div class="health-gauge">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="${COLORS.grayLighter}" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="${scoreColor}" stroke-width="8"
              stroke-dasharray="${283 * globalScore / 100} 283"
              stroke-linecap="round"/>
          </svg>
          <div class="health-gauge-value" style="color: ${scoreColor}">${globalScore}</div>
        </div>
        <div class="health-details">
          <div class="health-level" style="color: ${scoreColor}">
            ${scoreLevel}
          </div>
          <div class="health-description">
            Score global QVCT sur 100 points, calculé à partir des 4 sphères BNQ 9700-800
          </div>
        </div>
      </div>
      
      <!-- KPIs Grid -->
      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-icon">📊</div>
          <div class="kpi-value score">${globalScore}/100</div>
          <div class="kpi-label">Score Global QVCT</div>
          <div class="kpi-sublabel">Moyenne des 4 sphères</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-value">${analytics.participationRate}%</div>
          <div class="kpi-label">Taux de Participation</div>
          <div class="kpi-sublabel">${formatNumber(analytics.totalResponses)} répondants</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📅</div>
          <div class="kpi-value">${analytics.financialMetrics?.avgPresenteeismDays?.toFixed(1) || '--'}</div>
          <div class="kpi-label">Jours Présentéisme</div>
          <div class="kpi-sublabel">Par collaborateur/mois</div>
        </div>
      </div>
      
      <!-- Narrative Summary -->
      <div class="summary-box">
        <h4>🎯 État de Santé Organisationnelle</h4>
        <p>${healthNarrative}</p>
      </div>
      
      <!-- ROI Box -->
      <div class="roi-box">
        <div class="roi-header">
          <span class="roi-title">💰 Impact Financier du Présentéisme</span>
          <span class="roi-badge">Estimation annuelle</span>
        </div>
        <div class="roi-value">${formatCurrency(annualCost)}</div>
        <div class="roi-sublabel">
          Coût estimé du présentéisme • Potentiel d'économies : ${formatCurrency(potentialSavings)}
        </div>
      </div>
      
      <!-- Sphere Overview -->
      <div class="section">
        <h3 class="section-title">Vue par Sphère BNQ</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          ${Object.entries(analytics.sphereScores).map(([sphere, score]) => {
            const sphereInfo = SPHERE_LABELS[sphere] || { name: sphere, icon: '📌' };
            const color = getScoreColor(score);
            return `
              <div style="background: ${COLORS.background}; border-radius: 8px; padding: 12px; text-align: center; border-left: 3px solid ${color};">
                <div style="font-size: 16pt;">${sphereInfo.icon}</div>
                <div style="font-size: 16pt; font-weight: 700; color: ${color};">${Math.round(score)}</div>
                <div style="font-size: 7pt; color: ${COLORS.gray}; margin-top: 4px;">${sphereInfo.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

/**
 * Generate health narrative based on scores
 */
function generateHealthNarrative(globalScore: number, analytics: StrategicReportData['analytics']): string {
  const spheres = analytics.sphereScores;
  
  // Find strengths and weaknesses
  const sortedSpheres = Object.entries(spheres)
    .sort((a, b) => b[1] - a[1]);
  const strongest = sortedSpheres[0];
  const weakest = sortedSpheres[sortedSpheres.length - 1];
  
  const strongestInfo = SPHERE_LABELS[strongest?.[0]] || { name: strongest?.[0] };
  const weakestInfo = SPHERE_LABELS[weakest?.[0]] || { name: weakest?.[0] };
  
  // Presenteeism context
  const presRate = analytics.financialMetrics?.avgPresenteeismDays || 0;
  
  let intro = '';
  let body = '';
  let conclusion = '';
  
  if (globalScore >= 75) {
    intro = `Votre organisation affiche un excellent niveau de Qualité de Vie et des Conditions de Travail avec un score global de ${globalScore}/100.`;
    body = `La sphère "${strongestInfo.name}" se distingue particulièrement avec un score de ${Math.round(strongest[1])}/100, témoignant d'une culture d'entreprise solide.`;
    conclusion = `Maintenir ce niveau d'excellence nécessite une veille continue sur les indicateurs de vigilance.`;
  } else if (globalScore >= 60) {
    intro = `Votre organisation présente un niveau satisfaisant de QVCT avec un score global de ${globalScore}/100, laissant place à des optimisations ciblées.`;
    body = `La sphère "${strongestInfo.name}" constitue un point d'appui (${Math.round(strongest[1])}/100), tandis que "${weakestInfo.name}" (${Math.round(weakest[1])}/100) mérite une attention prioritaire.`;
    conclusion = `Un plan d'action ciblé permettrait d'améliorer significativement le bien-être des collaborateurs.`;
  } else if (globalScore >= 45) {
    intro = `Votre organisation présente un niveau de QVCT à surveiller avec un score global de ${globalScore}/100, révélant des axes d'amélioration importants.`;
    body = `Si "${strongestInfo.name}" maintient un niveau acceptable (${Math.round(strongest[1])}/100), la sphère "${weakestInfo.name}" (${Math.round(weakest[1])}/100) nécessite une intervention rapide.`;
    conclusion = presRate > 3 
      ? `Avec ${presRate.toFixed(1)} jours de présentéisme déclarés par mois, l'impact sur la productivité est significatif.`
      : `Une démarche structurée d'amélioration de la QVCT est recommandée.`;
  } else {
    intro = `Votre organisation fait face à des défis importants en matière de QVCT avec un score global de ${globalScore}/100.`;
    body = `La sphère "${weakestInfo.name}" (${Math.round(weakest[1])}/100) présente un niveau critique nécessitant une action immédiate. Même "${strongestInfo.name}" (${Math.round(strongest[1])}/100) reste en-dessous des standards recommandés.`;
    conclusion = `Un plan d'action d'urgence avec accompagnement expert est fortement recommandé pour inverser cette tendance.`;
  }
  
  return `${intro} ${body} ${conclusion}`;
}

// ====================
// PAGE 3: RADAR BNQ (Vue Multidimensionnelle)
// ====================

function generateRadarPage(data: StrategicReportData, pageNumber: number): string {
  const { analytics, company } = data;
  const sphereScores = analytics.sphereScores;
  
  // Map sphere keys to correct order for radar (clockwise from top)
  const sphereOrder = ['MANAGEMENT', 'ENVIRONNEMENT', 'EQUILIBRE', 'SANTE'];
  const scores = sphereOrder.map(key => sphereScores[key] || 0);
  
  // SVG radar chart parameters
  const centerX = 200;
  const centerY = 180;
  const maxRadius = 140;
  const levels = 5; // 20, 40, 60, 80, 100
  const angleStep = (2 * Math.PI) / 4; // 4 spheres
  const startAngle = -Math.PI / 2; // Start from top
  
  // Generate grid lines (concentric pentagons)
  const gridLines = [];
  for (let level = 1; level <= levels; level++) {
    const radius = (maxRadius * level) / levels;
    const points = [];
    for (let i = 0; i < 4; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    gridLines.push(`<polygon points="${points.join(' ')}" fill="none" stroke="${COLORS.grayLighter}" stroke-width="1" opacity="0.6"/>`);
  }
  
  // Generate axis lines
  const axisLines = [];
  for (let i = 0; i < 4; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    axisLines.push(`<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="${COLORS.grayLight}" stroke-width="1" stroke-dasharray="4,4"/>`);
  }
  
  // Generate data polygon
  const dataPoints = [];
  for (let i = 0; i < 4; i++) {
    const angle = startAngle + i * angleStep;
    const radius = (maxRadius * scores[i]) / 100;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    dataPoints.push({ x, y, score: scores[i] });
  }
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Generate labels with scores
  const labelPositions = [
    { x: centerX, y: centerY - maxRadius - 25 }, // Top - Management
    { x: centerX + maxRadius + 15, y: centerY }, // Right - Environnement
    { x: centerX, y: centerY + maxRadius + 35 }, // Bottom - Équilibre
    { x: centerX - maxRadius - 15, y: centerY }, // Left - Santé
  ];
  
  const sphereLabels = sphereOrder.map((key, i) => {
    const info = SPHERE_LABELS[key] || { name: key, icon: '📌' };
    const score = Math.round(scores[i]);
    const color = getScoreColor(score);
    const pos = labelPositions[i];
    const anchor = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
    return `
      <g>
        <text x="${pos.x}" y="${pos.y}" text-anchor="${anchor}" font-size="11" font-weight="600" fill="${COLORS.anthracite}">${info.icon} ${info.name.split(' ')[0]}</text>
        <text x="${pos.x}" y="${pos.y + 16}" text-anchor="${anchor}" font-size="14" font-weight="700" fill="${color}">${score}/100</text>
      </g>
    `;
  });
  
  // Analyze radar shape for interpretation
  const radarAnalysis = analyzeRadarShape(scores, sphereOrder);
  
  // Sphere legend descriptions (BNQ 9700-800)
  const sphereDefinitions = [
    { key: 'MANAGEMENT', desc: 'Qualité du leadership, reconnaissance, autonomie décisionnelle et sens du travail au quotidien.' },
    { key: 'ENVIRONNEMENT', desc: 'Conditions matérielles, ergonomie, sécurité physique et ambiance relationnelle.' },
    { key: 'EQUILIBRE', desc: 'Conciliation vie professionnelle/personnelle, charge de travail et respect des temps de repos.' },
    { key: 'SANTE', desc: 'Santé physique et mentale, niveau de stress, fatigue chronique et engagement durable.' },
  ];
  
  return `
    <div class="page radar-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge">Radar BNQ</span>
        </div>
      </div>
      
      <h2 class="page-title">Radar BNQ — Vue Multidimensionnelle</h2>
      <p class="page-subtitle">Analyse graphique des 4 sphères de la norme BNQ 9700-800</p>
      
      <!-- Radar Chart SVG -->
      <div class="radar-container" style="text-align: center; margin: 30px 0;">
        <svg viewBox="0 0 400 380" width="400" height="380" style="max-width: 100%;">
          <!-- Background circle -->
          <circle cx="${centerX}" cy="${centerY}" r="${maxRadius + 5}" fill="${COLORS.background}" stroke="${COLORS.grayLighter}" stroke-width="1"/>
          
          <!-- Grid lines -->
          ${gridLines.join('')}
          
          <!-- Scale labels -->
          <text x="${centerX + 8}" y="${centerY - maxRadius * 0.2 + 4}" font-size="8" fill="${COLORS.grayLight}">20</text>
          <text x="${centerX + 8}" y="${centerY - maxRadius * 0.4 + 4}" font-size="8" fill="${COLORS.grayLight}">40</text>
          <text x="${centerX + 8}" y="${centerY - maxRadius * 0.6 + 4}" font-size="8" fill="${COLORS.grayLight}">60</text>
          <text x="${centerX + 8}" y="${centerY - maxRadius * 0.8 + 4}" font-size="8" fill="${COLORS.grayLight}">80</text>
          <text x="${centerX + 8}" y="${centerY - maxRadius + 4}" font-size="8" fill="${COLORS.grayLight}">100</text>
          
          <!-- Axis lines -->
          ${axisLines.join('')}
          
          <!-- Data polygon (filled area) -->
          <polygon points="${polygonPoints}" fill="${COLORS.teal}" fill-opacity="0.25" stroke="${COLORS.teal}" stroke-width="2.5"/>
          
          <!-- Data points -->
          ${dataPoints.map((p, i) => {
            const color = getScoreColor(scores[i]);
            return `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${color}" stroke="${COLORS.white}" stroke-width="2"/>`;
          }).join('')}
          
          <!-- Labels -->
          ${sphereLabels.join('')}
        </svg>
      </div>
      
      <!-- Legend: BNQ 9700-800 Sphere Definitions -->
      <div class="section" style="margin-top: 25px;">
        <h3 class="section-title">📚 Légende — Définition des Sphères BNQ 9700-800</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px;">
          ${sphereDefinitions.map(s => {
            const info = SPHERE_LABELS[s.key];
            const score = Math.round(sphereScores[s.key] || 0);
            const color = getScoreColor(score);
            return `
              <div style="background: ${COLORS.background}; border-radius: 8px; padding: 12px; border-left: 4px solid ${color};">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 14pt;">${info.icon}</span>
                  <span style="font-weight: 600; font-size: 10pt; color: ${COLORS.anthracite};">${info.name}</span>
                </div>
                <p style="font-size: 8pt; color: ${COLORS.gray}; margin: 0; line-height: 1.4;">${s.desc}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Radar Shape Interpretation -->
      <div class="analysis-box" style="background: linear-gradient(135deg, ${COLORS.anthracite} 0%, #374151 100%); color: ${COLORS.white}; padding: 20px; border-radius: 12px; margin-top: 20px;">
        <h4 style="color: ${COLORS.gold}; margin: 0 0 12px 0; font-size: 11pt;">🔍 Analyse de la Forme du Radar</h4>
        <p style="font-size: 9pt; line-height: 1.6; margin: 0;">${radarAnalysis}</p>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

/**
 * Analyze the shape of the radar to generate interpretation text
 */
function analyzeRadarShape(scores: number[], sphereOrder: string[]): string {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const range = max - min;
  
  // CRITICAL: Handle case where all scores are 0 or nearly 0
  const allScoresZeroOrNear = scores.every(s => s < 5);
  if (allScoresZeroOrNear || avg === 0) {
    return `⚠️ ALERTE : Les données affichent des scores à 0 ou très proches de 0 sur toutes les sphères. Cela peut indiquer un problème technique de liaison de données ou une situation d'alerte maximale nécessitant une intervention immédiate. Veuillez vérifier la cohérence des données avec le Dashboard avant diffusion de ce rapport.`;
  }
  
  const maxIndex = scores.indexOf(max);
  const minIndex = scores.indexOf(min);
  
  const maxSphere = SPHERE_LABELS[sphereOrder[maxIndex]]?.name || sphereOrder[maxIndex];
  const minSphere = SPHERE_LABELS[sphereOrder[minIndex]]?.name || sphereOrder[minIndex];
  
  // Calculate standard deviation for asymmetry
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  let shapeAnalysis = '';
  
  // Analyze overall level
  if (avg >= 70) {
    shapeAnalysis = `Le radar présente une forme globalement harmonieuse avec une moyenne de ${Math.round(avg)}/100, témoignant d'une organisation performante en matière de QVCT. `;
  } else if (avg >= 50) {
    shapeAnalysis = `Le radar révèle un profil organisationnel moyen (${Math.round(avg)}/100) avec des marges de progression identifiables. `;
  } else if (avg >= 30) {
    shapeAnalysis = `Le radar met en évidence un profil organisationnel fragilisé (${Math.round(avg)}/100) nécessitant une attention particulière. `;
  } else {
    shapeAnalysis = `⚠️ Le radar révèle une situation critique (${Math.round(avg)}/100) nécessitant une intervention d'urgence sur l'ensemble des dimensions QVCT. `;
  }
  
  // Analyze asymmetry
  if (range > 30) {
    shapeAnalysis += `Un déséquilibre significatif est observable entre "${maxSphere}" (${Math.round(max)}/100) et "${minSphere}" (${Math.round(min)}/100), avec un écart de ${Math.round(range)} points. Ce déséquilibre organisationnel peut créer des tensions et doit être adressé en priorité.`;
  } else if (range > 15) {
    shapeAnalysis += `Une légère asymétrie apparaît entre les sphères, avec "${minSphere}" comme axe d'amélioration principal. L'équilibre général reste acceptable.`;
  } else {
    shapeAnalysis += `La forme équilibrée du radar indique une approche homogène de la QVCT dans toutes les dimensions. Cette cohérence est un atout pour des actions d'amélioration globales.`;
  }
  
  return shapeAnalysis;
}

// ====================
// PAGE 4: MATRICE DE PRIORISATION (Scatter Plot)
// ====================

function generatePriorityMatrixPage(data: StrategicReportData, pageNumber: number): string {
  const { analytics, company } = data;
  const priorityMatrix = analytics.priorityMatrix || [];
  
  // Chart dimensions
  const chartWidth = 380;
  const chartHeight = 280;
  const marginLeft = 50;
  const marginBottom = 40;
  const marginTop = 20;
  const marginRight = 20;
  const plotWidth = chartWidth - marginLeft - marginRight;
  const plotHeight = chartHeight - marginTop - marginBottom;
  
  // Calculate points (X = Risk = 100 - score, Y = Importance)
  const points = priorityMatrix.map(item => ({
    x: 100 - item.score, // Risk (inverted score)
    y: item.importance,
    name: item.name,
    sphere: item.sphere,
    score: item.score,
    priority: item.priority,
    color: item.color || COLORS.teal,
  }));
  
  // Scale functions - BUG #2 FIX: Both axes now go from 0 to 100
  const scaleX = (risk: number) => marginLeft + (risk / 100) * plotWidth;
  const scaleY = (importance: number) => marginTop + plotHeight - (importance / 100) * plotHeight; // Changed from 50 to 100
  
  // Generate grid lines
  const gridLinesX = [0, 25, 50, 75, 100].map(val => {
    const x = scaleX(val);
    return `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${marginTop + plotHeight}" stroke="${COLORS.grayLighter}" stroke-width="1"/>`;
  }).join('');
  
  const gridLinesY = [0, 25, 50, 75, 100].map(val => {
    const y = scaleY(val);
    return `<line x1="${marginLeft}" y1="${y}" x2="${marginLeft + plotWidth}" y2="${y}" stroke="${COLORS.grayLighter}" stroke-width="1"/>`;
  }).join('');
  
  // Axis labels - Updated to show 0-100%
  const xLabels = [0, 25, 50, 75, 100].map(val => {
    const x = scaleX(val);
    return `<text x="${x}" y="${marginTop + plotHeight + 20}" text-anchor="middle" font-size="8" fill="${COLORS.gray}">${val}%</text>`;
  }).join('');
  
  const yLabels = [0, 25, 50, 75, 100].map(val => {
    const y = scaleY(val);
    return `<text x="${marginLeft - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="${COLORS.gray}">${val}%</text>`;
  }).join('');
  
  // Quadrant backgrounds - midY now at 50% instead of 25%
  const midX = scaleX(50);
  const midY = scaleY(50);
  const quadrants = `
    <!-- Low Risk, Low Importance (bottom-left) - Green -->
    <rect x="${marginLeft}" y="${midY}" width="${midX - marginLeft}" height="${marginTop + plotHeight - midY}" fill="${COLORS.success}" fill-opacity="0.08"/>
    <!-- Low Risk, High Importance (top-left) - Gold -->
    <rect x="${marginLeft}" y="${marginTop}" width="${midX - marginLeft}" height="${midY - marginTop}" fill="${COLORS.gold}" fill-opacity="0.1"/>
    <!-- High Risk, Low Importance (bottom-right) - Orange -->
    <rect x="${midX}" y="${midY}" width="${marginLeft + plotWidth - midX}" height="${marginTop + plotHeight - midY}" fill="${COLORS.warning}" fill-opacity="0.1"/>
    <!-- High Risk, High Importance (top-right) - RED - DANGER ZONE -->
    <rect x="${midX}" y="${marginTop}" width="${marginLeft + plotWidth - midX}" height="${midY - marginTop}" fill="${COLORS.danger}" fill-opacity="0.15"/>
  `;
  
  // Quadrant labels
  const quadrantLabels = `
    <text x="${marginLeft + (midX - marginLeft) / 2}" y="${marginTop + plotHeight - 10}" text-anchor="middle" font-size="7" fill="${COLORS.success}" font-weight="500">Maintenir</text>
    <text x="${marginLeft + (midX - marginLeft) / 2}" y="${marginTop + 15}" text-anchor="middle" font-size="7" fill="${COLORS.gold}" font-weight="500">Consolider</text>
    <text x="${midX + (marginLeft + plotWidth - midX) / 2}" y="${marginTop + plotHeight - 10}" text-anchor="middle" font-size="7" fill="${COLORS.warning}" font-weight="500">Surveiller</text>
    <text x="${midX + (marginLeft + plotWidth - midX) / 2}" y="${marginTop + 15}" text-anchor="middle" font-size="7" fill="${COLORS.danger}" font-weight="600">🎯 PRIORITÉ</text>
  `;
  
  // Generate data points for spheres
  const dataPoints = points.map((p, i) => {
    const px = scaleX(p.x);
    const py = scaleY(p.y);
    const sphereInfo = SPHERE_LABELS[p.sphere] || { icon: '📌' };
    return `
      <g>
        <circle cx="${px}" cy="${py}" r="18" fill="${p.color}" fill-opacity="0.2" stroke="${p.color}" stroke-width="2"/>
        <text x="${px}" y="${py + 4}" text-anchor="middle" font-size="12">${sphereInfo.icon}</text>
        <text x="${px}" y="${py + 30}" text-anchor="middle" font-size="7" fill="${COLORS.anthracite}" font-weight="500">${p.name.split(' ')[0]}</text>
      </g>
    `;
  }).join('');
  
  // BUG #3 FIX: Top 3 now shows QUESTIONS, not SPHERES
  const questionScores = analytics.questionScores || [];
  const top3Questions = questionScores.slice(0, 3); // Already sorted by score ascending (lowest = most critical)
  
  return `
    <div class="page matrix-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge">Matrice de Priorisation</span>
        </div>
      </div>
      
      <h2 class="page-title">Matrice de Priorisation Stratégique</h2>
      <p class="page-subtitle">Croisement Risque × Importance perçue (Q38) pour identifier les leviers d'action prioritaires</p>
      
      <!-- Scatter Plot SVG -->
      <div class="matrix-container" style="text-align: center; margin: 25px 0;">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight + 30}" width="${chartWidth}" height="${chartHeight + 30}" style="max-width: 100%;">
          <!-- Chart background -->
          <rect x="${marginLeft}" y="${marginTop}" width="${plotWidth}" height="${plotHeight}" fill="${COLORS.white}" stroke="${COLORS.grayLight}" stroke-width="1"/>
          
          <!-- Quadrant backgrounds -->
          ${quadrants}
          
          <!-- Grid lines -->
          ${gridLinesX}
          ${gridLinesY}
          
          <!-- Quadrant labels -->
          ${quadrantLabels}
          
          <!-- Axes -->
          <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth}" y2="${marginTop + plotHeight}" stroke="${COLORS.anthracite}" stroke-width="2"/>
          <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="${COLORS.anthracite}" stroke-width="2"/>
          
          <!-- Axis labels -->
          ${xLabels}
          ${yLabels}
          
          <!-- Axis titles -->
          <text x="${marginLeft + plotWidth / 2}" y="${marginTop + plotHeight + 35}" text-anchor="middle" font-size="10" fill="${COLORS.anthracite}" font-weight="600">Risque (100 - Score) →</text>
          <text x="12" y="${marginTop + plotHeight / 2}" text-anchor="middle" font-size="10" fill="${COLORS.anthracite}" font-weight="600" transform="rotate(-90, 12, ${marginTop + plotHeight / 2})">Importance Q38 →</text>
          
          <!-- Data points -->
          ${dataPoints}
        </svg>
      </div>
      
      <!-- Legend -->
      <div style="display: flex; justify-content: center; gap: 20px; margin: 15px 0; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: ${COLORS.danger}; opacity: 0.3; border-radius: 4px;"></div>
          <span style="font-size: 8pt; color: ${COLORS.gray};">Zone Prioritaire</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: ${COLORS.warning}; opacity: 0.3; border-radius: 4px;"></div>
          <span style="font-size: 8pt; color: ${COLORS.gray};">À Surveiller</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: ${COLORS.gold}; opacity: 0.3; border-radius: 4px;"></div>
          <span style="font-size: 8pt; color: ${COLORS.gray};">À Consolider</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 16px; height: 16px; background: ${COLORS.success}; opacity: 0.3; border-radius: 4px;"></div>
          <span style="font-size: 8pt; color: ${COLORS.gray};">À Maintenir</span>
        </div>
      </div>
      
      <!-- Top 3 Priorities - NOW SHOWS QUESTIONS, NOT SPHERES -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">🎯 Top 3 — Questions Prioritaires à Traiter</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
          ${top3Questions.length > 0 ? top3Questions.map((q, i) => {
            const priorityColor = q.score < 40 ? COLORS.danger : q.score < 60 ? COLORS.warning : COLORS.success;
            const priorityLabel = q.score < 40 ? 'CRITIQUE' : q.score < 60 ? 'MODÉRÉ' : 'FAIBLE';
            return `
              <div style="display: flex; align-items: center; gap: 15px; background: ${COLORS.background}; border-radius: 10px; padding: 14px 18px; border-left: 4px solid ${priorityColor};">
                <div style="font-size: 24pt; min-width: 45px; text-align: center; color: ${priorityColor}; font-weight: 700;">#${i + 1}</div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 11pt; color: ${COLORS.anthracite}; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>${q.label} (${q.questionId})</span>
                    <span style="font-size: 8pt; padding: 2px 8px; background: ${priorityColor}; color: white; border-radius: 4px; margin-left: auto;">${priorityLabel}</span>
                  </div>
                  <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 4px;">
                    Score actuel : <strong>${q.score}/100</strong> • Sphère : <strong>${q.sphereName}</strong> • ${q.responseCount} réponses
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="background: ${COLORS.background}; border-radius: 10px; padding: 20px; text-align: center; color: ${COLORS.gray};">
              Données en cours de calcul...
            </div>
          `}
        </div>
      </div>
      
      <!-- Interpretation note -->
      <div style="background: ${COLORS.anthracite}; color: ${COLORS.white}; padding: 14px 18px; border-radius: 10px; margin-top: 15px;">
        <p style="font-size: 8pt; margin: 0; line-height: 1.5;">
          <strong style="color: ${COLORS.gold};">💡 Lecture de la matrice :</strong> 
          Les sphères situées dans le quadrant supérieur droit combinent un faible score (risque élevé) et une forte importance perçue par les collaborateurs. 
          Le Top 3 ci-dessus identifie les questions individuelles les plus critiques à traiter en priorité.
        </p>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

// ====================
// PAGES 5-12: SPHERE DETAIL PAGES (2 pages per sphere)
// ====================

// Sphere definitions for detail pages
const SPHERE_DETAILS: Record<string, {
  key: string;
  name: string;
  icon: string;
  color: string;
  questions: string[];
  recommendations: {
    critical: string[];
    warning: string[];
    good: string[];
  };
}> = {
  SANTE: {
    key: 'SANTE',
    name: 'Santé & Bien-être',
    icon: '❤️',
    color: '#ef4444',
    questions: ['Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13'],
    recommendations: {
      critical: [
        'Mettre en place une cellule d\'écoute psychologique accessible à tous',
        'Lancer un programme de prévention santé (nutrition, sommeil, activité physique)',
        'Former les managers à la détection des signaux faibles de mal-être'
      ],
      warning: [
        'Organiser des ateliers de gestion du stress et de pleine conscience',
        'Proposer un bilan de santé annuel aux collaborateurs',
        'Améliorer l\'accès aux ressources de soutien psychologique'
      ],
      good: [
        'Maintenir les initiatives santé existantes',
        'Communiquer régulièrement sur les ressources disponibles',
        'Évaluer l\'impact des programmes en place'
      ]
    }
  },
  EQUILIBRE: {
    key: 'EQUILIBRE',
    name: 'Équilibre Vie Pro/Perso',
    icon: '⚖️',
    color: '#8b5cf6',
    questions: ['Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20', 'Q21'],
    recommendations: {
      critical: [
        'Instaurer une politique de déconnexion stricte (pas d\'emails après 19h)',
        'Réaliser un audit de charge de travail par équipe et redistribuer',
        'Proposer des horaires flexibles ou du télétravail élargi'
      ],
      warning: [
        'Former les managers à la gestion de la charge de travail',
        'Clarifier les attentes de disponibilité en dehors des heures de travail',
        'Encourager la prise effective des congés et RTT'
      ],
      good: [
        'Pérenniser les dispositifs de flexibilité existants',
        'Partager les bonnes pratiques entre équipes',
        'Monitorer régulièrement les indicateurs d\'équilibre'
      ]
    }
  },
  ENVIRONNEMENT: {
    key: 'ENVIRONNEMENT',
    name: 'Environnement de Travail',
    icon: '🏢',
    color: '#14b8a6',
    questions: ['Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29'],
    recommendations: {
      critical: [
        'Réaliser un audit ergonomique complet des postes de travail',
        'Investir dans l\'amélioration des conditions matérielles (éclairage, bruit, température)',
        'Créer ou rénover des espaces de détente et de convivialité'
      ],
      warning: [
        'Mettre à jour les équipements et outils de travail obsolètes',
        'Former les collaborateurs aux bonnes postures de travail',
        'Améliorer l\'insonorisation des espaces de concentration'
      ],
      good: [
        'Maintenir la qualité des espaces de travail',
        'Solliciter régulièrement les retours des collaborateurs',
        'Anticiper les besoins futurs d\'aménagement'
      ]
    }
  },
  MANAGEMENT: {
    key: 'MANAGEMENT',
    name: 'Management & Organisation',
    icon: '👔',
    color: '#c9a227',
    questions: ['Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36', 'Q37'],
    recommendations: {
      critical: [
        'Mettre en place des formations managériales obligatoires (feedback, reconnaissance)',
        'Clarifier les rôles, responsabilités et objectifs de chaque poste',
        'Instaurer des rituels de reconnaissance réguliers (hebdomadaires)'
      ],
      warning: [
        'Développer une culture du feedback constructif bidirectionnel',
        'Créer des parcours d\'évolution clairs et accessibles',
        'Améliorer la communication descendante et ascendante'
      ],
      good: [
        'Renforcer les pratiques managériales positives',
        'Valoriser et partager les succès des équipes',
        'Continuer à investir dans le développement des compétences'
      ]
    }
  }
};

// Question labels for sphere detail pages
const QUESTION_DETAILS: Record<string, string> = {
  Q5: 'Activité physique régulière',
  Q6: 'Alimentation équilibrée',
  Q7: 'Qualité du sommeil',
  Q8: 'Gestion du stress quotidien',
  Q9: 'Consommation de substances',
  Q10: 'Énergie au quotidien',
  Q11: 'Santé mentale générale',
  Q12: 'Motivation au travail',
  Q13: 'Symptômes physiques récurrents',
  Q14: 'Flexibilité des horaires',
  Q15: 'Télétravail disponible',
  Q16: 'Charge de travail acceptable',
  Q17: 'Respect des temps de repos',
  Q18: 'Droit à la déconnexion',
  Q19: 'Temps pour vie personnelle',
  Q20: 'Équilibre ressenti',
  Q21: 'Pression des deadlines',
  Q22: 'Conditions matérielles',
  Q23: 'Ergonomie du poste',
  Q24: 'Ambiance sonore',
  Q25: 'Qualité de l\'air et température',
  Q26: 'Outils et équipements',
  Q27: 'Espaces de détente',
  Q28: 'Sécurité au travail',
  Q29: 'Relations avec collègues',
  Q30: 'Clarté des objectifs',
  Q31: 'Reconnaissance du manager',
  Q32: 'Autonomie décisionnelle',
  Q33: 'Feedback régulier',
  Q34: 'Opportunités d\'évolution',
  Q35: 'Sens du travail',
  Q36: 'Communication managériale',
  Q37: 'Soutien hiérarchique'
};

function generateSphereDetailPageA(data: StrategicReportData, sphereKey: string, pageNumber: number): string {
  const { analytics, company } = data;
  const sphereInfo = SPHERE_DETAILS[sphereKey];
  if (!sphereInfo) return '';
  
  const sphereScore = analytics.sphereScores[sphereKey] || 0;
  const questionScores = analytics.questionScores || [];
  
  // Get scores for this sphere's questions
  const sphereQuestionScores = sphereInfo.questions.map(qId => {
    const qs = questionScores.find(q => q.questionId === qId);
    return {
      id: qId,
      label: QUESTION_DETAILS[qId] || qId,
      score: qs?.score || 0
    };
  }).sort((a, b) => a.score - b.score); // Sort by score ascending
  
  // Generate horizontal bar chart
  const barHeight = 22;
  const barGap = 8;
  const chartHeight = sphereQuestionScores.length * (barHeight + barGap);
  const chartWidth = 350;
  const labelWidth = 150;
  const barMaxWidth = chartWidth - labelWidth - 50;
  
  const bars = sphereQuestionScores.map((q, i) => {
    const y = i * (barHeight + barGap);
    const barWidth = (q.score / 100) * barMaxWidth;
    const barColor = q.score < 40 ? COLORS.danger : q.score < 60 ? COLORS.warning : COLORS.success;
    
    return `
      <g transform="translate(0, ${y})">
        <text x="${labelWidth - 10}" y="${barHeight / 2 + 4}" text-anchor="end" font-size="8" fill="${COLORS.anthracite}">${q.label}</text>
        <rect x="${labelWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${barColor}" rx="3"/>
        <text x="${labelWidth + barWidth + 8}" y="${barHeight / 2 + 4}" font-size="9" font-weight="600" fill="${barColor}">${q.score}</text>
      </g>
    `;
  }).join('');
  
  const scoreColor = getScoreColor(sphereScore);
  const scoreLevel = sphereScore >= 70 ? 'Satisfaisant' : sphereScore >= 50 ? 'À améliorer' : sphereScore >= 30 ? 'Fragile' : 'Critique';
  
  return `
    <div class="page sphere-detail-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge" style="background: ${sphereInfo.color}20; color: ${sphereInfo.color};">${sphereInfo.icon} ${sphereInfo.name}</span>
        </div>
      </div>
      
      <h2 class="page-title">${sphereInfo.icon} ${sphereInfo.name} — Analyse Détaillée</h2>
      <p class="page-subtitle">Scores par question et positionnement de la sphère</p>
      
      <!-- Score Summary -->
      <div style="display: flex; gap: 20px; margin: 20px 0; align-items: center;">
        <div style="background: linear-gradient(135deg, ${sphereInfo.color}15, ${sphereInfo.color}05); border: 2px solid ${sphereInfo.color}; border-radius: 16px; padding: 20px 30px; text-align: center;">
          <div style="font-size: 36pt; font-weight: 700; color: ${scoreColor};">${sphereScore}</div>
          <div style="font-size: 10pt; color: ${COLORS.gray};">/100</div>
          <div style="font-size: 9pt; font-weight: 600; color: ${scoreColor}; margin-top: 4px;">${scoreLevel}</div>
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; color: ${COLORS.anthracite};">Score de la sphère</h4>
          <p style="margin: 0; font-size: 9pt; color: ${COLORS.gray}; line-height: 1.5;">
            ${sphereScore >= 70 
              ? `Cette sphère présente un niveau globalement satisfaisant. Les pratiques en place semblent efficaces et méritent d'être maintenues et renforcées.`
              : sphereScore >= 50 
                ? `Cette sphère révèle des fragilités nécessitant une attention particulière. Des actions ciblées permettraient d'améliorer significativement la situation.`
                : `Cette sphère présente un niveau critique nécessitant une intervention prioritaire. Un plan d'action structuré est recommandé.`
            }
          </p>
        </div>
      </div>
      
      <!-- Bar Chart -->
      <div class="section">
        <h3 class="section-title">📊 Scores par Question</h3>
        <div style="margin-top: 15px; overflow: hidden;">
          <svg viewBox="0 0 ${chartWidth} ${chartHeight + 20}" width="${chartWidth}" height="${chartHeight + 20}" style="max-width: 100%;">
            ${bars}
          </svg>
        </div>
        <div style="display: flex; gap: 20px; margin-top: 15px; justify-content: center;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; background: ${COLORS.danger}; border-radius: 2px;"></div>
            <span style="font-size: 8pt; color: ${COLORS.gray};">Critique (&lt;40)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; background: ${COLORS.warning}; border-radius: 2px;"></div>
            <span style="font-size: 8pt; color: ${COLORS.gray};">À surveiller (40-60)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; background: ${COLORS.success}; border-radius: 2px;"></div>
            <span style="font-size: 8pt; color: ${COLORS.gray};">Satisfaisant (&gt;60)</span>
          </div>
        </div>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

function generateSphereDetailPageB(data: StrategicReportData, sphereKey: string, pageNumber: number): string {
  const { analytics, company } = data;
  const sphereInfo = SPHERE_DETAILS[sphereKey];
  if (!sphereInfo) return '';
  
  const sphereScore = analytics.sphereScores[sphereKey] || 0;
  const questionScores = analytics.questionScores || [];
  
  // Get top 3 critical questions for this sphere
  const criticalQuestions = questionScores
    .filter(q => sphereInfo.questions.includes(q.questionId))
    .slice(0, 3);
  
  // Select recommendations based on score
  const recommendations = sphereScore < 40 
    ? sphereInfo.recommendations.critical 
    : sphereScore < 60 
      ? sphereInfo.recommendations.warning 
      : sphereInfo.recommendations.good;
  
  const diagnosisLevel = sphereScore < 40 
    ? { label: 'Situation Critique', color: COLORS.danger, icon: '🚨', text: 'Cette sphère nécessite une intervention immédiate. Les scores révèlent des dysfonctionnements importants qui impactent directement le bien-être des collaborateurs et la performance organisationnelle.' }
    : sphereScore < 60 
      ? { label: 'Fragilités Identifiées', color: COLORS.warning, icon: '⚠️', text: 'Cette sphère présente des axes d\'amélioration significatifs. Un plan d\'action structuré permettrait de progresser vers un niveau satisfaisant.' }
      : { label: 'Situation Satisfaisante', color: COLORS.success, icon: '✅', text: 'Cette sphère affiche un niveau globalement positif. Les pratiques en place sont efficaces et doivent être maintenues tout en identifiant des axes d\'excellence.' };
  
  return `
    <div class="page sphere-recommendations-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge" style="background: ${sphereInfo.color}20; color: ${sphereInfo.color};">${sphereInfo.icon} Recommandations</span>
        </div>
      </div>
      
      <h2 class="page-title">${sphereInfo.icon} ${sphereInfo.name} — Recommandations</h2>
      <p class="page-subtitle">Diagnostic et plan d'action pour cette sphère</p>
      
      <!-- Diagnosis -->
      <div style="background: ${diagnosisLevel.color}10; border-left: 4px solid ${diagnosisLevel.color}; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 20pt;">${diagnosisLevel.icon}</span>
          <span style="font-size: 14pt; font-weight: 700; color: ${diagnosisLevel.color};">${diagnosisLevel.label}</span>
          <span style="margin-left: auto; font-size: 16pt; font-weight: 700; color: ${diagnosisLevel.color};">${sphereScore}/100</span>
        </div>
        <p style="margin: 0; font-size: 9pt; color: ${COLORS.anthracite}; line-height: 1.5;">${diagnosisLevel.text}</p>
      </div>
      
      <!-- Top 3 Critical Questions -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">🎯 Top 3 — Questions Critiques de cette Sphère</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
          ${criticalQuestions.map((q, i) => {
            const color = q.score < 40 ? COLORS.danger : q.score < 60 ? COLORS.warning : COLORS.success;
            return `
              <div style="display: flex; align-items: center; gap: 12px; background: ${COLORS.background}; border-radius: 8px; padding: 12px 16px; border-left: 3px solid ${color};">
                <span style="font-size: 14pt; font-weight: 700; color: ${color};">#${i + 1}</span>
                <div style="flex: 1;">
                  <span style="font-weight: 600; font-size: 10pt; color: ${COLORS.anthracite};">${q.label}</span>
                  <span style="font-size: 8pt; color: ${COLORS.gray};"> (${q.questionId})</span>
                </div>
                <span style="font-size: 12pt; font-weight: 700; color: ${color};">${q.score}/100</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Recommendations -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">💡 Recommandations Prioritaires</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
          ${recommendations.map((rec, i) => `
            <div style="display: flex; gap: 12px; background: ${COLORS.background}; border-radius: 8px; padding: 14px 16px;">
              <div style="min-width: 28px; height: 28px; background: ${sphereInfo.color}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: 700;">${i + 1}</div>
              <p style="margin: 0; font-size: 9pt; color: ${COLORS.anthracite}; line-height: 1.5; flex: 1;">${rec}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Action Note -->
      <div style="background: ${COLORS.anthracite}; color: ${COLORS.white}; padding: 14px 18px; border-radius: 10px; margin-top: 20px;">
        <p style="font-size: 8pt; margin: 0; line-height: 1.5;">
          <strong style="color: ${COLORS.gold};">📋 Note :</strong> 
          Ces recommandations sont des orientations générales basées sur les résultats du diagnostic. 
          Un accompagnement expert AlterValue permet de co-construire un plan d'action personnalisé adapté à votre contexte organisationnel.
        </p>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

// ====================
// PAGE 13: FINANCIAL ANALYSIS
// ====================

function generateFinancialAnalysisPage(data: StrategicReportData, pageNumber: number): string {
  const { analytics, company } = data;
  const fm = analytics.financialMetrics;
  
  const annualCost = fm?.estimatedAnnualCost || 0;
  const costPerEmployee = fm?.costPerEmployee || 0;
  const potentialSavings = fm?.potentialSavings || 0;
  const avgDays = fm?.avgPresenteeismDays || 0;
  
  // Estimated absenteeism cost (rough estimate: 2x presenteeism for severe cases)
  const absenteeismCost = Math.round(annualCost * 0.6);
  const totalRPSCost = annualCost + absenteeismCost;
  
  // Chart dimensions
  const chartWidth = 350;
  const chartHeight = 180;
  const barWidth = 60;
  const barGap = 30;
  const startX = 50;
  
  const bars = [
    { label: 'Présentéisme', value: annualCost, color: COLORS.danger },
    { label: 'Absentéisme (est.)', value: absenteeismCost, color: COLORS.warning },
    { label: 'Coût Total RPS', value: totalRPSCost, color: COLORS.anthracite },
    { label: 'Économies (30%)', value: potentialSavings, color: COLORS.success },
  ];
  
  const maxValue = Math.max(...bars.map(b => b.value));
  const scale = (chartHeight - 40) / maxValue;
  
  const barsHTML = bars.map((bar, i) => {
    const x = startX + i * (barWidth + barGap);
    const barH = bar.value * scale;
    const y = chartHeight - 30 - barH;
    
    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${bar.color}" rx="4"/>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="9" font-weight="600" fill="${bar.color}">${formatCurrency(bar.value)}</text>
        <text x="${x + barWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" font-size="7" fill="${COLORS.gray}">${bar.label}</text>
      </g>
    `;
  }).join('');
  
  return `
    <div class="page financial-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge">Impact Financier</span>
        </div>
      </div>
      
      <h2 class="page-title">💰 Impact Financier & ROI Estimé</h2>
      <p class="page-subtitle">Analyse du coût des RPS et potentiel d'économies</p>
      
      <!-- KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0;">
        <div style="background: ${COLORS.danger}10; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid ${COLORS.danger};">
          <div style="font-size: 18pt; font-weight: 700; color: ${COLORS.danger};">${formatCurrency(annualCost)}</div>
          <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 4px;">Coût Présentéisme</div>
          <div style="font-size: 7pt; color: ${COLORS.grayLight};">Annuel</div>
        </div>
        <div style="background: ${COLORS.warning}10; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid ${COLORS.warning};">
          <div style="font-size: 18pt; font-weight: 700; color: ${COLORS.warning};">${formatCurrency(absenteeismCost)}</div>
          <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 4px;">Coût Absentéisme</div>
          <div style="font-size: 7pt; color: ${COLORS.grayLight};">Estimation</div>
        </div>
        <div style="background: ${COLORS.anthracite}10; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid ${COLORS.anthracite};">
          <div style="font-size: 18pt; font-weight: 700; color: ${COLORS.anthracite};">${formatCurrency(totalRPSCost)}</div>
          <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 4px;">Coût Total RPS</div>
          <div style="font-size: 7pt; color: ${COLORS.grayLight};">Annuel</div>
        </div>
        <div style="background: ${COLORS.success}10; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid ${COLORS.success};">
          <div style="font-size: 18pt; font-weight: 700; color: ${COLORS.success};">${formatCurrency(potentialSavings)}</div>
          <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 4px;">Économies Potentielles</div>
          <div style="font-size: 7pt; color: ${COLORS.grayLight};">Objectif 30%</div>
        </div>
      </div>
      
      <!-- Bar Chart -->
      <div class="section">
        <h3 class="section-title">📊 Comparatif des Coûts</h3>
        <div style="text-align: center; margin-top: 15px;">
          <svg viewBox="0 0 ${chartWidth} ${chartHeight}" width="${chartWidth}" height="${chartHeight}" style="max-width: 100%;">
            <!-- Y axis -->
            <line x1="40" y1="10" x2="40" y2="${chartHeight - 30}" stroke="${COLORS.grayLighter}" stroke-width="1"/>
            ${barsHTML}
          </svg>
        </div>
      </div>
      
      <!-- Calculation Details -->
      <div style="background: ${COLORS.background}; border-radius: 10px; padding: 16px 20px; margin-top: 20px;">
        <h4 style="margin: 0 0 12px 0; font-size: 10pt; color: ${COLORS.anthracite};">📋 Détail du Calcul</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 8pt;">
          <div>
            <span style="color: ${COLORS.gray};">Effectif :</span>
            <span style="font-weight: 600; color: ${COLORS.anthracite};"> ${company.employeesCount} collaborateurs</span>
          </div>
          <div>
            <span style="color: ${COLORS.gray};">Salaire brut moyen :</span>
            <span style="font-weight: 600; color: ${COLORS.anthracite};"> ${formatCurrency(company.avgGrossSalary)}/an</span>
          </div>
          <div>
            <span style="color: ${COLORS.gray};">Jours présentéisme/mois :</span>
            <span style="font-weight: 600; color: ${COLORS.anthracite};"> ${avgDays.toFixed(1)} jours</span>
          </div>
          <div>
            <span style="color: ${COLORS.gray};">Perte productivité :</span>
            <span style="font-weight: 600; color: ${COLORS.anthracite};"> 33% (moyenne)</span>
          </div>
          <div>
            <span style="color: ${COLORS.gray};">Coût par collaborateur :</span>
            <span style="font-weight: 600; color: ${COLORS.anthracite};"> ${formatCurrency(costPerEmployee)}/an</span>
          </div>
          <div>
            <span style="color: ${COLORS.gray};">ROI estimé plan QVCT :</span>
            <span style="font-weight: 600; color: ${COLORS.success};"> 3:1 à 5:1</span>
          </div>
        </div>
      </div>
      
      <!-- ROI Note -->
      <div style="background: ${COLORS.gold}15; border-left: 4px solid ${COLORS.gold}; border-radius: 8px; padding: 14px 18px; margin-top: 20px;">
        <p style="font-size: 9pt; margin: 0; line-height: 1.5; color: ${COLORS.anthracite};">
          <strong style="color: ${COLORS.gold};">💡 ROI des démarches QVCT :</strong> 
          Selon les études de l'IRSST et de l'INRS, pour chaque euro investi dans une démarche QVCT structurée, 
          les organisations observent un retour de <strong>3 à 5 euros</strong> (réduction de l'absentéisme, 
          amélioration de la productivité, fidélisation des talents).
        </p>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

// ====================
// PAGE 14: ACTION PLAN
// ====================

function generateActionPlanPage(data: StrategicReportData, pageNumber: number): string {
  const { analytics, company } = data;
  const questionScores = analytics.questionScores || [];
  const sphereScores = analytics.sphereScores;
  
  // Generate prioritized actions from critical questions
  const criticalQuestions = questionScores.filter(q => q.score < 50).slice(0, 7);
  
  const actions = criticalQuestions.map((q, i) => {
    const priority = i < 3 ? 'Élevé' : i < 5 ? 'Moyen' : 'Normal';
    const delay = i < 3 ? '3 mois' : i < 5 ? '6 mois' : '12 mois';
    const impact = q.score < 30 ? 'Élevé' : q.score < 45 ? 'Moyen' : 'Modéré';
    
    return {
      priority: i + 1,
      action: `Améliorer "${q.label}"`,
      sphere: q.sphereName,
      score: q.score,
      impact,
      delay
    };
  });
  
  return `
    <div class="page action-plan-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge">Plan d'Action</span>
        </div>
      </div>
      
      <h2 class="page-title">📋 Plan d'Action Priorisé</h2>
      <p class="page-subtitle">Feuille de route stratégique basée sur les résultats du diagnostic</p>
      
      <!-- Action Table -->
      <div class="section" style="margin-top: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
          <thead>
            <tr style="background: ${COLORS.anthracite}; color: white;">
              <th style="padding: 10px 8px; text-align: left; border-radius: 6px 0 0 0;">Priorité</th>
              <th style="padding: 10px 8px; text-align: left;">Action Recommandée</th>
              <th style="padding: 10px 8px; text-align: center;">Sphère</th>
              <th style="padding: 10px 8px; text-align: center;">Score</th>
              <th style="padding: 10px 8px; text-align: center;">Impact</th>
              <th style="padding: 10px 8px; text-align: center; border-radius: 0 6px 0 0;">Délai</th>
            </tr>
          </thead>
          <tbody>
            ${actions.map((a, i) => {
              const bgColor = i % 2 === 0 ? COLORS.white : COLORS.background;
              const priorityColor = a.priority <= 3 ? COLORS.danger : a.priority <= 5 ? COLORS.warning : COLORS.gray;
              return `
                <tr style="background: ${bgColor};">
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter};">
                    <span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600;">#${a.priority}</span>
                  </td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter}; font-weight: 500;">${a.action}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter}; text-align: center; color: ${COLORS.gray};">${a.sphere.split(' ')[0]}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter}; text-align: center; font-weight: 600; color: ${a.score < 40 ? COLORS.danger : COLORS.warning};">${a.score}/100</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter}; text-align: center;">${a.impact}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid ${COLORS.grayLighter}; text-align: center;">${a.delay}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Sphere Summary -->
      <div class="section" style="margin-top: 25px;">
        <h3 class="section-title">📊 Synthèse par Sphère</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px;">
          ${Object.entries(SPHERE_DETAILS).map(([key, info]) => {
            const score = sphereScores[key] || 0;
            const color = getScoreColor(score);
            return `
              <div style="background: ${color}10; border-radius: 8px; padding: 12px; text-align: center; border-top: 3px solid ${color};">
                <div style="font-size: 14pt;">${info.icon}</div>
                <div style="font-size: 16pt; font-weight: 700; color: ${color};">${score}</div>
                <div style="font-size: 7pt; color: ${COLORS.gray};">${info.name.split(' ')[0]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Note -->
      <div style="background: ${COLORS.anthracite}; color: ${COLORS.white}; padding: 16px 20px; border-radius: 10px; margin-top: 25px;">
        <p style="font-size: 9pt; margin: 0; line-height: 1.6;">
          <strong style="color: ${COLORS.gold};">📌 Note importante :</strong> 
          Ce plan d'action constitue une première orientation stratégique basée sur les résultats du diagnostic BNQ 9700-800. 
          Un accompagnement expert AlterValue permet de co-construire une feuille de route personnalisée, adaptée à votre contexte 
          organisationnel, vos contraintes et vos objectifs stratégiques. Contactez-nous pour transformer ces recommandations en actions concrètes.
        </p>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

// ====================
// PAGE 15: ANNEXES & METHODOLOGY
// ====================

function generateAnnexesPage(data: StrategicReportData, pageNumber: number): string {
  const { company } = data;
  
  return `
    <div class="page annexes-page">
      <div class="page-header">
        <div class="header-left">
          <span class="header-company">${company.name}</span>
        </div>
        <div class="header-right">
          <span class="header-badge">Annexes</span>
        </div>
      </div>
      
      <h2 class="page-title">📚 Annexes — Méthodologie BNQ 9700-800</h2>
      <p class="page-subtitle">Cadre de référence et méthodologie de calcul</p>
      
      <!-- BNQ Standard -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">🏛️ La Norme BNQ 9700-800</h3>
        <div style="background: ${COLORS.background}; border-radius: 10px; padding: 16px 20px; margin-top: 12px;">
          <p style="font-size: 9pt; margin: 0 0 10px 0; line-height: 1.6; color: ${COLORS.anthracite};">
            La norme <strong>BNQ 9700-800:2020</strong> est une norme québécoise de référence internationale en matière de 
            <strong>santé et mieux-être au travail</strong>. Elle propose un cadre structuré pour évaluer et améliorer 
            la Qualité de Vie et des Conditions de Travail (QVCT).
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px;">
            <div style="background: white; border-radius: 6px; padding: 10px; border-left: 3px solid ${COLORS.teal};">
              <strong style="font-size: 9pt; color: ${COLORS.teal};">4 Sphères d'évaluation</strong>
              <p style="font-size: 8pt; color: ${COLORS.gray}; margin: 4px 0 0 0;">Santé, Équilibre, Environnement, Management</p>
            </div>
            <div style="background: white; border-radius: 6px; padding: 10px; border-left: 3px solid ${COLORS.gold};">
              <strong style="font-size: 9pt; color: ${COLORS.gold};">Approche systémique</strong>
              <p style="font-size: 8pt; color: ${COLORS.gray}; margin: 4px 0 0 0;">Vision globale de l'organisation</p>
            </div>
            <div style="background: white; border-radius: 6px; padding: 10px; border-left: 3px solid ${COLORS.success};">
              <strong style="font-size: 9pt; color: ${COLORS.success};">Amélioration continue</strong>
              <p style="font-size: 8pt; color: ${COLORS.gray}; margin: 4px 0 0 0;">Mesure régulière des progrès</p>
            </div>
            <div style="background: white; border-radius: 6px; padding: 10px; border-left: 3px solid ${COLORS.danger};">
              <strong style="font-size: 9pt; color: ${COLORS.danger};">Prévention des RPS</strong>
              <p style="font-size: 8pt; color: ${COLORS.gray}; margin: 4px 0 0 0;">Identification proactive des risques</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Methodology -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">📐 Méthodologie de Calcul</h3>
        <div style="background: ${COLORS.background}; border-radius: 10px; padding: 16px 20px; margin-top: 12px; font-size: 8pt;">
          <div style="margin-bottom: 12px;">
            <strong style="color: ${COLORS.anthracite};">1. Normalisation des réponses</strong>
            <p style="color: ${COLORS.gray}; margin: 4px 0 0 0;">Conversion des échelles Likert (1-10) en scores 0-100 pour comparabilité.</p>
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: ${COLORS.anthracite};">2. Agrégation par sphère</strong>
            <p style="color: ${COLORS.gray}; margin: 4px 0 0 0;">Moyenne pondérée des questions appartenant à chaque sphère BNQ.</p>
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: ${COLORS.anthracite};">3. Score global QVCT</strong>
            <p style="color: ${COLORS.gray}; margin: 4px 0 0 0;">Moyenne arithmétique des 4 sphères pour un indicateur synthétique.</p>
          </div>
          <div>
            <strong style="color: ${COLORS.anthracite};">4. Seuils d'anonymat</strong>
            <p style="color: ${COLORS.gray}; margin: 4px 0 0 0;">Minimum 5 répondants par segment pour garantir l'anonymat (N ≥ 5).</p>
          </div>
        </div>
      </div>
      
      <!-- Sources -->
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">📖 Sources & Références</h3>
        <div style="font-size: 8pt; color: ${COLORS.gray}; margin-top: 12px; line-height: 1.8;">
          <p style="margin: 0;">• <strong>BNQ 9700-800:2020</strong> — Norme québécoise en santé et mieux-être au travail</p>
          <p style="margin: 0;">• <strong>DARES</strong> — Direction de l'Animation de la Recherche, des Études et des Statistiques</p>
          <p style="margin: 0;">• <strong>INRS</strong> — Institut National de Recherche et de Sécurité</p>
          <p style="margin: 0;">• <strong>IRSST</strong> — Institut de Recherche Robert-Sauvé en Santé et Sécurité du Travail</p>
          <p style="margin: 0;">• <strong>Qualisocial/Ipsos</strong> — Baromètres annuels QVCT</p>
          <p style="margin: 0;">• <strong>Benchmarks AlterValue</strong> — Agrégation de diagnostics sectoriels</p>
        </div>
      </div>
      
      <!-- Contact -->
      <div style="background: linear-gradient(135deg, ${COLORS.anthracite}, #374151); color: white; border-radius: 10px; padding: 20px; margin-top: 25px; text-align: center;">
        <div style="font-size: 14pt; font-weight: 700; color: ${COLORS.gold}; margin-bottom: 8px;">AlterValue</div>
        <p style="font-size: 9pt; margin: 0 0 12px 0; opacity: 0.9;">Expertise QVCT • Certification BNQ 9700-800 • Accompagnement sur-mesure</p>
        <div style="font-size: 8pt; opacity: 0.8;">
          <span>📧 contact@altervalue.fr</span>
          <span style="margin: 0 15px;">|</span>
          <span>🌐 www.altervalue.fr</span>
        </div>
      </div>
      
      <div class="page-footer">
        <span class="confidential-footer">CONFIDENTIEL</span>
        <span>Rapport généré par AlterValue • ${formatDate(data.generatedAt)}</span>
        <span class="page-number">Page ${pageNumber}</span>
      </div>
    </div>
  `;
}

// ====================
// MAIN GENERATOR
// ====================

export function generateStrategicReportHTML(data: StrategicReportData): string {
  // Generate all pages with correct page numbers
  let pageNum = 1;
  const pages: string[] = [];
  
  // Page 1: Cover (no page number displayed)
  pages.push(generateCoverPage(data));
  pageNum++;
  
  // Page 2: Executive Summary
  pages.push(generateExecutiveSummaryPage(data, pageNum));
  pageNum++;
  
  // Page 3: Radar BNQ
  pages.push(generateRadarPage(data, pageNum));
  pageNum++;
  
  // Page 4: Priority Matrix
  pages.push(generatePriorityMatrixPage(data, pageNum));
  pageNum++;
  
  // Pages 5-12: Sphere Details (2 pages per sphere)
  const sphereOrder = ['SANTE', 'EQUILIBRE', 'ENVIRONNEMENT', 'MANAGEMENT'];
  for (const sphere of sphereOrder) {
    pages.push(generateSphereDetailPageA(data, sphere, pageNum));
    pageNum++;
    pages.push(generateSphereDetailPageB(data, sphere, pageNum));
    pageNum++;
  }
  
  // Page 13: Financial Analysis
  pages.push(generateFinancialAnalysisPage(data, pageNum));
  pageNum++;
  
  // Page 14: Action Plan
  pages.push(generateActionPlanPage(data, pageNum));
  pageNum++;
  
  // Page 15: Annexes
  pages.push(generateAnnexesPage(data, pageNum));
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Stratégique BNQ Ultimate - ${data.campaign.name}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  ${pages.join('')}
</body>
</html>
  `;
}
