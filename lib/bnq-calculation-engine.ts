/**
 * BNQ Ultimate Calculation Engine v4.2
 * 
 * Moteur de calcul pour le questionnaire QVCT BNQ Ultimate
 * Conforme aux spécifications BNQ 9700-800
 * 
 * Règles de calcul:
 * - Normalisation 0-100 pour toutes les échelles Likert
 * - Inversion automatique des scores pour questions à valence négative
 * - Calcul Présentéisme: fréquence (Q60) × perte efficacité (Q62) = jours perdus
 * - Seuil confidentialité: bloquer si N < 5
 * - Exclusion N/A des moyennes
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface SphereScoreResult {
  sphereId: number;
  sphereName: string;
  score: number;          // 0-100
  itemScores: number[];   // Scores individuels normalisés
  respondentCount: number;
  isConfidential: boolean; // true si N < seuil
  priorityRate: number;   // % ayant cité comme priorité
  criticalityIndex: number;
  color: 'red' | 'orange' | 'green' | 'gold';
}

export interface RPSDimensionScore {
  dimensionId: string;
  dimensionName: string;
  score: number;          // 0-100
  respondentCount: number;
  isConfidential: boolean;
  color: 'red' | 'orange' | 'green' | 'gold';
}

export interface PresenteeismResult {
  prevalenceRate: number;           // % salariés affectés
  avgEfficiency: number;            // 0-100
  productivityLossCoeff: number;    // 0-1
  presenteeismDays: number;         // jours/an
  annualCost: number;               // €/an
  costPerEmployee: number;          // €/salarié/an
  costAsPayrollPct: number;         // % masse salariale
  roiEstimate: number;              // ROI potentiel (50% réduction)
  respondentCount: number;
  isConfidential: boolean;
}

export interface TMSResult {
  prevalence: number;     // % avec au moins 1 zone
  topZones: Array<{ zone: string; rate: number }>;
  impactScore: number;    // 0-100
  respondentCount: number;
  isConfidential: boolean;
}

export interface DistressResult {
  rate: number;           // % en détresse
  avgStressLevel: number; // 0-10
  color: 'green' | 'yellow' | 'orange' | 'red';
  respondentCount: number;
  isConfidential: boolean;
}

export interface CriticalityMatrix {
  sphereId: number;
  sphereName: string;
  score: number;
  priorityRate: number;
  criticalityIndex: number;
  rank: number;
}

export interface BNQCalculationResult {
  responseCount: number;
  participationRate: number | null;
  completionRate: number;
  avgDuration: number; // secondes
  
  // Module 1: Scores par sphère
  sphereScores: SphereScoreResult[];
  priorityMatrix: CriticalityMatrix[];
  topLevers: Record<string, Array<{ lever: string; rate: number }>>;
  
  // Module 2: RPS (optionnel)
  rpsScores?: RPSDimensionScore[];
  rpsCriticalDimension?: string;
  
  // Module 3: Santé (optionnel)
  presenteeism?: PresenteeismResult;
  tms?: TMSResult;
  distress?: DistressResult;
  
  // Indicateurs critiques
  criticalIndicators: Record<string, { triggered: boolean; severity: string; message: string }>;
  
  // Métriques financières
  financialMetrics?: {
    hiddenCost: number;
    costPct: number;
    roiEstimate: number;
  };
}

export interface CompanyContext {
  employeesCount: number;
  avgGrossSalary: number;
  employerContributionRate: number;
  workingDaysPerYear?: number;
}

export interface ResponseData {
  questionId: string;
  value: number | string | string[] | null;
  skipped?: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

// Questions à valence négative (score inversé)
const NEGATIVE_VALENCE_QUESTIONS = [
  'Q9',   // Stress (Module 1)
  'Q60',  // Fréquence présentéisme (Module 3)
  'Q63',  // Causes présentéisme (Module 3)
  'Q66',  // Niveau de stress (Module 3)
  'Q67',  // Signes détresse (Module 3)
];

// Mapping questions -> sphères
const SPHERE_QUESTIONS: Record<number, string[]> = {
  1: ['Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11'],  // Habitudes de vie
  2: ['Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18'], // Conciliation
  3: ['Q20', 'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27'], // Environnement
  4: ['Q29', 'Q30', 'Q31', 'Q32', 'Q33', 'Q34'], // Pratiques gestion
};

const SPHERE_PRIORITY_QUESTIONS: Record<number, string> = {
  1: 'Q12',
  2: 'Q19',
  3: 'Q28',
  4: 'Q35',
};

const SPHERE_NAMES: Record<number, string> = {
  1: 'Habitudes de vie',
  2: 'Conciliation vie pro/perso',
  3: 'Environnement de travail',
  4: 'Pratiques de gestion',
};

// RPS 8 dimensions (Module 2)
const RPS_DIMENSIONS: Record<string, { name: string; questions: string[] }> = {
  charge_travail: { name: 'Charge de travail', questions: ['Q40', 'Q41'] },
  clarte_role: { name: 'Clarté du rôle', questions: ['Q42', 'Q43'] },
  reconnaissance: { name: 'Reconnaissance', questions: ['Q44', 'Q45'] },
  autonomie: { name: 'Autonomie', questions: ['Q46', 'Q47'] },
  soutien_social: { name: 'Soutien social', questions: ['Q48', 'Q49'] },
  equilibre: { name: 'Équilibre vie pro/perso', questions: ['Q50', 'Q51'] },
  climat_respect: { name: 'Climat de respect', questions: ['Q52', 'Q53'] },
  competences: { name: 'Développement compétences', questions: ['Q54', 'Q55'] },
};

// Seuils de couleur pour scores (0-100)
const SCORE_THRESHOLDS = {
  red: 40,      // 0-40: Zone rouge
  orange: 65,   // 40-65: Zone orange
  green: 80,    // 65-80: Zone verte
  // >80: Excellence (gold)
};

// Seuils de détresse
const DISTRESS_THRESHOLDS = {
  green: 15,    // <15%: Normal
  yellow: 25,   // 15-25%: Surveillance
  orange: 40,   // 25-40%: Alerte
  // >40%: Crise (red)
};

// Conversion Q60 (fréquence présentéisme) -> jours/mois
const PRESENTEEISM_FREQUENCY_MAP: Record<string, number> = {
  'NEVER': 0,
  '1-2': 1.5,
  '3-4': 3.5,
  '5-6': 5.5,
  '>6': 8,
};

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

/**
 * Vérifie si le seuil de confidentialité est respecté
 * @param count Nombre de répondants
 * @param threshold Seuil minimum (défaut: 5)
 */
