'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Calendar,
  TrendingUp,
  Target,
  AlertTriangle,
  Download,
  Loader2,
  Filter,
  BarChart3,
  PieChart,
  DollarSign,
  Lock,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Types
interface SphereScore {
  sphere: string;
  score: number;
  name: string;
  short: string;
  color: string;
}

interface PriorityItem {
  sphere: string;
  name: string;
  score: number;
  importance: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
}

interface DepartmentBreakdown {
  code: string;
  name: string;
  responseCount: number;
  isAnonymous: boolean;
  sphereScores?: SphereScore[];
}

interface AnalyticsData {
  campaign: {
    id: string;
    name: string;
    status: string;
    companyName: string;
    surveyTypeName: string;
    launchedAt: string | null;
    closedAt: string | null;
    scheduledEndDate: string | null;
  };
  participation: {
    totalResponses: number;
    targetPopulation: number;
    participationRate: number;
    minRespondents: number;
    meetsThreshold: boolean;
  };
  anonymityThreshold: number;
  sphereScores: SphereScore[];
  benchmarks: { sphere: string; benchmark: number }[];
  priorityMatrix: PriorityItem[];
  departmentBreakdown: DepartmentBreakdown[];
  financialMetrics: {
    presenteeismRate: number;
    lostDays: number;
    annualCost: number;
    costPerEmployee: number;
    potentialSavings10Percent: number;
  };
  departments: { code: string; name: string; responseCount: number }[];
}

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    danger: 'bg-error/5 border-error/20',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-error/10 text-error',
  };

  return (
    <Card className={`${variantStyles[variant]} shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? 'text-success' : 'text-error'}`} />
                <span className={trend.value >= 0 ? 'text-success' : 'text-error'}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const config = {
    HIGH: { label: 'Priorité élevée', className: 'bg-error/10 text-error border-error/20' },
    MEDIUM: { label: 'Priorité moyenne', className: 'bg-warning/10 text-warning border-warning/20' },
    LOW: { label: 'Priorité basse', className: 'bg-success/10 text-success border-success/20' },
  };
  return <Badge variant="outline" className={config[priority].className}>{config[priority].label}</Badge>;
}

