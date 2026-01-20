"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Euro,
  Users,
  Clock,
  ArrowRight,
  Calculator,
  FolderKanban,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSectorLabel } from "@/lib/sectors";
import { calculatePresenteeism, getSignalColor } from "@/lib/presenteeism-calculator";
import KpiChart from "./kpi-chart";

interface DashboardContentProps {
  companies: any[];
  settings: any;
  benchmarks: any[];
}

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(stepValue * step, value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="count-up">
      {prefix}{displayValue.toLocaleString('fr-FR', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}{suffix}
    </span>
  );
}

function SignalBadge({ signal }: { signal: 'green' | 'orange' | 'red' }) {
  const config = {
    green: { label: 'Bon', icon: CheckCircle, variant: 'success' as const },
    orange: { label: 'Attention', icon: AlertTriangle, variant: 'warning' as const },
    red: { label: 'Critique', icon: AlertCircle, variant: 'danger' as const },
  };

  const { label, icon: Icon, variant } = config[signal] ?? config.green;

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function DashboardContent({ companies, settings, benchmarks }: DashboardContentProps) {
  const safeCompanies = companies ?? [];
  const safeSettings = settings ?? {};

  // Calculate aggregated statistics
  const totalCompanies = safeCompanies.length;
  let totalEmployees = 0;
  let totalPresCost = 0;
  const signals: Array<{ company: string; message: string; signal: 'green' | 'orange' | 'red' }> = [];

  safeCompanies.forEach((company) => {
    totalEmployees += company?.employeesCount ?? 0;

    const result = calculatePresenteeism({
      employeesCount: company?.employeesCount ?? 0,
      avgGrossSalary: company?.avgGrossSalary ?? 0,
      employerContributionRate: company?.employerContributionRate ?? 0,
      absenteeismRate: company?.absenteeismRate ?? 0,
      presAbsCoefficient: safeSettings?.presAbsCoefficient ?? 1.3,
      productivityLossCoeff: safeSettings?.productivityLossCoeff ?? 0.33,
    });

    totalPresCost += result?.presCost ?? 0;

    // Generate signals
    const absSignal = getSignalColor(
      company?.absenteeismRate ?? 0,
      safeSettings?.absenteeismGreenMax ?? 4,
      safeSettings?.absenteeismOrangeMax ?? 6
    );

    if (absSignal === 'red') {
      signals.push({
        company: company?.name ?? 'Entreprise',
        message: `Taux d'absentéisme élevé (${(company?.absenteeismRate ?? 0).toFixed(1)}%)`,
        signal: 'red',
      });
    } else if (absSignal === 'orange') {
      signals.push({
        company: company?.name ?? 'Entreprise',
        message: `Taux d'absentéisme en hausse (${(company?.absenteeismRate ?? 0).toFixed(1)}%)`,
        signal: 'orange',
      });
    }

    const presSignal = getSignalColor(
      result?.presCostPctPayroll ?? 0,
      safeSettings?.presCostGreenMaxPct ?? 5,
      safeSettings?.presCostOrangeMaxPct ?? 8
    );

    if (presSignal === 'red') {
      signals.push({
        company: company?.name ?? 'Entreprise',
        message: `Coût de présentéisme critique (${(result?.presCostPctPayroll ?? 0).toFixed(1)}% MS)`,
        signal: 'red',
      });
    }
  });

  // Sort signals by severity
  signals.sort((a, b) => {
    const order = { red: 0, orange: 1, green: 2 };
    return order[a.signal] - order[b.signal];
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de vos indicateurs QVCT</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/companies/new">
            <Button className="gradient-primary text-white">
              <FolderKanban className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Dossiers</p>
                <p className="text-3xl font-bold mt-1">
                  <AnimatedNumber value={totalCompanies} />
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Effectif total</p>
                <p className="text-3xl font-bold mt-1">
                  <AnimatedNumber value={totalEmployees} />
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Coût présentéisme</p>
                <p className="text-3xl font-bold mt-1">
                  <AnimatedNumber value={totalPresCost} suffix=" €" />
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Euro className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Alertes actives</p>
                <p className="text-3xl font-bold mt-1">
                  <AnimatedNumber value={signals.filter(s => s.signal === 'red').length} />
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signals Section */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Signaux prioritaires
              </CardTitle>
              <CardDescription>Alertes nécessitant votre attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p>Aucune alerte active</p>
                  <p className="text-sm">Tous les indicateurs sont au vert</p>
                </div>
              ) : (
                signals.slice(0, 5).map((signal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border-l-4 ${
                      signal.signal === 'red'
                        ? 'bg-red-50 border-red-500'
                        : signal.signal === 'orange'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{signal.company}</p>
                        <p className="text-gray-600 text-xs mt-1">{signal.message}</p>
                      </div>
                      <SignalBadge signal={signal.signal} />
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Companies */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                  Dossiers récents
                </CardTitle>
                <CardDescription>Vos dernières entreprises analysées</CardDescription>
              </div>
              <Link href="/dashboard/companies">
                <Button variant="outline" size="sm">
                  Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {safeCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Aucun dossier pour le moment</p>
                  <Link href="/dashboard/companies/new">
                    <Button className="gradient-primary text-white">
                      Créer votre premier dossier
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {safeCompanies.slice(0, 4).map((company, index) => {
                    const result = calculatePresenteeism({
                      employeesCount: company?.employeesCount ?? 0,
                      avgGrossSalary: company?.avgGrossSalary ?? 0,
                      employerContributionRate: company?.employerContributionRate ?? 0,
                      absenteeismRate: company?.absenteeismRate ?? 0,
                      presAbsCoefficient: safeSettings?.presAbsCoefficient ?? 1.3,
                      productivityLossCoeff: safeSettings?.productivityLossCoeff ?? 0.33,
                    });

                    const signal = getSignalColor(
                      company?.absenteeismRate ?? 0,
                      safeSettings?.absenteeismGreenMax ?? 4,
                      safeSettings?.absenteeismOrangeMax ?? 6
                    );

                    return (
                      <Link key={company?.id ?? index} href={`/dashboard/companies/${company?.id ?? ''}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{company?.name ?? 'Entreprise'}</h3>
                                {company?.isDemo && (
                                  <Badge variant="secondary" className="text-xs">Démo</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {getSectorLabel(company?.sector ?? '')} • {company?.employeesCount ?? 0} salariés
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {(result?.presCost ?? 0).toLocaleString('fr-FR')} €
                              </p>
                              <p className="text-xs text-gray-500">Coût présentéisme</p>
                            </div>
                            <SignalBadge signal={signal} />
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      {safeCompanies.length > 0 && safeCompanies.some(c => (c?.kpis?.length ?? 0) > 0) && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Évolution des KPI
              </CardTitle>
              <CardDescription>Tendances sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <KpiChart companies={safeCompanies} />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