export function isConfidential(count: number, threshold: number = 5): boolean {
  return count < threshold;
}

/**
 * Normalise une valeur Likert vers 0-100
 * @param value Valeur brute
 * @param scaleMax Maximum de l'échelle (10 pour Module 1, 5 pour Module 2)
 */
export function normalizeLikert(value: number, scaleMax: number = 10): number {
  return (value / scaleMax) * 100;
}

/**
 * Inverse un score pour les questions à valence négative
 * @param score Score normalisé (0-100)
 */
export function invertScore(score: number): number {
  return 100 - score;
}

/**
 * Détermine la couleur du score selon les seuils
 * @param score Score normalisé (0-100)
 */
export function getScoreColor(score: number): 'red' | 'orange' | 'green' | 'gold' {
  if (score < SCORE_THRESHOLDS.red) return 'red';
  if (score < SCORE_THRESHOLDS.orange) return 'orange';
  if (score < SCORE_THRESHOLDS.green) return 'green';
  return 'gold';
}

/**
 * Détermine la couleur de la détresse selon les seuils
 * @param rate Taux de détresse (%)
 */
export function getDistressColor(rate: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (rate < DISTRESS_THRESHOLDS.green) return 'green';
  if (rate < DISTRESS_THRESHOLDS.yellow) return 'yellow';
  if (rate < DISTRESS_THRESHOLDS.orange) return 'orange';
  return 'red';
}

/**
 * Filtre les valeurs N/A et null des réponses
 * @param values Tableau de valeurs
 */
export function filterNAValues(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
}

/**
 * Calcule la moyenne d'un tableau en excluant les N/A
 * @param values Tableau de valeurs
 */
export function calculateMean(values: (number | null | undefined)[]): number {
  const filtered = filterNAValues(values);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
}

// =====================================================
// FONCTIONS DE CALCUL PRINCIPALES
// =====================================================