export default function CampaignResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}/analytics`);
      if (!res.ok) throw new Error('Erreur');
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les résultats', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get filtered sphere scores based on department selection
  const filteredSphereScores = useMemo(() => {
    if (!data) return [];
    if (selectedDepartment === 'all') return data.sphereScores;
    
    const deptData = data.departmentBreakdown.find(d => d.code === selectedDepartment);
    if (!deptData || deptData.isAnonymous || !deptData.sphereScores) return [];
    return deptData.sphereScores;
  }, [data, selectedDepartment]);

  // Check if current filter meets anonymity threshold
  const filterMeetsThreshold = useMemo(() => {
    if (!data) return false;
    if (selectedDepartment === 'all') return data.participation.meetsThreshold;
    const deptData = data.departmentBreakdown.find(d => d.code === selectedDepartment);
    return deptData ? !deptData.isAnonymous : false;
  }, [data, selectedDepartment]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!data || filteredSphereScores.length === 0) return [];
    return filteredSphereScores.map(s => {
      const benchmark = data.benchmarks.find(b => b.sphere === s.sphere)?.benchmark || 60;
      return {
        subject: s.short,
        score: s.score,
        benchmark,
        fullMark: 100,
      };
    });
  }, [data, filteredSphereScores]);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!data) return [];
    return data.priorityMatrix.map(item => ({
      x: 100 - item.score, // Risk (inverted score)
      y: item.importance,
      name: item.name,
      color: item.color,
      priority: item.priority,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Données non disponibles</h2>
            <p className="text-muted-foreground">Impossible de charger les résultats de cette campagne.</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{data.campaign.name}</h1>
            <p className="text-muted-foreground">
              {data.campaign.companyName} • {data.campaign.surveyTypeName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {data.participation.totalResponses} réponses
          </Badge>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Participation KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Taux de participation"
          value={`${data.participation.participationRate}%`}
          subtitle={`${data.participation.totalResponses} / ${data.participation.targetPopulation} collaborateurs`}
          icon={Users}
          variant={data.participation.participationRate >= 50 ? 'success' : data.participation.participationRate >= 30 ? 'warning' : 'danger'}
        />
        <KPICard
          title="Seuil d'anonymat"
          value={data.anonymityThreshold}
          subtitle={data.participation.meetsThreshold ? 'Seuil atteint ✓' : 'Seuil non atteint'}
          icon={data.participation.meetsThreshold ? CheckCircle : Lock}
          variant={data.participation.meetsThreshold ? 'success' : 'warning'}
        />
        <KPICard
          title="Date de lancement"
          value={data.campaign.launchedAt 
            ? new Date(data.campaign.launchedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : '-'
          }
          subtitle={data.campaign.closedAt ? 'Clôturée' : 'En cours'}
          icon={Calendar}
        />
        <KPICard
          title="Score moyen global"
          value={`${Math.round(data.sphereScores.reduce((a, b) => a + b.score, 0) / data.sphereScores.length)}%`}
          subtitle="Moyenne des 4 sphères"
          icon={Target}
        />
      </div>

      {/* Department Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filtres d'analyse
              </CardTitle>
              <CardDescription>Sélectionnez un département pour affiner l'analyse</CardDescription>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Tous les départements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements ({data.participation.totalResponses})</SelectItem>
                {data.departments.map(dept => (
                  <SelectItem key={dept.code} value={dept.code} disabled={dept.responseCount < data.anonymityThreshold}>
                    {dept.name} ({dept.responseCount})
                    {dept.responseCount < data.anonymityThreshold && ' 🔒'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {selectedDepartment !== 'all' && !filterMeetsThreshold && (
          <CardContent className="pt-0">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-warning flex-shrink-0" />
              <p className="text-sm text-warning">
                <strong>Données insuffisantes</strong> — Ce département compte moins de {data.anonymityThreshold} réponses.
                L'affichage des graphiques est bloqué pour garantir l'anonymat (N &lt; {data.anonymityThreshold}).
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content - only show if threshold met */}
      {filterMeetsThreshold ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Vue d'ensemble QVCT
              </CardTitle>
              <CardDescription>
                Scores des 4 sphères BNQ (ligne teal) vs Benchmark sectoriel (ligne grise)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && radarData.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="benchmark"
                      stroke="#9ca3af"
                      fill="#9ca3af"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#14b8a6"
                      fill="#14b8a6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsRadar>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Priority Matrix Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Matrice de Priorisation
              </CardTitle>
              <CardDescription>
                Axe X: Risque (score inversé) • Axe Y: Importance (votes Q38)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && scatterData.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Risque" 
                      domain={[0, 100]}
                      label={{ value: 'Risque (→ plus élevé)', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Importance" 
                      domain={[0, 100]}
                      label={{ value: 'Importance (↑)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    {/* Priority quadrant highlight */}
                    <ReferenceArea x1={50} x2={100} y1={25} y2={100} fill="#ef4444" fillOpacity={0.08} />
                    <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <ReferenceLine y={25} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-sm text-muted-foreground">Risque: {d.x}%</p>
                              <p className="text-sm text-muted-foreground">Importance: {d.y}%</p>
                              <PriorityBadge priority={d.priority} />
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Sphères" data={scatterData} shape="circle">
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} r={entry.priority === 'HIGH' ? 12 : 8} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {data.priorityMatrix.map(item => (
                  <div key={item.sphere} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Financial Analysis (ROI) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Analyse Financière (ROI Présentéisme)
              </CardTitle>
              <CardDescription>
                Estimation du coût annuel du présentéisme et potentiel d'économies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Taux de présentéisme</p>
                  <p className="text-3xl font-bold text-primary">{data.financialMetrics.presenteeismRate}%</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Jours perdus/an</p>
                  <p className="text-3xl font-bold text-foreground">{data.financialMetrics.lostDays.toLocaleString('fr-FR')}</p>
                </div>
                <div className="bg-error/10 rounded-xl p-4 text-center border border-error/20">
                  <p className="text-sm text-muted-foreground mb-1">Coût annuel estimé</p>
                  <p className="text-3xl font-bold text-error">{data.financialMetrics.annualCost.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Coût/collaborateur</p>
                  <p className="text-3xl font-bold text-foreground">{data.financialMetrics.costPerEmployee.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-success/10 rounded-xl p-4 text-center border border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">Économies -10%</p>
                  <p className="text-3xl font-bold text-success">{data.financialMetrics.potentialSavings10Percent.toLocaleString('fr-FR')} €</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Méthode de calcul:</strong> Coût = Jours perdus × Salaire journalier moyen chargé.
                  Jours perdus = Taux présentéisme × Effectif × 220 jours/an.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Sphere Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Détail par sphère BNQ</CardTitle>
              <CardDescription>Scores et priorités d'action pour chaque dimension</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.priorityMatrix.map(item => (
                  <div
                    key={item.sphere}
                    className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{item.name}</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-medium">{item.score}%</span>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Importance</span>
                          <span className="font-medium">{item.importance}%</span>
                        </div>
                        <Progress value={item.importance} className="h-2 [&>div]:bg-warning" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Données protégées</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {selectedDepartment === 'all'
                ? `Le nombre de réponses (${data.participation.totalResponses}) est inférieur au seuil d'anonymat configuré (${data.anonymityThreshold}).`
                : `Ce département ne dispose pas de suffisamment de réponses pour garantir l'anonymat.`
              }
              <br />
              Les graphiques seront affichés une fois le seuil atteint.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
