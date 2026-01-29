/**
 * AlterValue Survey Calculation Engine v4.1
 * 
 * Moteur de calcul générique basé sur les définitions JSON des types d'enquêtes
 */

import { Prisma } from '@prisma/client';

// Types for survey definition JSON
export interface SurveyTypeDefinition {
  survey_type_id: string;
  survey_metadata: {
    name: string;
    version: string;
    framework: string[];
    target_audience: string;
    decision_makers: string[];
    estimated_duration_minutes: number;
    primary_objective: string;
    secondary_objectives: string[];
  };
  data_governance: {
    anonymity_threshold: number;
    rgpd_compliant: boolean;
    sensitive_data: boolean;
    data_retention_days: number;
  };
  questionnaire_structure: {
    modules: QuestionnaireModule[];
  };
  calculation_engine: CalculationEngineConfig;
  output_engine: OutputEngineConfig;
}

export interface QuestionnaireModule {
  id: string;
  title: string;
  bnq_reference?: string;
  description?: string;
  condition?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  type: 'consent' | 'scale' | 'single_choice' | 'multiple_choice' | 'rank' | 'open_ended' | 'number';
  text: string;
  required?: boolean;
  scale?: string; // "0-10"
  options?: Array<{ value: string | number; label: string; score?: number }>;
  min?: number;
  max?: number;
  unit?: string;
  max_choices?: number;
  labels?: Record<string, string>;
  condition?: string;
  max_length?: number;
  allow_other?: boolean;
  other_field_id?: string;
}

export interface ScoringDimension {
  id: string;
  name?: string;
  source?: string;
  questions?: string[];
  aggregation: 'mean' | 'sum' | 'percentage_affected' | 'mean_among_affected';
  weight?: number;
  alert_threshold?: number;
  formula?: string;
  affected_condition?: string;
  affected_filter?: string;
  scale_max?: number;
  unit?: string;
  bnq_compliance?: boolean;
  color?: string;
}

export interface CriticalIndicator {
  id: string;
  condition: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  message: string;
  recommendation?: string;
}

export interface FinancialFormula {
  id: string;
  name?: string;
  formula: string;
  variables?: Record<string, any>;
  unit?: string;
  description?: string;
}

export interface CalculationEngineConfig {
  scoring_dimensions: ScoringDimension[];
  critical_indicators?: CriticalIndicator[];
  financial_formulas?: FinancialFormula[];
  qualitative_aggregations?: any[];
  alert_rules?: any[];
  global_score?: {
    id: string;
    formula: string;
    dimensions: string[];
  };
}

export interface OutputEngineConfig {
  deliverables: any[];
  visualizations: any[];
  narrative_templates: Record<string, string>;
}

// Result types
export interface CalculationResult {
  responseCount: number;
  participationRate: number | null;
  scores: Record<string, number>;
  criticalIndicators: Record<string, {
    triggered: boolean;
    severity: string;
    message: string;
    recommendation?: string;
  }>;
  financialMetrics: Record<string, number> | null;
  qualitativeInsights: Record<string, any> | null;
  narrative: string;
}

export interface CompanyParams {
  headcount: number;
  avgGrossSalary: number;
  employerContributionRate: number;
  hoursPerYear?: number;
  annualValueAdded?: number;
}

/**
 * Survey Calculation Engine class
 */
export class SurveyCalculationEngine {
  private definition: SurveyTypeDefinition;
  private calculationConfig: CalculationEngineConfig;

  constructor(surveyDefinition: SurveyTypeDefinition | Prisma.JsonValue) {
    this.definition = surveyDefinition as SurveyTypeDefinition;
    this.calculationConfig = this.definition.calculation_engine || { scoring_dimensions: [] };
  }

  /**
   * Calculate all results for a list of responses
   */
  calculate(
    responses: Array<Record<string, any>>,
    companyParams?: CompanyParams,
    targetPopulation?: number
  ): CalculationResult {
    const responseCount = responses.length;
    const participationRate = targetPopulation 
      ? Math.round((responseCount / targetPopulation) * 100) 
      : null;

    // 1. Calculate scores by dimension
    const scores = this.calculateDimensionScores(responses);

    // 2. Evaluate critical indicators
    const criticalIndicators = this.evaluateCriticalIndicators(responses, scores);

    // 3. Calculate financial metrics if company params provided
    const financialMetrics = companyParams 
      ? this.calculateFinancialMetrics(responses, scores, companyParams)
      : null;

    // 4. Aggregate qualitative data
    const qualitativeInsights = this.aggregateQualitativeData(responses);

    // 5. Generate narrative
    const narrative = this.generateNarrative({
      responseCount,
      participationRate,
      scores,
      criticalIndicators,
      financialMetrics,
      qualitativeInsights,
    }, companyParams);

    return {
      responseCount,
      participationRate,
      scores,
      criticalIndicators,
      financialMetrics,
      qualitativeInsights,
      narrative,
    };
  }

