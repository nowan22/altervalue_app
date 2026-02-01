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
  ClipboardList,
  CalendarClock,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSectorLabel } from "@/lib/sectors";
import { calculatePresenteeism, getSignalColor } from "@/lib/presenteeism-calculator";
import PerformanceChart from "./performance-chart";
import ActivityFeed from "./activity-feed";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useDashboardContext } from "./dashboard-layout-client";

interface DashboardContentProps {
  companies: any[];
  settings: any;
  benchmarks: any[];
  activityLogs?: any[];
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

// KPI Card Component with V4.0 styling
interface KpiCardProps {
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant: 'gold' | 'teal' | 'accent' | 'muted';
  subtitle?: string;
  tooltipKey?: string;
}

function KpiCard({ title, value, suffix = "", decimals = 0, icon, trend, variant, subtitle, tooltipKey }: KpiCardProps) {
  const variantStyles = {
    gold: "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 hover:border-primary/50",
    teal: "bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border-secondary/30 hover:border-secondary/50",
    accent: "bg-gradient-to-br from-success/20 via-success/10 to-transparent border-success/30 hover:border-success/50",
    muted: "bg-gradient-to-br from-warning/20 via-warning/10 to-transparent border-warning/30 hover:border-warning/50",
  };

  const iconStyles = {
    gold: "bg-primary/20 text-primary",
    teal: "bg-secondary/20 text-secondary",
    accent: "bg-success/20 text-success",
    muted: "bg-warning/20 text-warning",
  };

  return (
    <Card className={`border transition-all duration-300 ${variantStyles[variant]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              {title}
              {tooltipKey && <HelpTooltip tooltipKey={tooltipKey as any} iconSize={12} />}
            </p>
            <p className="text-3xl font-bold mt-2 text-foreground">
              <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                {trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardContent({ companies, settings, benchmarks, activityLogs }: DashboardContentProps) {
  const { setCurrentCompanyId } = useDashboardContext();
  const safeCompanies = companies ?? [];
  const safeSettings = settings ?? {};

  // Calculate aggregated statistics
  const totalCompanies = safeCompanies.length;
  let totalEmployees = 0;
  let totalPresCostA = 0;
  let totalPresCostB = 0;
  let companiesWithMethodB = 0;
  let totalBnqProgress = 0;
  let companiesWithBnq = 0;
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

    totalPresCostA += result?.presCost ?? 0;

    // Add Method B cost if available
    const latestSurvey = company?.surveys?.[0];
    if (latestSurvey?.aggregate?.presCostB) {
      totalPresCostB += latestSurvey.aggregate.presCostB;
      companiesWithMethodB++;
    }

    // Add BNQ progress if available
    if (company?.bnqProgress?.currentProgress != null) {
      totalBnqProgress += company.bnqProgress.currentProgress;
      companiesWithBnq++;
    }

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

  // Total cost: prefer Method B when available
  const totalPresCost = companiesWithMethodB > 0 ? totalPresCostA + totalPresCostB - (totalPresCostA * companiesWithMethodB / safeCompanies.length) : totalPresCostA;

  // Average BNQ progress
  const avgBnqProgress = companiesWithBnq > 0 ? Math.round(totalBnqProgress / companiesWithBnq) : 0;

  // Count active alerts (red signals)
  const activeAlerts = signals.filter(s => s.signal === 'red').length;

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
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de vos indicateurs QVCT</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/companies/new">
            <Button className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90 shadow-lg">
              <FolderKanban className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* V4.0 KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Missions suivies"
          value={totalCompanies}
          icon={<FolderKanban className="h-6 w-6" />}
          variant="gold"
          subtitle={`${totalEmployees.toLocaleString('fr-FR')} salariés`}
          tooltipKey="dashboard_kpi_missions"
        />

        <KpiCard
          title="Coût présentéisme"
          value={Math.round(totalPresCost)}
          suffix=" €"
          icon={<Euro className="h-6 w-6" />}
          variant="teal"
          subtitle={companiesWithMethodB > 0 ? `${companiesWithMethodB} avec Méthode B` : "Méthode A"}
          tooltipKey="dashboard_kpi_costs"
        />

        <KpiCard
          title="Alertes actives"
          value={activeAlerts}
          icon={<Bell className="h-6 w-6" />}
          variant="muted"
          subtitle={signals.length > activeAlerts ? `+${signals.length - activeAlerts} avertissements` : "Aucun avertissement"}
          tooltipKey="dashboard_kpi_alerts"
        />

        <KpiCard
          title="Conformité BNQ"
          value={avgBnqProgress}
          suffix="%"
          icon={<ShieldCheck className="h-6 w-6" />}
          variant="accent"
          subtitle={companiesWithBnq > 0 ? `${companiesWithBnq} mission(s) en cours` : "Aucune démarche"}
          tooltipKey="dashboard_kpi_compliance"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signals Section */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Signaux prioritaires
                <HelpTooltip tooltipKey="dashboard_signals" iconSize={14} />
              </CardTitle>
              <CardDescription>Alertes nécessitant votre attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
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
                        ? 'bg-error/10 border-error dark:bg-error/20'
                        : signal.signal === 'orange'
                        ? 'bg-warning/10 border-warning dark:bg-warning/20'
                        : 'bg-success/10 border-success dark:bg-success/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">{signal.company}</p>
                        <p className="text-muted-foreground text-xs mt-1">{signal.message}</p>
                      </div>
                      <SignalBadge signal={signal.signal} />
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Companies / Missions */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Missions récentes
                  <HelpTooltip tooltipKey="dashboard_recent_missions" iconSize={14} />
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
                  <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune mission pour le moment</p>
                  <Link href="/dashboard/companies/new">
                    <Button className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground hover:opacity-90">
                      Créer votre première mission
                    </Button>
                  </Link>
                </div>
              ) : (
                <TooltipProvider>
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

                      // Get latest survey info
                      const latestSurvey = company?.surveys?.[0];
                      const hasMethodB = latestSurvey?.aggregate?.presCostB != null;
                      const methodBCost = latestSurvey?.aggregate?.presCostB ?? 0;

                      // Check if survey is recommended (no survey or > 12 months old)
                      const surveyRecommended = !latestSurvey || 
                        (latestSurvey.closedAt && new Date(latestSurvey.closedAt) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

                      return (
                        <div 
                          key={company?.id ?? index} 
                          onClick={() => setCurrentCompanyId(company?.id ?? '')}
                          className="cursor-pointer"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-muted hover:bg-muted dark:bg-card dark:hover:bg-card-hover rounded-xl transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-foreground dark:text-white">{company?.name ?? 'Entreprise'}</h3>
                                  {company?.isDemo && (
                                    <Badge variant="secondary" className="text-xs">Démo</Badge>
                                  )}
                                  {surveyRecommended && !company?.isDemo && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                          <ClipboardList className="h-3 w-3 mr-1" />
                                          Enquête recommandée
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Aucune enquête depuis plus de 12 mois</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                  {getSectorLabel(company?.sector ?? '')} • {company?.employeesCount ?? 0} salariés
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Survey info */}
                              {latestSurvey && (
                                <div className="text-right hidden md:block">
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1 justify-end">
                                    <CalendarClock className="h-3 w-3" />
                                    {latestSurvey.closedAt 
                                      ? new Date(latestSurvey.closedAt).toLocaleDateString('fr-FR')
                                      : latestSurvey.status === 'ACTIVE' ? 'En cours' : 'Brouillon'
                                    }
                                  </p>
                                </div>
                              )}
                              {/* Costs */}
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <p className="text-sm font-medium text-blue-600">
                                        {(result?.presCost ?? 0).toLocaleString('fr-FR')} €
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Méthode A (Ratios sectoriels)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {hasMethodB && (
                                    <>
                                      <span className="text-muted-foreground">/</span>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <p className="text-sm font-medium text-purple-600">
                                            {methodBCost.toLocaleString('fr-FR')} €
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Méthode B (Enquête)</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Coût présentéisme</p>
                              </div>
                              <SignalBadge signal={signal} />
                              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trajectory Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <PerformanceChart companies={safeCompanies} />
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <ActivityFeed initialLogs={activityLogs} limit={8} />
        </motion.div>
      </div>
    </motion.div>
  );
}
