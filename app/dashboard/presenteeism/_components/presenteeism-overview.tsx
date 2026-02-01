'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calculator,
  ClipboardList,
  Scale,
  PieChart,
  TrendingUp,
  DollarSign,
  Percent,
  Users,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { calculatePresenteeism, getSignalColor } from '@/lib/presenteeism-calculator';

interface PresenteeismOverviewProps {
  company: any;
  settings: any;
}

export function PresenteeismOverview({ company, settings }: PresenteeismOverviewProps) {
  const router = useRouter();

  const result = calculatePresenteeism({
    employeesCount: company?.employeesCount ?? 0,
    avgGrossSalary: company?.avgGrossSalary ?? 0,
    employerContributionRate: company?.employerContributionRate ?? 0,
    absenteeismRate: company?.absenteeismRate ?? 0,
    presAbsCoefficient: settings?.presAbsCoefficient ?? 1.3,
    productivityLossCoeff: settings?.productivityLossCoeff ?? 0.33,
    workingDaysPerYear: settings?.workingDaysPerYear ?? 220,
  });

  const signal = getSignalColor(
    result?.presCostPctPayroll ?? 0,
    settings?.presCostGreenMaxPct ?? 5,
    settings?.presCostOrangeMaxPct ?? 8
  );

  // Check for Method B data
  const latestSurvey = company?.surveys?.[0];
  const hasMethodB = latestSurvey?.aggregate?.presCostB != null;
  const methodBCost = latestSurvey?.aggregate?.presCostB ?? 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const modules = [
    {
      id: 'calculator-a',
      label: 'Calculateur A',
      description: 'Estimation macro du présentéisme par ratios sectoriels',
      icon: Calculator,
      href: '/dashboard/presenteeism/calculator-a',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      status: 'active',
    },
    {
      id: 'survey-b',
      label: 'Enquête B',
      description: 'Diagnostic terrain par questionnaire collaborateurs',
      icon: ClipboardList,
      href: '/dashboard/presenteeism/survey-b',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      status: hasMethodB ? 'completed' : 'pending',
    },
    {
      id: 'comparison',
      label: 'A vs B',
      description: 'Comparaison des deux méthodes de calcul',
      icon: Scale,
      href: '/dashboard/presenteeism/comparison',
      color: 'text-info',
      bgColor: 'bg-info/10',
      status: hasMethodB ? 'available' : 'locked',
    },
    {
      id: 'results',
      label: 'Résultats',
      description: 'Visualisations et analyses détaillées',
      icon: PieChart,
      href: '/dashboard/presenteeism/results',
      color: 'text-success',
      bgColor: 'bg-success/10',
      status: 'available',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Calcul du Présentéisme</h1>
        <p className="text-muted-foreground mt-1">
          Module complet d'analyse du présentéisme pour {company?.name}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className={signal === 'green' ? 'text-success border-success/30' : signal === 'orange' ? 'text-warning border-warning/30' : 'text-error border-error/30'}>
                  Méthode A
                </Badge>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(result?.presCost ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Coût estimé (ratios)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={`bg-gradient-to-br ${hasMethodB ? 'from-secondary/10' : 'from-muted/50'} to-transparent border-secondary/20`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-secondary" />
                </div>
                <Badge variant="outline" className={hasMethodB ? 'text-secondary border-secondary/30' : 'text-muted-foreground border-border'}>
                  Méthode B
                </Badge>
              </div>
              <p className="text-2xl font-bold">{hasMethodB ? formatCurrency(methodBCost) : '—'}</p>
              <p className="text-sm text-muted-foreground">{hasMethodB ? 'Coût mesuré (enquête)' : 'Enquête non réalisée'}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-info/10 to-transparent border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-info/20 rounded-lg">
                  <Percent className="h-5 w-5 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold">{(result?.presRate ?? 0).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Taux de présentéisme</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <Users className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(result?.presCostPerEmployee ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Coût par employé</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card
              className={`glass-card cursor-pointer transition-all hover:border-primary/30 ${module.status === 'locked' ? 'opacity-50' : ''}`}
              onClick={() => module.status !== 'locked' && router.push(module.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${module.bgColor}`}>
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{module.label}</h3>
                      {module.status === 'completed' && (
                        <Badge variant="outline" className="text-success border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> Complété
                        </Badge>
                      )}
                      {module.status === 'pending' && (
                        <Badge variant="outline" className="text-warning border-warning/30">
                          <AlertTriangle className="h-3 w-3 mr-1" /> À faire
                        </Badge>
                      )}
                      {module.status === 'locked' && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Requiert enquête
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Synthèse rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Jours présentéisme</p>
              <p className="font-semibold">{Math.round(result?.presDays ?? 0).toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Perte productivité</p>
              <p className="font-semibold">{Math.round(result?.productivityLoss ?? 0).toLocaleString('fr-FR')} jours</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% masse salariale</p>
              <p className="font-semibold">{(result?.presCostPctPayroll ?? 0).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taux absentéisme</p>
              <p className="font-semibold">{(company?.absenteeismRate ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
