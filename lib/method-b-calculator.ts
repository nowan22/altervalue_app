/**
 * AlterValue - Méthode B (Micro - Enquête interne)
 * 
 * Calcul du présentéisme basé sur les réponses d'enquête anonyme
 * 
 * Formules:
 * 1. L = 1 - avg_efficiency_score (Perte de productivité moyenne)
 * 2. N_c = N × p (Nombre de salariés concernés)
 * 3. H_d = N_c × hours_per_year × L (Heures dégradées)
 * 4. V_h = annual_value_added / (N × hours_per_year) OU avg_total_salary / hours_per_year
 * 5. loss_value = H_d × V_h × c_e (Perte de valeur)
 * 6. pres_cost_B = loss_value (Coût du présentéisme)
 */

export interface MethodBInput {
  // Company data
  employeesCount: number;              // N
  avgGrossSalary: number;
  employerContributionRate: number;    // As decimal (e.g., 0.45)
  hoursPerYear: number;                // Default 1600
  annualValueAdded?: number;           // Optional: annual value added or revenue
  
  // Survey aggregate data
  respondentsCount: number;
  prevalence: number;                  // p - % of affected respondents (as decimal, e.g., 0.65 for 65%)
  avgEfficiencyScore: number;          // Average efficiency among affected (0-1, e.g., 0.75 for 75%)
  
  // Parameters
  errorCorrectionCoeff?: number;       // c_e - Default 1.1
}

export interface MethodBResult {
  // Core results
  presCostB: number;                   // Total presenteeism cost (€/year)
  presCostBPct: number;                // As % of payroll
  presCostBPerEmployee: number;        // Cost per employee
  
  // Intermediate values for display
  productivityLoss: number;            // L (as %)
  affectedEmployees: number;           // N_c
  degradedHours: number;               // H_d
  valuePerHour: number;                // V_h
  lossValue: number;                   // loss_value
  
  // Company metrics
  avgTotalSalary: number;              // Loaded salary
  payroll: number;                     // Total payroll
  
  // Survey quality
  isValid: boolean;                    // True if respondentsCount >= 10
  qualityFlag: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Parameters used
  errorCorrectionCoeff: number;
}

export const MIN_RESPONDENTS_FOR_METHOD_B = 10;
export const MIN_RESPONSE_RATE_FOR_HIGH_QUALITY = 0.30; // 30%

export function calculateMethodB(input: MethodBInput): MethodBResult | null {
  const {
    employeesCount,
    avgGrossSalary,
    employerContributionRate,
    hoursPerYear = 1600,
    annualValueAdded,
    respondentsCount,
    prevalence,
    avgEfficiencyScore,
    errorCorrectionCoeff = 1.1,
  } = input;

  // Validation: minimum respondents
  const isValid = respondentsCount >= MIN_RESPONDENTS_FOR_METHOD_B;
  
  // Quality flag based on response rate
  const responseRate = respondentsCount / employeesCount;
  let qualityFlag: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (responseRate >= MIN_RESPONSE_RATE_FOR_HIGH_QUALITY) {
    qualityFlag = 'HIGH';
  } else if (responseRate >= 0.15) {
    qualityFlag = 'MEDIUM';
  }

  // Calculate salary metrics
  const avgTotalSalary = avgGrossSalary * (1 + employerContributionRate);
  const payroll = avgTotalSalary * employeesCount;

  // 1. Productivity loss: L = 1 - avg_efficiency_score
  const productivityLoss = 1 - avgEfficiencyScore;

  // 2. Affected employees: N_c = N × p
  const affectedEmployees = employeesCount * prevalence;

  // 3. Degraded hours: H_d = N_c × hours_per_year × L
  const degradedHours = affectedEmployees * hoursPerYear * productivityLoss;

  // 4. Value per hour: V_h
  // If annual_value_added is provided, use it; otherwise use salary proxy
  let valuePerHour: number;
  if (annualValueAdded && annualValueAdded > 0) {
    valuePerHour = annualValueAdded / (employeesCount * hoursPerYear);
  } else {
    valuePerHour = avgTotalSalary / hoursPerYear;
  }

  // 5. Loss value: loss_value = H_d × V_h × c_e
  const lossValue = degradedHours * valuePerHour * errorCorrectionCoeff;

  // 6. Presenteeism cost: pres_cost_B = loss_value
  const presCostB = lossValue;

  // Calculate derived metrics
  const presCostBPct = (presCostB / payroll) * 100;
  const presCostBPerEmployee = presCostB / employeesCount;

  return {
    presCostB,
    presCostBPct,
    presCostBPerEmployee,
    productivityLoss: productivityLoss * 100, // as percentage
    affectedEmployees,
    degradedHours,
    valuePerHour,
    lossValue,
    avgTotalSalary,
    payroll,
    isValid,
    qualityFlag,
    errorCorrectionCoeff,
  };
}

/**
 * Calculate survey aggregate from responses
 */
export interface SurveyResponseData {
  q1Prevalence: string;         // "NEVER" | "OCCASIONALLY" | "REGULARLY" | "VERY_FREQUENTLY"
  q2EfficiencyPercent: number;  // 100, 90, 80, 70, 60, 50
  q3Factors?: string;           // JSON array
  q4Impact?: string;            // JSON array
  q5WorkingHours: string;
}