/**
 * Calcule le score d'une sphère BNQ (Module 1)
 * 
 * Formule: Score_Sphère = (Moyenne_Items / 10) × 100
 * 
 * @param responses Tableau des réponses pour cette sphère
 * @param sphereId Identifiant de la sphère (1-4)
 * @param priorityResponses Réponses de la question de priorisation
 * @param confidentialityThreshold Seuil de confidentialité (défaut: 5)
 */
export function calculateSphereScore(
  responses: ResponseData[][],  // Array of responses per respondent
  sphereId: number,
  priorityResponses: (string | null)[],
  confidentialityThreshold: number = 5
): SphereScoreResult {
  const questionIds = SPHERE_QUESTIONS[sphereId];
  const sphereName = SPHERE_NAMES[sphereId];
  
  // Extraire les valeurs par question, en filtrant N/A
  const itemScores: number[] = [];
  const validRespondentsPerQuestion: number[] = [];
  
  for (const questionId of questionIds) {
    const values: (number | null)[] = [];
    
    for (const respondentResponses of responses) {
      const response = respondentResponses.find(r => r.questionId === questionId);
      if (response && !response.skipped && response.value !== null && typeof response.value === 'number') {
        values.push(response.value);
      }
    }
    
    validRespondentsPerQuestion.push(values.length);
    
    if (values.length > 0) {
      let mean = calculateMean(values);
      
      // Inversion pour questions à valence négative
      if (NEGATIVE_VALENCE_QUESTIONS.includes(questionId)) {
        mean = 10 - mean; // Inverser sur l'échelle 0-10
      }
      
      // Normaliser vers 0-100
      itemScores.push(normalizeLikert(mean, 10));
    }
  }
  
  // Nombre de répondants = minimum parmi les questions (pour être conservateur)
  const respondentCount = validRespondentsPerQuestion.length > 0 
    ? Math.min(...validRespondentsPerQuestion) 
    : 0;
  
  // Vérifier confidentialité
  const isConf = isConfidential(respondentCount, confidentialityThreshold);
  
  // Score moyen de la sphère
  const score = isConf ? 0 : calculateMean(itemScores);
  
  // Calculer le taux de priorité
  const validPriorities = priorityResponses.filter(p => p !== null);
  const priorityCount = validPriorities.filter(p => {
    // La réponse de priorité peut être l'ID de la sphère ou le nom
    return p === String(sphereId) || p === sphereName;
  }).length;
  const priorityRate = validPriorities.length > 0 
    ? (priorityCount / validPriorities.length) * 100 
    : 0;
  
  // Indice de criticité = (100 - Score) × (% priorité) / 100
  const criticalityIndex = isConf ? 0 : ((100 - score) * priorityRate) / 100;
  
  return {
    sphereId,
    sphereName,
    score: isConf ? 0 : Math.round(score * 10) / 10,
    itemScores: isConf ? [] : itemScores.map(s => Math.round(s * 10) / 10),
    respondentCount,
    isConfidential: isConf,
    priorityRate: Math.round(priorityRate * 10) / 10,
    criticalityIndex: Math.round(criticalityIndex * 10) / 10,
    color: isConf ? 'red' : getScoreColor(score),
  };
}

/**
 * Calcule le score d'une dimension RPS (Module 2)
 * 
 * Formule: Score_Dimension = ((Moyenne_2_Items - 1) / 4) × 100
 * (Items notés sur échelle 1-5)
 * 
 * @param responses Tableau des réponses
 * @param dimensionId Identifiant de la dimension
 * @param confidentialityThreshold Seuil de confidentialité (défaut: 5)
 */
