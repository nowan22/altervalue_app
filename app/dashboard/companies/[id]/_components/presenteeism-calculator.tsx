"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Sliders,
  RotateCcw,
  Download,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculatePresenteeism, PresenteeismResult } from "@/lib/presenteeism-calculator";

interface PresenteeismCalculatorProps {
  company: any;
  settings: any;
}

export default function PresenteeismCalculator({ company, settings }: PresenteeismCalculatorProps) {
  const safeCompany = company ?? {};
  const safeSettings = settings ?? {};

  const [params, setParams] = useState({
    employeesCount: safeCompany?.employeesCount?.toString?.() ?? '100',
    avgGrossSalary: safeCompany?.avgGrossSalary?.toString?.() ?? '35000',
    employerContributionRate: ((safeCompany?.employerContributionRate ?? 0.45) * 100).toString(),
    absenteeismRate: safeCompany?.absenteeismRate?.toString?.() ?? '5',
    presAbsCoefficient: (safeSettings?.presAbsCoefficient ?? 1.3).toString(),
    productivityLossCoeff: (safeSettings?.productivityLossCoeff ?? 0.33).toString(),
    workingDaysPerYear: (safeSettings?.workingDaysPerYear ?? 220).toString(),
  });

  const [result, setResult] = useState<PresenteeismResult | null>(null);

  useEffect(() => {
    try {
      const calcResult = calculatePresenteeism({
        employeesCount: parseInt(params.employeesCount) || 0,
        avgGrossSalary: parseFloat(params.avgGrossSalary) || 0,
        employerContributionRate: (parseFloat(params.employerContributionRate) || 0) / 100,
        absenteeismRate: parseFloat(params.absenteeismRate) || 0,
        presAbsCoefficient: parseFloat(params.presAbsCoefficient) || 1.3,
        productivityLossCoeff: parseFloat(params.productivityLossCoeff) || 0.33,
        workingDaysPerYear: parseInt(params.workingDaysPerYear) || 220,
      });
      setResult(calcResult);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [params]);

  const handleChange = (field: string, value: string) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setParams({
      employeesCount: safeCompany?.employeesCount?.toString?.() ?? '100',
      avgGrossSalary: safeCompany?.avgGrossSalary?.toString?.() ?? '35000',
      employerContributionRate: ((safeCompany?.employerContributionRate ?? 0.45) * 100).toString(),
      absenteeismRate: safeCompany?.absenteeismRate?.toString?.() ?? '5',
      presAbsCoefficient: '1.3',
      productivityLossCoeff: '0.33',
      workingDaysPerYear: '220',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-500" />
              Paramètres de simulation
            </CardTitle>
            <CardDescription>
              Ajustez les valeurs pour simuler différents scénarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Données entreprise</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeesCount">Effectif</Label>
                  <Input
                    id="employeesCount"
                    type="number"
                    value={params.employeesCount}
                    onChange={(e) => handleChange('employeesCount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgGrossSalary">Salaire brut moyen (€)</Label>
                  <Input
                    id="avgGrossSalary"
                    type="number"
                    value={params.avgGrossSalary}
                    onChange={(e) => handleChange('avgGrossSalary', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employerContributionRate">Charges patronales (%)</Label>
                  <Input
                    id="employerContributionRate"
                    type="number"
                    value={params.employerContributionRate}
                    onChange={(e) => handleChange('employerContributionRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="absenteeismRate">Taux absentéisme (%)</Label>
                  <Input
                    id="absenteeismRate"
                    type="number"
                    step="0.1"
                    value={params.absenteeismRate}
                    onChange={(e) => handleChange('absenteeismRate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Coefficients */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-foreground">Coefficients de calcul</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presAbsCoefficient" className="flex items-center gap-2">
                    Coefficient présentéisme/absentéisme
                    <span className="text-xs text-muted-foreground">(défaut: 1.3)</span>
                  </Label>
                  <Input
                    id="presAbsCoefficient"
                    type="number"
                    step="0.1"
                    value={params.presAbsCoefficient}
                    onChange={(e) => handleChange('presAbsCoefficient', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productivityLossCoeff" className="flex items-center gap-2">
                    Coefficient perte de productivité
                    <span className="text-xs text-muted-foreground">(défaut: 0.33)</span>
                  </Label>
                  <Input
                    id="productivityLossCoeff"
                    type="number"
                    step="0.01"
                    value={params.productivityLossCoeff}
                    onChange={(e) => handleChange('productivityLossCoeff', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerYear" className="flex items-center gap-2">
                    Jours travaillés par an
                    <span className="text-xs text-muted-foreground">(défaut: 220)</span>
                  </Label>
                  <Input
                    id="workingDaysPerYear"
                    type="number"
                    value={params.workingDaysPerYear}
                    onChange={(e) => handleChange('workingDaysPerYear', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={resetToDefaults} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser aux valeurs par défaut
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-500" />
              Résultats du calcul
            </CardTitle>
            <CardDescription>
              Coût du présentéisme selon la Méthode A (Macro)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result && (
              <>
                {/* Main Result */}
                <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white text-center">
                  <p className="text-blue-100 text-sm">Coût annuel du présentéisme</p>
                  <motion.p
                    key={result.presCost}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold mt-2"
                  >
                    {(result?.presCost ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </motion.p>
                  <p className="text-blue-100 mt-2">
                    {(result?.presCostPctPayroll ?? 0).toFixed(2)}% de la masse salariale
                  </p>
                </div>

                {/* Intermediate Results */}
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Taux de présentéisme</span>
                    <span className="font-semibold">{(result?.presRate ?? 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Jours de présentéisme</span>
                    <span className="font-semibold">{(result?.presDays ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Perte de productivité</span>
                    <span className="font-semibold">{(result?.productivityLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Coût par salarié</span>
                    <span className="font-semibold">{(result?.presCostPerEmployee ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Données calculées :</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Salaire chargé : {(result?.avgTotalSalary ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</li>
                        <li>• Masse salariale : {((result?.payroll ?? 0) / 1000000).toFixed(2)} M€</li>
                        <li>• Coût journalier : {(result?.dailySalary ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formula Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Formules de calcul (Méthode A)</CardTitle>
          <CardDescription>Détail des formules utilisées pour le calcul du présentéisme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">1. Taux de présentéisme</h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                Taux absentéisme × Coefficient prés./abs.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Le coefficient de 1.3 signifie que le présentéisme est estimé à 1.3× l'absentéisme.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">2. Jours de présentéisme</h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                Taux présentéisme × Effectif × 220 jours
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Nombre total de jours où des salariés sont présents mais à productivité réduite.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">3. Perte de productivité</h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                Jours présentéisme × Coeff. perte productivité
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Le coefficient de 0.33 signifie 33% de perte de productivité en moyenne.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">4. Coût du présentéisme</h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                Perte productivité × Salaire chargé / 220
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Coût économique annuel de la perte de productivité liée au présentéisme.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