export interface SurveyAggregateData {
  respondentsCount: number;
  prevalence: number;             // as decimal (0-1)
  avgEfficiencyScore: number;     // as decimal (0-1)
  factorDistribution: Record<string, number>;
  impactDistribution: Record<string, number>;
  workingHoursDistribution: Record<string, number>;
}

export function calculateSurveyAggregate(responses: SurveyResponseData[]): SurveyAggregateData {
  const respondentsCount = responses.length;
  
  if (respondentsCount === 0) {
    return {
      respondentsCount: 0,
      prevalence: 0,
      avgEfficiencyScore: 1,
      factorDistribution: {},
      impactDistribution: {},
      workingHoursDistribution: {},
    };
  }

  // Calculate prevalence (% affected = not "NEVER")
  const affectedResponses = responses.filter(r => r.q1Prevalence !== 'NEVER');
  const prevalence = affectedResponses.length / respondentsCount;

  // Calculate average efficiency score among affected
  let avgEfficiencyScore = 1;
  if (affectedResponses.length > 0) {
    const totalEfficiency = affectedResponses.reduce((sum, r) => {
      return sum + (r.q2EfficiencyPercent / 100);
    }, 0);
    avgEfficiencyScore = totalEfficiency / affectedResponses.length;
  }

  // Factor distribution
  const factorDistribution: Record<string, number> = {
    FATIGUE: 0,
    STRESS: 0,
    PAIN: 0,
    CONCENTRATION: 0,
    OTHER: 0,
  };
  
  responses.forEach(r => {
    if (r.q3Factors) {
      try {
        const factors = JSON.parse(r.q3Factors) as string[];
        factors.forEach(f => {
          if (factorDistribution[f] !== undefined) {
            factorDistribution[f]++;
          }
        });
      } catch {}
    }
  });

  // Convert to percentages
  Object.keys(factorDistribution).forEach(key => {
    factorDistribution[key] = Math.round((factorDistribution[key] / respondentsCount) * 100);
  });

  // Impact distribution
  const impactDistribution: Record<string, number> = {
    QUALITY: 0,
    DELAYS: 0,
    COLLEAGUES: 0,
    ERRORS: 0,
  };
  
  responses.forEach(r => {
    if (r.q4Impact) {
      try {
        const impacts = JSON.parse(r.q4Impact) as string[];
        impacts.forEach(i => {
          if (impactDistribution[i] !== undefined) {
            impactDistribution[i]++;
          }
        });
      } catch {}
    }
  });

  Object.keys(impactDistribution).forEach(key => {
    impactDistribution[key] = Math.round((impactDistribution[key] / respondentsCount) * 100);
  });

  // Working hours distribution
  const workingHoursDistribution: Record<string, number> = {
    '<35': 0,
    '35-39': 0,
    '40-44': 0,
    '45-49': 0,
    '>=50': 0,
  };
  
  responses.forEach(r => {
    if (workingHoursDistribution[r.q5WorkingHours] !== undefined) {
      workingHoursDistribution[r.q5WorkingHours]++;
    }
  });

  Object.keys(workingHoursDistribution).forEach(key => {
    workingHoursDistribution[key] = Math.round((workingHoursDistribution[key] / respondentsCount) * 100);
  });

  return {
    respondentsCount,
    prevalence,
    avgEfficiencyScore,
    factorDistribution,
    impactDistribution,
    workingHoursDistribution,
  };
}

// Labels for survey questions
export const PREVALENCE_OPTIONS = [
  { value: 'NEVER', label: 'Non, jamais' },
  { value: 'OCCASIONALLY', label: 'Occasionnellement (1-2 fois)' },
  { value: 'REGULARLY', label: 'Régulièrement (plusieurs fois)' },
  { value: 'VERY_FREQUENTLY', label: 'Très fréquemment (presque tous les jours)' },
];

export const EFFICIENCY_OPTIONS = [
  { value: 100, label: '100% - Pleine efficacité' },
  { value: 90, label: '90% - Légère baisse' },
  { value: 80, label: '80% - Baisse modérée' },
  { value: 70, label: '70% - Baisse significative' },
  { value: 60, label: '60% - Forte baisse' },
  { value: 50, label: '50% ou moins - Très forte baisse' },
];

export const FACTOR_OPTIONS = [
  { value: 'FATIGUE', label: 'Fatigue / manque de récupération' },
  { value: 'STRESS', label: 'Surcharge mentale / stress' },
  { value: 'PAIN', label: 'Douleurs physiques' },
  { value: 'CONCENTRATION', label: 'Difficulté de concentration' },
  { value: 'OTHER', label: 'Autre' },
];

export const IMPACT_OPTIONS = [
  { value: 'QUALITY', label: 'Qualité du travail' },
  { value: 'DELAYS', label: 'Respect des délais' },
  { value: 'COLLEAGUES', label: 'Charge reportée sur les collègues' },
  { value: 'ERRORS', label: 'Erreurs / reprises' },
];

export const WORKING_HOURS_OPTIONS = [
  { value: '<35', label: 'Moins de 35h' },
  { value: '35-39', label: '35-39h' },
  { value: '40-44', label: '40-44h' },
  { value: '45-49', label: '45-49h' },
  { value: '>=50', label: '50h ou plus' },
];
