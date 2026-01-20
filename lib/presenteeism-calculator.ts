/**
 * AlterValue - Méthode A (Macro - Ratios sectoriels)
 * 
 * Formules de calcul du présentéisme:
 * 1. Taux de présentéisme = Taux d'absentéisme × Coefficient présentéisme/absentéisme
 * 2. Nombre de jours de présentéisme = Taux de présentéisme × Effectif × 220 jours
 * 3. Perte de productivité = Nombre de jours × Coefficient de perte de productivité
 * 4. Coût du présentéisme = Perte de productivité × Salaire brut moyen × (1 + Taux de charges patronales) / 220
 */

export interface PresenteeismInput {
  employeesCount: number;
  avgGrossSalary: number;
  employerContributionRate: number; // en décimal (ex: 0.45 pour 45%)
  absenteeismRate: number; // en pourcentage (ex: 5 pour 5%)
  presAbsCoefficient?: number; // défaut 1.3
  productivityLossCoeff?: number; // défaut 0.33
  workingDaysPerYear?: number; // défaut 220
}

export interface PresenteeismResult {
  // Résultats principaux
  presRate: number; // Taux de présentéisme en %
  presDays: number; // Nombre de jours de présentéisme
  productivityLoss: number; // Perte de productivité en jours
  presCost: number; // Coût du présentéisme en €
  presCostPerEmployee: number; // Coût par salarié en €
  
  // Données intermédiaires pour affichage
  avgTotalSalary: number; // Salaire chargé
  payroll: number; // Masse salariale totale
  dailySalary: number; // Coût journalier chargé
  presCostPctPayroll: number; // Coût en % de la masse salariale
  
  // Paramètres utilisés
  presAbsCoefficient: number;
  productivityLossCoeff: number;
  workingDaysPerYear: number;
}

export function calculatePresenteeism(input: PresenteeismInput): PresenteeismResult {
  const {
    employeesCount,
    avgGrossSalary,
    employerContributionRate,
    absenteeismRate,
    presAbsCoefficient = 1.3,
    productivityLossCoeff = 0.33,
    workingDaysPerYear = 220,
  } = input;

  // Calculs intermédiaires
  const avgTotalSalary = avgGrossSalary * (1 + employerContributionRate);
  const payroll = avgTotalSalary * employeesCount;
  const dailySalary = avgTotalSalary / workingDaysPerYear;

  // 1. Taux de présentéisme = Taux d'absentéisme × Coefficient présentéisme/absentéisme
  const presRate = absenteeismRate * presAbsCoefficient;

  // 2. Nombre de jours de présentéisme = Taux de présentéisme × Effectif × 220 jours
  const presDays = (presRate / 100) * employeesCount * workingDaysPerYear;

  // 3. Perte de productivité = Nombre de jours × Coefficient de perte de productivité
  const productivityLoss = presDays * productivityLossCoeff;

  // 4. Coût du présentéisme = Perte de productivité × Salaire brut moyen × (1 + Taux de charges patronales) / 220
  const presCost = productivityLoss * avgGrossSalary * (1 + employerContributionRate) / workingDaysPerYear;

  // Coût par salarié
  const presCostPerEmployee = presCost / employeesCount;

  // Coût en % de la masse salariale
  const presCostPctPayroll = (presCost / payroll) * 100;

  return {
    presRate,
    presDays,
    productivityLoss,
    presCost,
    presCostPerEmployee,
    avgTotalSalary,
    payroll,
    dailySalary,
    presCostPctPayroll,
    presAbsCoefficient,
    productivityLossCoeff,
    workingDaysPerYear,
  };
}

// Fonction pour déterminer le signal couleur basé sur les seuils
export function getSignalColor(
  value: number,
  greenMax: number,
  orangeMax: number,
  inverse: boolean = false // pour les métriques où plus bas = mieux
): 'green' | 'orange' | 'red' {
  if (inverse) {
    if (value >= orangeMax) return 'green';
    if (value >= greenMax) return 'orange';
    return 'red';
  }
  
  if (value <= greenMax) return 'green';
  if (value <= orangeMax) return 'orange';
  return 'red';
}

// Fonction pour calculer la tendance
export function calculateTrend(
  currentValue: number,
  previousValue: number
): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  if (previousValue === 0) return { direction: 'stable', percentage: 0 };
  
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  if (Math.abs(change) < 1) return { direction: 'stable', percentage: 0 };
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
}