  /**
   * Calculate scores by dimension
   */
  private calculateDimensionScores(responses: Array<Record<string, any>>): Record<string, number> {
    const dimensions = this.calculationConfig.scoring_dimensions || [];
    const scores: Record<string, number> = {};

    for (const dimension of dimensions) {
      const dimId = dimension.id;

      // Handle formula-based dimensions
      if (dimension.formula && !dimension.source && !dimension.questions) {
        // Will be calculated after other dimensions
        continue;
      }

      // Handle source-based dimensions (single question)
      if (dimension.source) {
        const values = responses
          .map(r => r[dimension.source!])
          .filter(v => v !== null && v !== undefined && typeof v === 'number');

        if (dimension.aggregation === 'percentage_affected') {
          // Calculate percentage of responses that are "affected"
          const affectedCount = responses.filter(r => {
            const val = r[dimension.source!];
            if (dimension.affected_condition) {
              // e.g., "!= 'NEVER'"
              return val !== 'NEVER' && val !== null && val !== undefined;
            }
            return val !== null && val !== undefined;
          }).length;
          scores[dimId] = responses.length > 0 ? affectedCount / responses.length : 0;
        } else if (dimension.aggregation === 'mean_among_affected') {
          // Calculate mean among affected responses only
          const affectedResponses = responses.filter(r => {
            if (dimension.affected_filter) {
              // Filter based on another question
              const filterParts = dimension.affected_filter.split(' ');
              const filterField = filterParts[0];
              return r[filterField] !== 'NEVER' && r[filterField] !== null;
            }
            return r[dimension.source!] !== null && r[dimension.source!] !== undefined;
          });
          const affectedValues = affectedResponses
            .map(r => r[dimension.source!])
            .filter(v => typeof v === 'number');
          scores[dimId] = affectedValues.length > 0 
            ? affectedValues.reduce((a, b) => a + b, 0) / affectedValues.length 
            : 0;
        } else {
          // Default mean
          scores[dimId] = values.length > 0 
            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
            : 0;
        }
        continue;
      }

      // Handle question-based dimensions
      if (dimension.questions && dimension.questions.length > 0) {
        const allValues: number[] = [];
        for (const questionId of dimension.questions) {
          const values = responses
            .map(r => r[questionId])
            .filter(v => v !== null && v !== undefined && typeof v === 'number');
          allValues.push(...values);
        }

        if (allValues.length > 0) {
          if (dimension.aggregation === 'mean') {
            scores[dimId] = Math.round((allValues.reduce((a, b) => a + b, 0) / allValues.length) * 100) / 100;
          } else if (dimension.aggregation === 'sum') {
            scores[dimId] = allValues.reduce((a, b) => a + b, 0);
          }
        } else {
          scores[dimId] = 0;
        }
      }
    }

    // Calculate formula-based dimensions
    for (const dimension of dimensions) {
      if (dimension.formula && !dimension.source && !dimension.questions) {
        try {
          // Simple formula evaluation - replace dimension IDs with values
          let formula = dimension.formula;
          for (const [key, value] of Object.entries(scores)) {
            formula = formula.replace(new RegExp(key, 'g'), String(value));
          }
          // Safe eval for simple math expressions
          const result = Function('"use strict"; return (' + formula + ')')();
          scores[dimension.id] = Math.round(result * 100) / 100;
        } catch (e) {
          scores[dimension.id] = 0;
        }
      }
    }

    // Calculate global score if defined
    if (this.calculationConfig.global_score) {
      const { dimensions: globalDims } = this.calculationConfig.global_score;
      const relevantDimensions = dimensions.filter(d => globalDims.includes(d.id));
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (const dim of relevantDimensions) {
        const weight = dim.weight || 1;
        const score = scores[dim.id] || 0;
        weightedSum += score * weight;
        totalWeight += weight;
      }
      
      scores['GLOBAL'] = totalWeight > 0 
        ? Math.round((weightedSum / totalWeight) * 100) / 100 
        : 0;
    }

    return scores;
  }

