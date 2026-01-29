'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface MethodComparisonProps {
  companyId: string;
  companyName: string;
  methodAResult: {
    presCost: number;
    presCostPctPayroll: number;
    presRate: number;
    presDays: number;
  } | null;
  employeesCount: number;
  payroll: number;
}

interface SurveyWithAggregate {
  id: string;
  title: string;
  status: string;
  closedAt: string | null;
  _count: { responses: number };
  aggregate: {
    respondentsCount: number;
    prevalence: number;
    avgEfficiencyScore: number;
    qualityFlag: string;
    presCostB: number | null;
    presCostBPct: number | null;
    presCostBPerEmployee: number | null;
  } | null;
}

export function MethodComparison({
  companyId,
  companyName,
  methodAResult,
  employeesCount,
  payroll,
}: MethodComparisonProps) {
  const [surveys, setSurveys] = useState<SurveyWithAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, [companyId]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/surveys`);
      if (response.ok) {
        const data = await response.json();
        const closedWithResults = data.filter(
          (s: SurveyWithAggregate) => s.status === 'CLOSED' && s.aggregate?.presCostB
        );
        setSurveys(closedWithResults);
        if (closedWithResults.length > 0) {
          setSelectedSurveyId(closedWithResults[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSurvey = useMemo(() => {
    return surveys.find(s => s.id === selectedSurveyId);
  }, [surveys, selectedSurveyId]);

  const methodBResult = selectedSurvey?.aggregate;

  // Comparison data
  const comparisonData = useMemo(() => {
    if (!methodAResult || !methodBResult?.presCostB) return null;

    const costA = methodAResult.presCost;
    const costB = methodBResult.presCostB;
    const diff = costB - costA;
    const diffPct = ((costB - costA) / costA) * 100;

    return {
      costA,
      costB,
      diff,
      diffPct,
      pctA: methodAResult.presCostPctPayroll,
      pctB: methodBResult.presCostBPct ?? 0,
      rateA: methodAResult.presRate * 100,
      prevalenceB: (methodBResult.prevalence ?? 0) * 100,
    };
  }, [methodAResult, methodBResult]);

  // Chart data
  const barChartData = useMemo(() => {
    if (!comparisonData) return [];
    return [
      {
        name: 'Coût annuel (€)',
        'Méthode A': Math.round(comparisonData.costA),
        'Méthode B': Math.round(comparisonData.costB),
      },
    ];
  }, [comparisonData]);

  const radarData = useMemo(() => {
    if (!comparisonData || !methodBResult) return [];
    return [
      {
        metric: 'Coût/MS (%)',
        A: comparisonData.pctA,
        B: comparisonData.pctB,
        fullMark: 15,
      },
      {
        metric: 'Prévalence (%)',
        A: comparisonData.rateA,
        B: comparisonData.prevalenceB,
        fullMark: 100,
      },
      {
        metric: 'Fiabilité',
        A: 60, // Method A is based on sector ratios
        B: methodBResult.qualityFlag === 'HIGH' ? 95 : methodBResult.qualityFlag === 'MEDIUM' ? 75 : 55,
        fullMark: 100,
      },
    ];
  }, [comparisonData, methodBResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasMethodA = methodAResult && methodAResult.presCost > 0;
  const hasMethodB = surveys.length > 0;

  if (!hasMethodA && !hasMethodB) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucune donnée disponible</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Configurez les données de l&apos;entreprise (Méthode A) ou lancez une enquête interne 
            (Méthode B) pour accéder au comparatif.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-600" />
            Comparatif Méthode A vs Méthode B
          </h3>
          <p className="text-sm text-muted-foreground">
            Analyse croisée des résultats de présentéisme
          </p>
        </div>
        {surveys.length > 1 && (
          <select
            className="text-sm border rounded-md px-3 py-1.5 bg-background"
            value={selectedSurveyId || ''}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
          >
            {surveys.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.closedAt ? new Date(s.closedAt).toLocaleDateString('fr-FR') : ''})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Info Banner */}
      <Card className="bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-indigo-800 dark:text-indigo-300">Compréhension des méthodes</p>
              <div className="text-indigo-700 dark:text-indigo-400 mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Méthode A (Macro)</strong> : Estimation basée sur les ratios sectoriels et le taux d&apos;absentéisme</span>
                </div>
                <div className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Méthode B (Micro)</strong> : Mesure réelle basée sur une enquête interne anonyme</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Method A Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={!hasMethodA ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                Méthode A
                <Badge variant="outline" className="text-blue-600 border-blue-300">Macro</Badge>
              </CardTitle>
              <CardDescription>Ratios sectoriels</CardDescription>
            </CardHeader>
            <CardContent>
              {hasMethodA ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {methodAResult.presCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {methodAResult.presCostPctPayroll.toFixed(1)}% de la masse salariale
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Taux estimé : {(methodAResult.presRate * 100).toFixed(1)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Données non configurées</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Method B Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={!hasMethodB ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                Méthode B
                <Badge variant="outline" className="text-purple-600 border-purple-300">Micro</Badge>
              </CardTitle>
              <CardDescription>Enquête interne</CardDescription>
            </CardHeader>
            <CardContent>
              {methodBResult?.presCostB ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {methodBResult.presCostB.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {methodBResult.presCostBPct?.toFixed(1)}% de la masse salariale
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prévalence réelle : {((methodBResult.prevalence ?? 0) * 100).toFixed(1)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune enquête clôturée</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Difference Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={!comparisonData ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-600" />
                Écart
              </CardTitle>
              <CardDescription>B vs A</CardDescription>
            </CardHeader>
            <CardContent>
              {comparisonData ? (
                <div className="space-y-2">
                  <p className={`text-2xl font-bold flex items-center gap-1 ${
                    comparisonData.diff > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {comparisonData.diff > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {comparisonData.diff > 0 ? '+' : ''}
                    {comparisonData.diff.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {comparisonData.diffPct > 0 ? '+' : ''}{comparisonData.diffPct.toFixed(1)}% par rapport à Méthode A
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {comparisonData.diff > 0 
                      ? 'La réalité terrain semble plus coûteuse'
                      : 'La réalité terrain semble moins coûteuse'
                    }
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nécessite les deux méthodes</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      {comparisonData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparaison des coûts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, '']} 
                    />
                    <Legend />
                    <Bar dataKey="Méthode A" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Méthode B" fill="#9333ea" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil comparatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar name="Méthode A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="Méthode B" dataKey="B" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interpretation */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Interprétation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted dark:bg-card rounded-lg">
                <h4 className="font-medium mb-2">Analyse de l&apos;écart</h4>
                {Math.abs(comparisonData.diffPct) < 20 ? (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      L&apos;écart entre les deux méthodes est <strong>raisonnable</strong> ({comparisonData.diffPct.toFixed(0)}%). 
                      Les estimations sectorielles semblent cohérentes avec la réalité de l&apos;entreprise.
                    </span>
                  </div>
                ) : comparisonData.diff > 0 ? (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      L&apos;enquête révèle un coût <strong>supérieur de {comparisonData.diffPct.toFixed(0)}%</strong> aux estimations sectorielles. 
                      Cela peut indiquer des facteurs spécifiques à l&apos;organisation (climat social, conditions de travail, etc.).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      L&apos;enquête révèle un coût <strong>inférieur de {Math.abs(comparisonData.diffPct).toFixed(0)}%</strong> aux estimations sectorielles. 
                      L&apos;entreprise semble mieux positionnée que la moyenne de son secteur.
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted dark:bg-card rounded-lg">
                <h4 className="font-medium mb-2">Recommandation</h4>
                <div className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>
                    La <strong>Méthode B (enquête)</strong> fournit une mesure plus précise du présentéisme réel. 
                    Privilégiez ce résultat pour le suivi des actions et les rapports BNQ.
                    {methodBResult?.qualityFlag === 'HIGH' && (
                      <> La qualité de l&apos;enquête est <Badge className="bg-green-100 text-green-800 ml-1">Excellente</Badge></>  
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