export function calculateRPSDimensionScore(
  responses: ResponseData[][],
  dimensionId: string,
  confidentialityThreshold: number = 5
): RPSDimensionScore {
  const dimension = RPS_DIMENSIONS[dimensionId];
  if (!dimension) {
    throw new Error(`Unknown RPS dimension: ${dimensionId}`);
  }
  
  const values: number[] = [];
  
  for (const respondentResponses of responses) {
    const questionValues: number[] = [];
    
    for (const questionId of dimension.questions) {
      const response = respondentResponses.find(r => r.questionId === questionId);
      if (response && !response.skipped && typeof response.value === 'number') {
        questionValues.push(response.value);
      }
    }
    
    // Moyenne des 2 questions pour ce répondant
    if (questionValues.length === 2) {
      values.push(calculateMean(questionValues));
    }
  }
  
  const respondentCount = values.length;
  const isConf = isConfidential(respondentCount, confidentialityThreshold);
  
  // Formule: ((moyenne - 1) / 4) × 100
  const mean = calculateMean(values);
  const score = isConf ? 0 : ((mean - 1) / 4) * 100;
  
  return {
    dimensionId,
    dimensionName: dimension.name,
    score: isConf ? 0 : Math.round(score * 10) / 10,
    respondentCount,
    isConfidential: isConf,
    color: isConf ? 'red' : getScoreColor(score),
  };
}

/**
 * Calcule le coût du présentéisme (Module 3)
 * 
 * Formules:
 * - Taux_Présentéisme = (Σ jours) / (Effectif × Jours_Travaillés)
 * - Coefficient_Perte = 1 - (Efficacité_Moyenne / 10)
 * - Coût = Effectif × Salaire_Chargé × Taux × Coefficient
 * 
 * @param responses Réponses du Module 3
 * @param company Contexte entreprise (effectif, salaire, etc.)
 * @param confidentialityThreshold Seuil (défaut: 30 pour Module 3)
 */
export function calculatePresenteeismCost(
  responses: ResponseData[][],
  company: CompanyContext,
  confidentialityThreshold: number = 30
): PresenteeismResult {
  const {
    employeesCount,
    avgGrossSalary,
    employerContributionRate,
    workingDaysPerYear = 220
  } = company;
  
  // Q60: Fréquence du présentéisme
  // Q62: Efficacité perçue (0-10)
  
  const frequencyValues: number[] = [];
  const efficiencyValues: number[] = [];
  
  for (const respondentResponses of responses) {
    // Q60: Fréquence
    const q60 = respondentResponses.find(r => r.questionId === 'Q60');
    if (q60 && !q60.skipped && q60.value !== null) {
      const frequency = typeof q60.value === 'string' 
        ? PRESENTEEISM_FREQUENCY_MAP[q60.value] ?? 0
        : q60.value as number;
      frequencyValues.push(frequency);
    }
    
    // Q62: Efficacité
    const q62 = respondentResponses.find(r => r.questionId === 'Q62');
    if (q62 && !q62.skipped && typeof q62.value === 'number') {
      efficiencyValues.push(q62.value);
    }
  }
  
  // Nombre de répondants valides = minimum entre Q60 et Q62
  const respondentCount = Math.min(frequencyValues.length, efficiencyValues.length);
  const isConf = isConfidential(respondentCount, confidentialityThreshold);
  
  if (isConf) {
    return {
      prevalenceRate: 0,
      avgEfficiency: 0,
      productivityLossCoeff: 0,
      presenteeismDays: 0,
      annualCost: 0,
      costPerEmployee: 0,
      costAsPayrollPct: 0,
      roiEstimate: 0,
      respondentCount,
      isConfidential: true,
    };
  }
  
  // Taux de prévalence = % ayant répondu autre que "NEVER" ou > 0
  const affectedCount = frequencyValues.filter(f => f > 0).length;
  const prevalenceRate = (affectedCount / frequencyValues.length) * 100;
  
  // Efficacité moyenne (0-10) -> convertir en 0-100
  const avgEfficiency = calculateMean(efficiencyValues);
  const avgEfficiencyPct = avgEfficiency * 10; // 0-100
  
  // Coefficient de perte de productivité = 1 - (Efficacité / 10)
  const productivityLossCoeff = 1 - (avgEfficiency / 10);
  
  // Jours de présentéisme moyens par salarié par mois
  const avgDaysPerMonth = calculateMean(frequencyValues);
  
  // Jours perdus annuels (approche: jours × 12 mois × coefficient perte)
  const presenteeismDays = avgDaysPerMonth * 12 * productivityLossCoeff;
  
  // Salaire chargé
  const chargedSalary = avgGrossSalary * (1 + employerContributionRate / 100);
  
  // Coût journalier
  const dailyCost = chargedSalary / workingDaysPerYear;
  
  // Coût annuel = Effectif × Taux_Présentéisme × Salaire_Chargé × Coeff_Perte
  const annualCost = employeesCount * (prevalenceRate / 100) * chargedSalary * productivityLossCoeff;
  
  // Coût par salarié
  const costPerEmployee = annualCost / employeesCount;
  
  // Coût en % de la masse salariale
  const totalPayroll = employeesCount * chargedSalary;
  const costAsPayrollPct = (annualCost / totalPayroll) * 100;
  
  // ROI potentiel (50% de réduction estimée)
  const roiEstimate = annualCost * 0.5;
  
  return {
    prevalenceRate: Math.round(prevalenceRate * 10) / 10,
    avgEfficiency: Math.round(avgEfficiencyPct * 10) / 10,
    productivityLossCoeff: Math.round(productivityLossCoeff * 100) / 100,
    presenteeismDays: Math.round(presenteeismDays * 10) / 10,
    annualCost: Math.round(annualCost),
    costPerEmployee: Math.round(costPerEmployee),
    costAsPayrollPct: Math.round(costAsPayrollPct * 10) / 10,
    roiEstimate: Math.round(roiEstimate),
    respondentCount,
    isConfidential: false,
  };
}