  /**
   * Evaluate critical indicators
   */
  private evaluateCriticalIndicators(
    responses: Array<Record<string, any>>,
    scores: Record<string, number>
  ): Record<string, { triggered: boolean; severity: string; message: string; recommendation?: string }> {
    const indicators = this.calculationConfig.critical_indicators || [];
    const results: Record<string, { triggered: boolean; severity: string; message: string; recommendation?: string }> = {};

    for (const indicator of indicators) {
      const isTriggered = this.evaluateCondition(indicator.condition, responses, scores);
      
      if (isTriggered) {
        results[indicator.id] = {
          triggered: true,
          severity: indicator.severity || 'info',
          message: indicator.message || '',
          recommendation: indicator.recommendation,
        };
      }
    }

    return results;
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    responses: Array<Record<string, any>>,
    scores: Record<string, number>
  ): boolean {
    try {
      // Replace dimension names with values
      let expr = condition;
      for (const [key, value] of Object.entries(scores)) {
        expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
      }
      
      // Handle special conditions like "contains"
      if (expr.includes('contains')) {
        // TODO: Implement contains logic for factor aggregations
        return false;
      }
      
      // Safe eval for comparison expressions
      return Function('"use strict"; return (' + expr + ')')();
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancialMetrics(
    responses: Array<Record<string, any>>,
    scores: Record<string, number>,
    companyParams: CompanyParams
  ): Record<string, number> {
    const formulas = this.calculationConfig.financial_formulas || [];
    const metrics: Record<string, number> = {};

    const { headcount, avgGrossSalary, employerContributionRate, hoursPerYear = 1600 } = companyParams;
    const avgTotalSalary = avgGrossSalary * (1 + employerContributionRate);
    const dailyCost = avgTotalSalary / 220; // ~220 working days/year
    const payroll = avgTotalSalary * headcount;

    // Variables available in formulas
    const variables: Record<string, number> = {
      ...scores,
      headcount,
      avg_gross_salary: avgGrossSalary,
      avg_total_salary: avgTotalSalary,
      daily_cost: dailyCost,
      hours_per_year: hoursPerYear,
      payroll,
      error_correction_coeff: 1.1,
    };

    for (const formula of formulas) {
      try {
        let expr = formula.formula;
        
        // Replace variable names with values
        for (const [key, value] of Object.entries(variables)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'gi'), String(value));
        }
        
        // Also replace metric names (for dependent formulas)
        for (const [key, value] of Object.entries(metrics)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        }
        
        // Replace × with *
        expr = expr.replace(/×/g, '*');
        
        // Safe eval
        const result = Function('"use strict"; return (' + expr + ')')();
        metrics[formula.id] = Math.round(result * 100) / 100;
      } catch (e) {
        metrics[formula.id] = 0;
      }
    }

    return metrics;
  }

  /**
   * Aggregate qualitative data
   */
  private aggregateQualitativeData(
    responses: Array<Record<string, any>>
  ): Record<string, any> {
    const insights: Record<string, any> = {};
    const aggregations = this.calculationConfig.qualitative_aggregations || [];

    for (const agg of aggregations) {
      if (agg.type === 'count_percentage') {
        const distribution: Record<string, number> = {};
        
        for (const response of responses) {
          const value = response[agg.source];
          if (Array.isArray(value)) {
            // Multiple choice
            for (const v of value) {
              distribution[v] = (distribution[v] || 0) + 1;
            }
          } else if (value) {
            // Single choice
            distribution[value] = (distribution[value] || 0) + 1;
          }
        }
        
        // Convert to percentages
        const total = responses.length;
        for (const key of Object.keys(distribution)) {
          distribution[key] = Math.round((distribution[key] / total) * 100);
        }
        
        insights[agg.id] = distribution;
      } else if (agg.type === 'rank_aggregation') {
        // Borda count for ranking
        const bordaScores: Record<string, number> = {};
        
        for (const response of responses) {
          const rankings = response[agg.source];
          if (Array.isArray(rankings)) {
            for (let i = 0; i < rankings.length; i++) {
              const item = rankings[i];
              // Borda: last place = 1 point, first place = n points
              bordaScores[item] = (bordaScores[item] || 0) + (rankings.length - i);
            }
          }
        }
        
        insights[agg.id] = bordaScores;
      } else if (agg.type === 'text_collection') {
        // Collect verbatims
        const verbatims = responses
          .map(r => r[agg.source])
          .filter(v => v && typeof v === 'string' && v.trim().length > 0);
        
        insights[agg.id] = verbatims;
      }
    }

    return insights;
  }

