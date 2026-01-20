"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Sliders,
  RotateCcw,
  Info,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTORS, SECTOR_DEFAULTS } from "@/lib/sectors";
import { calculatePresenteeism, PresenteeismResult } from "@/lib/presenteeism-calculator";

interface CalculatorContentProps {
  settings: any;
}

export default function CalculatorContent({ settings }: CalculatorContentProps) {
  const safeSettings = settings ?? {};

  const [params, setParams] = useState({
    sector: '',
    employeesCount: '100',
    avgGrossSalary: '35000',
    employerContributionRate: '45',
    absenteeismRate: '5',
    presAbsCoefficient: (safeSettings?.presAbsCoefficient ?? 1.3).toString(),
    productivityLossCoeff: (safeSettings?.productivityLossCoeff ?? 0.33).toString(),
    workingDaysPerYear: (safeSettings?.workingDaysPerYear ?? 220).toString(),
  });

  const [result, setResult] = useState<PresenteeismResult | null>(null);

  useEffect(() => {
    if (params.sector && SECTOR_DEFAULTS[params.sector]) {
      const defaults = SECTOR_DEFAULTS[params.sector];
      setParams(prev => ({
        ...prev,
        absenteeismRate: defaults.absenteeismRate.toString(),
      }));
    }
  }, [params.sector]);

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
      sector: '',
      employeesCount: '100',
      avgGrossSalary: '35000',
      employerContributionRate: '45',
      absenteeismRate: '5',
      presAbsCoefficient: '1.3',
      productivityLossCoeff: '0.33',
      workingDaysPerYear: '220',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calculateur de présentéisme</h1>
        <p className="text-gray-600 mt-1">Estimez rapidement le coût du présentéisme pour n'importe quelle entreprise</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Données de l'entreprise
              </CardTitle>
              <CardDescription>
                Renseignez les informations pour calculer le coût du présentéisme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur d'activité</Label>
                  <Select
                    value={params.sector}
                    onValueChange={(value) => handleChange('sector', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          {sector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeesCount">Effectif</Label>
                  <Input
                    id="employeesCount"
                    type="number"
                    min="1"
                    value={params.employeesCount}
                    onChange={(e) => handleChange('employeesCount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avgGrossSalary">Salaire brut moyen (€/an)</Label>
                  <Input
                    id="avgGrossSalary"
                    type="number"
                    min="0"
                    value={params.avgGrossSalary}
                    onChange={(e) => handleChange('avgGrossSalary', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employerContributionRate">Charges patronales (%)</Label>
                  <Input
                    id="employerContributionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={params.employerContributionRate}
                    onChange={(e) => handleChange('employerContributionRate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="absenteeismRate">Taux d'absentéisme (%)</Label>
                  <Input
                    id="absenteeismRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={params.absenteeismRate}
                    onChange={(e) => handleChange('absenteeismRate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-500" />
                Paramètres avancés
              </CardTitle>
              <CardDescription>
                Ajustez les coefficients de calcul si nécessaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presAbsCoefficient">Coeff. prés./abs.</Label>
                  <Input
                    id="presAbsCoefficient"
                    type="number"
                    step="0.1"
                    value={params.presAbsCoefficient}
                    onChange={(e) => handleChange('presAbsCoefficient', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Défaut: 1.3</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productivityLossCoeff">Coeff. perte prod.</Label>
                  <Input
                    id="productivityLossCoeff"
                    type="number"
                    step="0.01"
                    value={params.productivityLossCoeff}
                    onChange={(e) => handleChange('productivityLossCoeff', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Défaut: 0.33</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerYear">Jours/an</Label>
                  <Input
                    id="workingDaysPerYear"
                    type="number"
                    value={params.workingDaysPerYear}
                    onChange={(e) => handleChange('workingDaysPerYear', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Défaut: 220</p>
                </div>
              </div>

              <Button variant="outline" onClick={resetToDefaults} size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <>
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-blue-100 text-sm">Coût annuel du présentéisme</p>
                  <motion.p
                    key={result.presCost}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold mt-2"
                  >
                    {(result?.presCost ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </motion.p>
                  <p className="text-blue-100 mt-2 text-sm">
                    {(result?.presCostPctPayroll ?? 0).toFixed(2)}% de la masse salariale
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résultats détaillés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Taux de présentéisme</span>
                    <span className="font-semibold">{(result?.presRate ?? 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Jours de présentéisme</span>
                    <span className="font-semibold">{(result?.presDays ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Perte de productivité</span>
                    <span className="font-semibold">{(result?.productivityLoss ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} jours</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Coût par salarié</span>
                    <span className="font-semibold text-blue-600">
                      {(result?.presCostPerEmployee ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Potentiel d'économie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Réduction de 10%</p>
                    <p className="text-xl font-bold text-green-600">
                      {((result?.presCost ?? 0) * 0.1).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Réduction de 25%</p>
                    <p className="text-xl font-bold text-green-600">
                      {((result?.presCost ?? 0) * 0.25).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