/**
 * Calcule la prévalence TMS (Module 3)
 * 
 * @param responses Réponses Q64 (zones de douleur) et Q65 (impact)
 * @param confidentialityThreshold Seuil (défaut: 30)
 */
export function calculateTMSPrevalence(
  responses: ResponseData[][],
  confidentialityThreshold: number = 30
): TMSResult {
  const zoneCount: Record<string, number> = {};
  const impactValues: number[] = [];
  let affectedCount = 0;
  
  for (const respondentResponses of responses) {
    // Q64: Zones de douleur (choix multiple)
    const q64 = respondentResponses.find(r => r.questionId === 'Q64');
    if (q64 && !q64.skipped && Array.isArray(q64.value)) {
      const zones = q64.value as string[];
      if (zones.length > 0) {
        affectedCount++;
        for (const zone of zones) {
          zoneCount[zone] = (zoneCount[zone] || 0) + 1;
        }
      }
    }
    
    // Q65: Impact des douleurs (1-5)
    const q65 = respondentResponses.find(r => r.questionId === 'Q65');
    if (q65 && !q65.skipped && typeof q65.value === 'number') {
      impactValues.push(q65.value);
    }
  }
  
  const respondentCount = responses.length;
  const isConf = isConfidential(respondentCount, confidentialityThreshold);
  
  if (isConf) {
    return {
      prevalence: 0,
      topZones: [],
      impactScore: 0,
      respondentCount,
      isConfidential: true,
    };
  }
  
  // Prévalence = % avec au moins 1 zone
  const prevalence = (affectedCount / respondentCount) * 100;
  
  // Top zones triées par fréquence
  const topZones = Object.entries(zoneCount)
    .map(([zone, count]) => ({
      zone,
      rate: Math.round((count / respondentCount) * 1000) / 10,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);
  
  // Score d'impact normalisé (1-5 -> 0-100)
  const avgImpact = calculateMean(impactValues);
  const impactScore = ((avgImpact - 1) / 4) * 100;
  
  return {
    prevalence: Math.round(prevalence * 10) / 10,
    topZones,
    impactScore: Math.round(impactScore * 10) / 10,
    respondentCount,
    isConfidential: false,
  };
}

/**
 * Calcule le taux de détresse psychologique (Module 3)
 * 
 * Seuils:
 * - Q66 (stress) >= 7/10 OU
 * - Q67 (détresse) >= 4/5 (Souvent/Très souvent)
 * 
 * @param responses Réponses Q66 et Q67
 * @param confidentialityThreshold Seuil (défaut: 30)
 */
export function calculateDistressRate(
  responses: ResponseData[][],
  confidentialityThreshold: number = 30
): DistressResult {
  let distressCount = 0;
  const stressValues: number[] = [];
  
  for (const respondentResponses of responses) {
    let isDistressed = false;
    
    // Q66: Niveau de stress (0-10)
    const q66 = respondentResponses.find(r => r.questionId === 'Q66');
    if (q66 && !q66.skipped && typeof q66.value === 'number') {
      stressValues.push(q66.value);
      if (q66.value >= 7) {
        isDistressed = true;
      }
    }
    
    // Q67: Signes de détresse (1-5)
    const q67 = respondentResponses.find(r => r.questionId === 'Q67');
    if (q67 && !q67.skipped && typeof q67.value === 'number') {
      if (q67.value >= 4) {
        isDistressed = true;
      }
    }
    
    if (isDistressed) {
      distressCount++;
    }
  }
  
  const respondentCount = responses.length;
  const isConf = isConfidential(respondentCount, confidentialityThreshold);
  
  if (isConf) {
    return {
      rate: 0,
      avgStressLevel: 0,
      color: 'green',
      respondentCount,
      isConfidential: true,
    };
  }
  
  const rate = (distressCount / respondentCount) * 100;
  const avgStressLevel = calculateMean(stressValues);
  
  return {
    rate: Math.round(rate * 10) / 10,
    avgStressLevel: Math.round(avgStressLevel * 10) / 10,
    color: getDistressColor(rate),
    respondentCount,
    isConfidential: false,
  };
}

/**
 * Génère la matrice de priorisation
 * 
 * @param sphereScores Scores des 4 sphères
 */
export function generatePriorityMatrix(sphereScores: SphereScoreResult[]): CriticalityMatrix[] {
  const matrix = sphereScores.map(s => ({
    sphereId: s.sphereId,
    sphereName: s.sphereName,
    score: s.score,
    priorityRate: s.priorityRate,
    criticalityIndex: s.criticalityIndex,
    rank: 0,
  }));
  
  // Trier par indice de criticité décroissant
  matrix.sort((a, b) => b.criticalityIndex - a.criticalityIndex);
  
  // Attribuer les rangs
  matrix.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return matrix;
}

/**
 * Agrège les leviers d'action par sphère
 * 
 * @param responses Réponses aux questions de priorisation (Q12, Q19, Q28, Q35)
 */
export function aggregateLevers(
  responses: ResponseData[][]
): Record<string, Array<{ lever: string; rate: number }>> {
  const result: Record<string, Array<{ lever: string; rate: number }>> = {};
  
  for (const [sphereId, questionId] of Object.entries(SPHERE_PRIORITY_QUESTIONS)) {
    const leverCount: Record<string, number> = {};
    let totalResponses = 0;
    
    for (const respondentResponses of responses) {
      const response = respondentResponses.find(r => r.questionId === questionId);
      if (response && !response.skipped && response.value !== null) {
        const lever = String(response.value);
        leverCount[lever] = (leverCount[lever] || 0) + 1;
        totalResponses++;
      }
    }
    
    const levers = Object.entries(leverCount)
      .map(([lever, count]) => ({
        lever,
        rate: Math.round((count / totalResponses) * 1000) / 10,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
    
    result[`sphere${sphereId}`] = levers;
  }
  
  return result;
}

/**
 * Détecte les indicateurs critiques
 */
export function detectCriticalIndicators(
  sphereScores: SphereScoreResult[],
  presenteeism?: PresenteeismResult,
  distress?: DistressResult
): Record<string, { triggered: boolean; severity: string; message: string }> {
  const indicators: Record<string, { triggered: boolean; severity: string; message: string }> = {};
  
  // Sphère avec score < 40
  for (const sphere of sphereScores) {
    if (!sphere.isConfidential && sphere.score < 40) {
      indicators[`low_${sphere.sphereId}`] = {
        triggered: true,
        severity: 'critical',
        message: `La sphère "${sphere.sphereName}" est en zone critique (${sphere.score}%)`,
      };
    }
  }
  
  // Présentéisme élevé
  if (presenteeism && !presenteeism.isConfidential) {
    if (presenteeism.prevalenceRate > 50) {
      indicators['high_presenteeism'] = {
        triggered: true,
        severity: 'high',
        message: `Plus de 50% des salariés sont affectés par le présentéisme (${presenteeism.prevalenceRate}%)`,
      };
    }
    
    if (presenteeism.productivityLossCoeff > 0.25) {
      indicators['severe_productivity_loss'] = {
        triggered: true,
        severity: 'critical',
        message: `Perte de productivité supérieure à 25% (${Math.round(presenteeism.productivityLossCoeff * 100)}%)`,
      };
    }
  }
  
  // Détresse élevée
  if (distress && !distress.isConfidential && distress.rate > 25) {
    indicators['high_distress'] = {
      triggered: true,
      severity: distress.rate > 40 ? 'critical' : 'high',
      message: `Taux de détresse psychologique élevé (${distress.rate}%)`,
    };
  }
  
  return indicators;
}

// =====================================================
// FONCTION PRINCIPALE DE CALCUL
// =====================================================

/**
 * Calcule tous les résultats d'une campagne BNQ Ultimate
 * 
 * @param responses Toutes les réponses de la campagne
 * @param company Contexte entreprise
 * @param config Configuration de la campagne
 */
export function calculateBNQResults(
  responses: ResponseData[][],
  company: CompanyContext,
  config: {
    targetPopulation?: number;
    activeModules: number[];  // [0, 1, 2, 3]
    module1Threshold?: number;
    module3Threshold?: number;
  }
): BNQCalculationResult {
  const {
    targetPopulation,
    activeModules,
    module1Threshold = 5,
    module3Threshold = 30,
  } = config;
  
  const responseCount = responses.length;
  const participationRate = targetPopulation 
    ? Math.round((responseCount / targetPopulation) * 1000) / 10 
    : null;
  
  // Module 1: Scores par sphère
  const sphereScores: SphereScoreResult[] = [];
  
  for (let sphereId = 1; sphereId <= 4; sphereId++) {
    const priorityQuestionId = `Q38`; // Question finale de priorité absolue
    const priorityResponses = responses.map(r => {
      const pr = r.find(resp => resp.questionId === priorityQuestionId);
      return pr?.value as string | null ?? null;
    });
    
    const sphereScore = calculateSphereScore(
      responses,
      sphereId,
      priorityResponses,
      module1Threshold
    );
    sphereScores.push(sphereScore);
  }
  
  const priorityMatrix = generatePriorityMatrix(sphereScores);
  const topLevers = aggregateLevers(responses);
  
  // Module 2: RPS (si activé)
  let rpsScores: RPSDimensionScore[] | undefined;
  let rpsCriticalDimension: string | undefined;
  
  if (activeModules.includes(2)) {
    rpsScores = [];
    for (const dimensionId of Object.keys(RPS_DIMENSIONS)) {
      const dimScore = calculateRPSDimensionScore(responses, dimensionId, module1Threshold);
      rpsScores.push(dimScore);
    }
    
    // Trouver la dimension la plus critique
    const validScores = rpsScores.filter(s => !s.isConfidential);
    if (validScores.length > 0) {
      const critical = validScores.reduce((min, s) => s.score < min.score ? s : min);
      rpsCriticalDimension = critical.dimensionName;
    }
  }
  
  // Module 3: Santé & Présentéisme (si activé)
  let presenteeism: PresenteeismResult | undefined;
  let tms: TMSResult | undefined;
  let distress: DistressResult | undefined;
  
  if (activeModules.includes(3)) {
    presenteeism = calculatePresenteeismCost(responses, company, module3Threshold);
    tms = calculateTMSPrevalence(responses, module3Threshold);
    distress = calculateDistressRate(responses, module3Threshold);
  }
  
  // Indicateurs critiques
  const criticalIndicators = detectCriticalIndicators(sphereScores, presenteeism, distress);
  
  // Métriques financières
  let financialMetrics: { hiddenCost: number; costPct: number; roiEstimate: number } | undefined;
  if (presenteeism && !presenteeism.isConfidential) {
    financialMetrics = {
      hiddenCost: presenteeism.annualCost,
      costPct: presenteeism.costAsPayrollPct,
      roiEstimate: presenteeism.roiEstimate,
    };
  }
  
  return {
    responseCount,
    participationRate,
    completionRate: 100, // TODO: calculer à partir des réponses partielles
    avgDuration: 0, // TODO: calculer à partir des timestamps
    sphereScores,
    priorityMatrix,
    topLevers,
    rpsScores,
    rpsCriticalDimension,
    presenteeism,
    tms,
    distress,
    criticalIndicators,
    financialMetrics,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export {
  SPHERE_NAMES,
  SPHERE_QUESTIONS,
  RPS_DIMENSIONS,
  SCORE_THRESHOLDS,
  DISTRESS_THRESHOLDS,
};