  /**
   * Generate narrative text from templates
   */
  generateNarrative(
    results: Partial<CalculationResult>,
    companyParams?: CompanyParams
  ): string {
    const templates = this.definition.output_engine?.narrative_templates || {};
    const parts: string[] = [];

    // Opening
    if (templates.opening) {
      let text = templates.opening;
      text = text.replace('{response_count}', String(results.responseCount || 0));
      text = text.replace('{participation_rate}', String(results.participationRate || 'N/A'));
      text = text.replace('{company_name}', 'votre organisation');
      
      // Replace financial metrics
      if (results.financialMetrics) {
        for (const [key, value] of Object.entries(results.financialMetrics)) {
          text = text.replace(`{${key}}`, this.formatNumber(value));
        }
      }
      
      parts.push(text);
    }

    // Dimension insight
    if (templates.insight && results.scores) {
      const scores = results.scores;
      const dimensionNames = this.calculationConfig.scoring_dimensions
        .filter(d => d.questions && d.questions.length > 0)
        .map(d => d.id);
      
      if (dimensionNames.length > 0) {
        let lowestDim = dimensionNames[0];
        let lowestScore = scores[lowestDim] || 10;
        
        for (const dim of dimensionNames) {
          if ((scores[dim] || 10) < lowestScore) {
            lowestScore = scores[dim] || 10;
            lowestDim = dim;
          }
        }
        
        let text = templates.insight;
        text = text.replace('{lowest_dimension}', this.getDimensionLabel(lowestDim));
        text = text.replace('{lowest_score}', String(lowestScore));
        parts.push(text);
      }
    }

    // Global score insight
    if (templates.global_insight && results.scores?.GLOBAL) {
      let text = templates.global_insight;
      text = text.replace('{global_score}', String(results.scores.GLOBAL));
      
      // Determine interpretation
      const score = results.scores.GLOBAL;
      let interpretation = 'modéré';
      if (score >= 8) interpretation = 'excellent';
      else if (score >= 7) interpretation = 'satisfaisant';
      else if (score < 6) interpretation = 'préoccupant';
      
      text = text.replace('{global_interpretation}', interpretation);
      parts.push(text);
    }

    // Financial impact
    if (templates.financial_impact && results.financialMetrics) {
      let text = templates.financial_impact;
      for (const [key, value] of Object.entries(results.financialMetrics)) {
        text = text.replace(`{${key}}`, this.formatNumber(value));
      }
      parts.push(text);
    }

    // Recommendation
    if (templates.recommendation) {
      let text = templates.recommendation;
      
      // Find top recommendation from critical indicators
      const indicators = Object.values(results.criticalIndicators || {});
      const topIndicator = indicators.find(i => i.triggered && i.recommendation);
      if (topIndicator) {
        text = text.replace('{top_recommendation}', topIndicator.recommendation || '');
      } else {
        text = text.replace('{top_recommendation}', 'maintenir les bonnes pratiques actuelles');
      }
      
      // ROI estimate
      if (results.financialMetrics?.roi_estimate) {
        text = text.replace('{roi_estimate}', this.formatNumber(results.financialMetrics.roi_estimate));
      }
      
      parts.push(text);
    }

    return parts.join(' ');
  }

  /**
   * Get human-readable dimension label
   */
  private getDimensionLabel(dimensionId: string): string {
    const dimension = this.calculationConfig.scoring_dimensions.find(d => d.id === dimensionId);
    return dimension?.name || dimensionId.replace(/_/g, ' ').toLowerCase();
  }

  /**
   * Format number for display
   */
  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return Math.round(value).toLocaleString('fr-FR');
    }
    return String(Math.round(value * 100) / 100);
  }

  /**
   * Get questionnaire structure for rendering
   */
  getQuestionnaire(): QuestionnaireModule[] {
    return this.definition.questionnaire_structure?.modules || [];
  }

  /**
   * Get metadata
   */
  getMetadata() {
    return this.definition.survey_metadata;
  }

  /**
   * Get data governance settings
   */
  getDataGovernance() {
    return this.definition.data_governance;
  }
}
