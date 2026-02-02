"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowLeft,
  Edit,
  Users,
  Euro,
  Percent,
  Calculator,
  Upload,
  FileDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  Bell,
  Loader2,
  ClipboardList,
  Scale,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSectorLabel } from "@/lib/sectors";
import { calculatePresenteeism, getSignalColor } from "@/lib/presenteeism-calculator";
import { useToast } from "@/hooks/use-toast";
import CsvImport from "./csv-import";
import KpiHistory from "./kpi-history";
import PresenteeismCalculator from "./presenteeism-calculator";
import { ExportButtons } from "./export-buttons";
import { SurveyManagement } from "./survey-management";
import { MethodComparison } from "./method-comparison";
import { SurveyResults } from "./survey-results";

interface CompanyDetailProps {
  company: any;
  settings: any;
  benchmarks: any[];
}

export default function CompanyDetail({ company, settings, benchmarks }: CompanyDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [sendingAlert, setSendingAlert] = useState(false);

  const safeCompany = company ?? {};
  const safeSettings = settings ?? {};
  const safeBenchmarks = benchmarks ?? [];

  const handleSendAlert = async () => {
    setSendingAlert(true);
    try {
      const response = await fetch('/api/notifications/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: safeCompany?.id,
          companyName: safeCompany?.name,
          presenteeismRate: result?.presRate ?? 0,
          presenteeismCost: result?.presCost ?? 0,
          threshold: safeSettings?.presCostOrangeMaxPct ?? 8,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Alerte envoyée',
          description: 'La notification a été envoyée par email.',
        });
      } else {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'alerte',
        variant: 'destructive',
      });
    } finally {
      setSendingAlert(false);
    }
  };

  const result = calculatePresenteeism({
    employeesCount: safeCompany?.employeesCount ?? 0,
    avgGrossSalary: safeCompany?.avgGrossSalary ?? 0,
    employerContributionRate: safeCompany?.employerContributionRate ?? 0,
    absenteeismRate: safeCompany?.absenteeismRate ?? 0,
    presAbsCoefficient: safeSettings?.presAbsCoefficient ?? 1.3,
    productivityLossCoeff: safeSettings?.productivityLossCoeff ?? 0.33,
    workingDaysPerYear: safeSettings?.workingDaysPerYear ?? 220,
  });

  const absSignal = getSignalColor(
    safeCompany?.absenteeismRate ?? 0,
    safeSettings?.absenteeismGreenMax ?? 4,
    safeSettings?.absenteeismOrangeMax ?? 6
  );

  const presSignal = getSignalColor(
    result?.presCostPctPayroll ?? 0,
    safeSettings?.presCostGreenMaxPct ?? 5,
    safeSettings?.presCostOrangeMaxPct ?? 8
  );

  const benchmark = safeBenchmarks.find(b => b?.sector === safeCompany?.sector);

  // Prepare data for export
  const exportCompanyData = {
    id: safeCompany?.id ?? '',
    name: safeCompany?.name ?? 'Entreprise',
    sector: getSectorLabel(safeCompany?.sector ?? ''),
    employees: safeCompany?.employeesCount ?? 0,
    averageSalary: safeCompany?.avgGrossSalary ?? 0,
    absenteeismRate: safeCompany?.absenteeismRate ?? 0,
  };

  const exportResult = result ? {
    presenteeismRate: result.presRate ?? 0,
    presenteeismDays: result.presDays ?? 0,
    productivityLoss: result.productivityLoss ?? 0,
    presenteeismCost: result.presCost ?? 0,
    costPerEmployee: result.presCostPerEmployee ?? 0,
    percentOfPayroll: result.presCostPctPayroll ?? 0,
    signal: presSignal as 'green' | 'orange' | 'red',
    trend: 'stable' as 'improving' | 'stable' | 'degrading',
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Deprecation Notice */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning">
              Page dépréciée — Veuillez utiliser "Ma Mission"
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Cette ancienne page sera supprimée prochainement. Toutes les fonctionnalités sont maintenant disponibles sur la page{' '}
              <button
                onClick={() => router.push('/dashboard/my-mission')}
                className="text-primary hover:underline font-medium"
              >
                Ma Mission
              </button>
              {' '}(KPIs, exports, historique).
            </p>
            <div className="mt-3">
              <button
                onClick={() => router.push('/dashboard/my-mission')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Aller à Ma Mission →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/companies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/companies/${safeCompany?.id ?? ''}/bnq`}>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Shield className="h-4 w-4 mr-2" />
              BNQ 9700-800
            </Button>
          </Link>
          <Link href={`/dashboard/companies/${safeCompany?.id ?? ''}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <ExportButtons
            company={exportCompanyData}
            result={exportResult}
            type="report"
          />
          {presSignal === 'red' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSendAlert}
              disabled={sendingAlert}
            >
              {sendingAlert ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Envoyer Alerte
            </Button>
          )}
        </div>
      </div>

      {/* Company Header Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-card/20 rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{safeCompany?.name ?? 'Entreprise'}</h1>
                  {safeCompany?.isDemo && (
                    <Badge variant="secondary" className="bg-card/20 text-white border-0">
                      Démo
                    </Badge>
                  )}
                </div>
                <p className="text-blue-100 mt-1">
                  {getSectorLabel(safeCompany?.sector ?? '')} • {safeCompany?.country ?? 'France'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-blue-100 text-sm">Effectif</p>
                <p className="text-2xl font-bold">{safeCompany?.employeesCount ?? 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Absentéisme</p>
                <p className="text-2xl font-bold">{(safeCompany?.absenteeismRate ?? 0).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Coût présent.</p>
                <p className="text-2xl font-bold">{(result?.presCost ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Par salarié</p>
                <p className="text-2xl font-bold">{(result?.presCostPerEmployee ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="calculator">Calculateur</TabsTrigger>
          <TabsTrigger value="survey" className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            Enquête
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            A vs B
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            Résultats
          </TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`border-l-4 ${
              absSignal === 'green' ? 'border-l-green-500' :
              absSignal === 'orange' ? 'border-l-orange-500' : 'border-l-red-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'absentéisme</p>
                    <p className="text-2xl font-bold">{(safeCompany?.absenteeismRate ?? 0).toFixed(1)}%</p>
                    {benchmark && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Benchmark: {benchmark?.absenteeismMin ?? 0}-{benchmark?.absenteeismMax ?? 0}%
                      </p>
                    )}
                  </div>
                  {absSignal === 'green' ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : absSignal === 'orange' ? (
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${
              presSignal === 'green' ? 'border-l-green-500' :
              presSignal === 'orange' ? 'border-l-orange-500' : 'border-l-red-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de présentéisme</p>
                    <p className="text-2xl font-bold">{(result?.presRate ?? 0).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(result?.presCostPctPayroll ?? 0).toFixed(1)}% de la masse salariale
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jours de présentéisme</p>
                    <p className="text-2xl font-bold">{(result?.presDays ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Perte productivité: {(result?.productivityLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Masse salariale</p>
                    <p className="text-2xl font-bold">{((result?.payroll ?? 0) / 1000000).toFixed(1)}M€</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Salaire chargé: {(result?.avgTotalSalary ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </p>
                  </div>
                  <Euro className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Détail du calcul (Méthode A)</CardTitle>
                <CardDescription>Formules appliquées avec les coefficients actuels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">1. Taux de présentéisme</span>
                    <span className="font-mono">
                      {(safeCompany?.absenteeismRate ?? 0).toFixed(1)}% × {result?.presAbsCoefficient ?? 1.3} = <strong>{(result?.presRate ?? 0).toFixed(2)}%</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">2. Jours de présentéisme</span>
                    <span className="font-mono">
                      {(result?.presRate ?? 0).toFixed(2)}% × {safeCompany?.employeesCount ?? 0} × {result?.workingDaysPerYear ?? 220} = <strong>{(result?.presDays ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">3. Perte de productivité</span>
                    <span className="font-mono">
                      {(result?.presDays ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} × {result?.productivityLossCoeff ?? 0.33} = <strong>{(result?.productivityLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours</strong>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">4. Coût du présentéisme</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {(result?.presCost ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Coefficients utilisés :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Coefficient présentéisme/absentéisme : {result?.presAbsCoefficient ?? 1.3}</li>
                    <li>• Coefficient perte de productivité : {result?.productivityLossCoeff ?? 0.33}</li>
                    <li>• Jours travaillés/an : {result?.workingDaysPerYear ?? 220}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interprétation</CardTitle>
                <CardDescription>Analyse des résultats et recommandations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  presSignal === 'green' ? 'bg-green-50 border border-green-200' :
                  presSignal === 'orange' ? 'bg-orange-50 border border-orange-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {presSignal === 'green' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`h-5 w-5 ${presSignal === 'orange' ? 'text-orange-600' : 'text-red-600'} mt-0.5`} />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        presSignal === 'green' ? 'text-green-800' :
                        presSignal === 'orange' ? 'text-orange-800' : 'text-red-800'
                      }`}>
                        {presSignal === 'green' ? 'Situation maîtrisée' :
                         presSignal === 'orange' ? 'Vigilance requise' : 'Situation critique'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        presSignal === 'green' ? 'text-green-700' :
                        presSignal === 'orange' ? 'text-orange-700' : 'text-red-700'
                      }`}>
                        {presSignal === 'green'
                          ? `Le coût du présentéisme représente ${(result?.presCostPctPayroll ?? 0).toFixed(1)}% de la masse salariale, ce qui est dans la norme.`
                          : presSignal === 'orange'
                          ? `Le coût du présentéisme (${(result?.presCostPctPayroll ?? 0).toFixed(1)}% de la MS) mérite une attention particulière.`
                          : `Le coût du présentéisme (${(result?.presCostPctPayroll ?? 0).toFixed(1)}% de la MS) est élevé et nécessite une action.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Points clés :</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Chaque salarié coûte en moyenne <strong>{(result?.presCostPerEmployee ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an</strong> en présentéisme.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        L'entreprise perd l'équivalent de <strong>{(result?.productivityLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours</strong> de travail par an.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>
                        Une réduction de 10% du présentéisme représenterait une économie de <strong>{((result?.presCost ?? 0) * 0.1).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an</strong>.
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <PresenteeismCalculator
            company={safeCompany}
            settings={safeSettings}
          />
        </TabsContent>

        <TabsContent value="survey" className="mt-6">
          <SurveyManagement
            companyId={safeCompany?.id ?? ''}
            companyName={safeCompany?.name ?? ''}
            employeesCount={safeCompany?.employeesCount ?? 0}
          />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <MethodComparison
            companyId={safeCompany?.id ?? ''}
            companyName={safeCompany?.name ?? ''}
            methodAResult={result}
            employeesCount={safeCompany?.employeesCount ?? 0}
            payroll={(safeCompany?.avgGrossSalary ?? 0) * (1 + (safeCompany?.employerContributionRate ?? 0)) * (safeCompany?.employeesCount ?? 0)}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <SurveyResults
            companyId={safeCompany?.id ?? ''}
            companyName={safeCompany?.name ?? ''}
            employeesCount={safeCompany?.employeesCount ?? 0}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <CsvImport companyId={safeCompany?.id ?? ''} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
