'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  TrendingUp,
  Calculator,
  ShieldCheck,
  FileText,
  Target,
  ChevronRight,
  Euro,
  Percent,
  Calendar,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { BnqLevel } from '@prisma/client';
import { ExportButtons } from '../../companies/[id]/_components/export-buttons';
import KpiHistory from '../../companies/[id]/_components/kpi-history';

interface MyMissionContentProps {
  company: {
    id: string;
    name: string;
    sector: string;
    employeesCount: number;
    avgGrossSalary: number;
    employerContributionRate: number;
    absenteeismRate: number;
    createdAt: string;
    kpis: Array<{
      id: string;
      periodDate: string;
      employees: number;
      absenteeismRate: number;
      presRate: number;
      presCost: number;
    }>;
    bnqProgress: {
      targetLevel: string;
      currentProgress: number;
      documentsProgress: number;
      workflowProgress: number;
    } | null;
  };
  calculationResult: {
    presRate: number;
    presDays: number;
    productivityLoss: number;
    presCost: number;
    presCostPerEmployee: number;
    presCostPctPayroll: number;
    signalColor: string;
  } | null;
  settings: {
    presAbsCoefficient: number;
    productivityLossCoeff: number;
    workingDaysPerYear: number;
    presCostGreenMaxPct: number;
    presCostOrangeMaxPct: number;
  } | null;
  userRole: string;
}

export function MyMissionContent({ company, calculationResult, settings, userRole }: MyMissionContentProps) {
  const router = useRouter();
  const isReadonly = userRole === 'OBSERVATEUR';

  const targetLevel = (company.bnqProgress?.targetLevel || 'ES') as BnqLevel;
  const levelInfo = BNQ_LEVEL_LABELS[targetLevel];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare data for ExportButtons (map to expected format)
  const exportCompanyData = {
    id: company.id,
    name: company.name,
    sector: company.sector,
    employees: company.employeesCount,
    averageSalary: company.avgGrossSalary,
    absenteeismRate: company.absenteeismRate,
  };

  const exportResult = calculationResult ? {
    presenteeismRate: calculationResult.presRate,
    presenteeismDays: calculationResult.presDays,
    productivityLoss: calculationResult.productivityLoss,
    presenteeismCost: calculationResult.presCost,
    costPerEmployee: calculationResult.presCostPerEmployee,
    percentOfPayroll: calculationResult.presCostPctPayroll,
    signal: calculationResult.signalColor as 'green' | 'orange' | 'red',
    trend: 'stable' as 'improving' | 'stable' | 'degrading',
  } : null;

  // Quick access cards
  const quickAccess = [
    {
      id: 'presenteeism',
      label: 'Calcul Présentéisme',
      description: 'Analyser les coûts du présentéisme',
      icon: Calculator,
      href: '/dashboard/presenteeism',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'bnq',
      label: 'Module BNQ',
      description: 'Conformité et certification',
      icon: ShieldCheck,
      href: '/dashboard/bnq',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      id: 'surveys',
      label: 'Enquêtes',
      description: 'Gérer les sondages',
      icon: ClipboardList,
      href: '/dashboard/presenteeism/survey-b',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{company.name}</h1>
            <p className="text-muted-foreground">{company.sector}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <ExportButtons
            company={exportCompanyData}
            result={exportResult}
            type="report"
          />
          <div className="flex items-center gap-3">
            {company.bnqProgress && (
              <Badge className={`${levelInfo.color} text-white`}>
                Objectif {levelInfo.badge}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {company.employeesCount} employés
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presenteeism Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="glass-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Euro className="h-5 w-5 text-primary" />
                </div>
                <Badge 
                  variant="outline" 
                  className={calculationResult?.signalColor === 'green' 
                    ? 'bg-success/10 text-success border-success/30' 
                    : calculationResult?.signalColor === 'orange' 
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'bg-error/10 text-error border-error/30'
                  }
                >
                  {calculationResult?.signalColor === 'green' ? 'Bon' 
                    : calculationResult?.signalColor === 'orange' ? 'Attention' : 'Critique'}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {calculationResult ? formatCurrency(calculationResult.presCost) : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Coût présentéisme annuel</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Presenteeism Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <Percent className="h-5 w-5 text-secondary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {calculationResult ? formatPercent(calculationResult.presRate) : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Taux de présentéisme</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Absenteeism Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card bg-gradient-to-br from-info/10 to-transparent border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-info/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {formatPercent(company.absenteeismRate)}
                </p>
                <p className="text-sm text-muted-foreground">Taux d'absentéisme</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* BNQ Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card bg-gradient-to-br from-success/10 to-transparent border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-success/20 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {company.bnqProgress ? Math.round(company.bnqProgress.currentProgress) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Conformité BNQ</p>
              </div>
              {company.bnqProgress && (
                <Progress value={company.bnqProgress.currentProgress} className="h-1.5 mt-3" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Access */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Accès rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickAccess.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card
                className="glass-card hover:border-primary/30 cursor-pointer transition-all group h-full"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Details & BNQ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Details */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Détails de la mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Salaire moyen</p>
                <p className="font-medium">{formatCurrency(company.avgGrossSalary)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cotisations employeur</p>
                <p className="font-medium">{formatPercent(company.employerContributionRate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Coût par employé</p>
                <p className="font-medium">
                  {calculationResult ? formatCurrency(calculationResult.presCostPerEmployee) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% de la masse salariale</p>
                <p className="font-medium">
                  {calculationResult ? formatPercent(calculationResult.presCostPctPayroll) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BNQ Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Statut BNQ
            </CardTitle>
            <CardDescription>
              Progression vers la certification {levelInfo.badge}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.bnqProgress ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression globale</span>
                    <span className="font-medium">{Math.round(company.bnqProgress.currentProgress)}%</span>
                  </div>
                  <Progress value={company.bnqProgress.currentProgress} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Documents</span>
                    <span className="font-medium">{Math.round(company.bnqProgress.documentsProgress)}%</span>
                  </div>
                  <Progress value={company.bnqProgress.documentsProgress} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Workflow</span>
                    <span className="font-medium">{Math.round(company.bnqProgress.workflowProgress)}%</span>
                  </div>
                  <Progress value={company.bnqProgress.workflowProgress} className="h-1.5" />
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => router.push('/dashboard/bnq')}
                >
                  Voir le module BNQ
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">BNQ non configuré</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Graphs */}
      {company.kpis && company.kpis.length > 0 && settings && (
        <div className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Historique des indicateurs
              </CardTitle>
              <CardDescription>
                Évolution des KPIs sur les 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KpiHistory
                kpis={company.kpis}
                settings={settings}
                company={exportCompanyData}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role notice */}
      {isReadonly && (
        <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
          <p className="text-sm text-info">
            <strong>Mode consultation :</strong> Vous avez un accès en lecture seule à cette mission.
          </p>
        </div>
      )}
    </div>
  );
}
