'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Activity,
  TrendingDown,
  AlertCircle,
  Loader2,
  CheckCircle,
  Target,
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
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';

interface SurveyResultsProps {
  companyId: string;
  companyName: string;
  employeesCount: number;
}

interface SurveyAggregate {
  respondentsCount: number;
  prevalence: number;
  avgEfficiencyScore: number;
  responseRate: number;
  qualityFlag: string;
  factorDistribution: string | null;
  impactDistribution: string | null;
  presCostB: number | null;
  presCostBPct: number | null;
  presCostBPerEmployee: number | null;
}

interface Survey {
  id: string;
  title: string;
  status: string;
  closedAt: string | null;
  _count: { responses: number };
  aggregate: SurveyAggregate | null;
}

const FACTOR_LABELS: Record<string, string> = {
  FATIGUE: 'Fatigue',
  STRESS: 'Stress',
  PAIN: 'Douleurs',
  CONCENTRATION: 'Concentration',
  OTHER: 'Autre',
};

const IMPACT_LABELS: Record<string, string> = {
  QUALITY: 'Qualité du travail',
  DELAYS: 'Respect des délais',
  COLLEAGUES: 'Charge collègues',
  ERRORS: 'Erreurs',
};

const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export function SurveyResults({ companyId, companyName, employeesCount }: SurveyResultsProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
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
          (s: Survey) => s.status === 'CLOSED' && s.aggregate
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

  const aggregate = selectedSurvey?.aggregate;

  // Parse factor distribution
  const factorData = useMemo(() => {
    if (!aggregate?.factorDistribution) return [];
    try {
      const dist = JSON.parse(aggregate.factorDistribution) as Record<string, number>;
      return Object.entries(dist)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: FACTOR_LABELS[key] || key,
          value,
          fullKey: key,
        }))
        .sort((a, b) => b.value - a.value);
    } catch {
      return [];
    }
  }, [aggregate]);

  // Parse impact distribution
  const impactData = useMemo(() => {
    if (!aggregate?.impactDistribution) return [];
    try {
      const dist = JSON.parse(aggregate.impactDistribution) as Record<string, number>;
      return Object.entries(dist)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: IMPACT_LABELS[key] || key,
          value,
          fullKey: key,
        }))
        .sort((a, b) => b.value - a.value);
    } catch {
      return [];
    }
  }, [aggregate]);

  // Efficiency gauge data
  const efficiencyData = useMemo(() => {
    if (!aggregate) return [];
    const efficiency = aggregate.avgEfficiencyScore * 100;
    return [
      {
        name: 'Efficacité',
        value: efficiency,
        fill: efficiency >= 80 ? '#22c55e' : efficiency >= 60 ? '#f59e0b' : '#ef4444',
      },
    ];
  }, [aggregate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucun résultat disponible</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Clôturez une enquête présentéisme pour visualiser les résultats graphiques.
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
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Résultats de l&apos;enquête
          </h3>
          <p className="text-sm text-muted-foreground">
            Visualisations graphiques des données collectées
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

      {aggregate && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    Répondants
                  </div>
                  <p className="text-2xl font-bold">{aggregate.respondentsCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {((aggregate.respondentsCount / employeesCount) * 100).toFixed(0)}% participation
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    Prévalence
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {(aggregate.prevalence * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">salariés concernés</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    Efficacité moyenne
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {(aggregate.avgEfficiencyScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">des personnes concernées</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Perte productivité
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {((1 - aggregate.avgEfficiencyScore) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">parmi les concernés</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Factors Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Facteurs contribuants
                </CardTitle>
                <CardDescription>
                  Causes principales du présentéisme (% des répondants)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {factorData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={factorData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Répondants']} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            {/* Impact Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-red-600" />
                  Impact sur le travail
                </CardTitle>
                <CardDescription>
                  Types d&apos;impacts signalés par les répondants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {impactData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={impactData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                          labelLine={false}
                        >
                          {impactData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Répondants']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Efficiency Gauge & Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radial Gauge for Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score d&apos;efficacité moyen</CardTitle>
                <CardDescription>
                  Niveau d&apos;efficacité déclaré par les salariés concernés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      barSize={20}
                      data={efficiencyData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-8">
                  <p className="text-3xl font-bold">{(aggregate.avgEfficiencyScore * 100).toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">efficacité moyenne déclarée</p>
                </div>
              </CardContent>
            </Card>

            {/* Quality & Confidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Qualité de l&apos;enquête</CardTitle>
                <CardDescription>
                  Indicateurs de fiabilité des résultats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taux de participation</span>
                    <span className="font-medium">
                      {((aggregate.respondentsCount / employeesCount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(aggregate.respondentsCount / employeesCount) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Objectif recommandé : 30%+
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Nombre de réponses</span>
                    <span className="font-medium">{aggregate.respondentsCount}</span>
                  </div>
                  <Progress 
                    value={Math.min((aggregate.respondentsCount / 10) * 100, 100)} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum requis : 10 réponses
                  </p>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Niveau de confiance :</span>
                    <Badge className={`${
                      aggregate.qualityFlag === 'HIGH' 
                        ? 'bg-green-100 text-green-800' 
                        : aggregate.qualityFlag === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {aggregate.qualityFlag === 'HIGH' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {aggregate.qualityFlag === 'HIGH' ? 'Élevé' : aggregate.qualityFlag === 'MEDIUM' ? 'Modéré' : 'Faible'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
