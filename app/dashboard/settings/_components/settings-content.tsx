"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Sliders,
  Gauge,
  BarChart3,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SECTORS, getSectorLabel } from "@/lib/sectors";

interface SettingsContentProps {
  settings: any;
  benchmarks: any[];
}

export default function SettingsContent({ settings, benchmarks }: SettingsContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const safeSettings = settings ?? {};
  const safeBenchmarks = benchmarks ?? [];

  const [coefficients, setCoefficients] = useState({
    presAbsCoefficient: (safeSettings?.presAbsCoefficient ?? 1.3).toString(),
    productivityLossCoeff: (safeSettings?.productivityLossCoeff ?? 0.33).toString(),
    workingDaysPerYear: (safeSettings?.workingDaysPerYear ?? 220).toString(),
  });

  const [thresholds, setThresholds] = useState({
    absenteeismGreenMax: (safeSettings?.absenteeismGreenMax ?? 4).toString(),
    absenteeismOrangeMax: (safeSettings?.absenteeismOrangeMax ?? 6).toString(),
    turnoverGreenMax: (safeSettings?.turnoverGreenMax ?? 10).toString(),
    turnoverOrangeMax: (safeSettings?.turnoverOrangeMax ?? 15).toString(),
    presCostGreenMaxPct: (safeSettings?.presCostGreenMaxPct ?? 5).toString(),
    presCostOrangeMaxPct: (safeSettings?.presCostOrangeMaxPct ?? 8).toString(),
  });

  const handleSaveCoefficients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presAbsCoefficient: parseFloat(coefficients.presAbsCoefficient),
          productivityLossCoeff: parseFloat(coefficients.productivityLossCoeff),
          workingDaysPerYear: parseInt(coefficients.workingDaysPerYear),
        }),
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Coefficients mis à jour" });
        router.refresh();
      } else {
        toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThresholds = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absenteeismGreenMax: parseFloat(thresholds.absenteeismGreenMax),
          absenteeismOrangeMax: parseFloat(thresholds.absenteeismOrangeMax),
          turnoverGreenMax: parseFloat(thresholds.turnoverGreenMax),
          turnoverOrangeMax: parseFloat(thresholds.turnoverOrangeMax),
          presCostGreenMaxPct: parseFloat(thresholds.presCostGreenMaxPct),
          presCostOrangeMaxPct: parseFloat(thresholds.presCostOrangeMaxPct),
        }),
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Seuils mis à jour" });
        router.refresh();
      } else {
        toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetCoefficients = () => {
    setCoefficients({
      presAbsCoefficient: '1.3',
      productivityLossCoeff: '0.33',
      workingDaysPerYear: '220',
    });
  };

  const resetThresholds = () => {
    setThresholds({
      absenteeismGreenMax: '4',
      absenteeismOrangeMax: '6',
      turnoverGreenMax: '10',
      turnoverOrangeMax: '15',
      presCostGreenMaxPct: '5',
      presCostOrangeMaxPct: '8',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configurez les coefficients et seuils de calcul</p>
      </div>

      <Tabs defaultValue="coefficients">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="coefficients">Coefficients</TabsTrigger>
          <TabsTrigger value="thresholds">Seuils couleurs</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Coefficients Tab */}
        <TabsContent value="coefficients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-500" />
                Coefficients de calcul
              </CardTitle>
              <CardDescription>
                Paramètres utilisés dans le calcul du présentéisme (Méthode A)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p>Ces coefficients impactent directement les résultats de calcul pour toutes les entreprises.</p>
                    <p className="mt-1">Les valeurs par défaut sont basées sur des études sectorielles reconnues.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="presAbsCoefficient">
                    Coefficient présentéisme/absentéisme
                  </Label>
                  <Input
                    id="presAbsCoefficient"
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={coefficients.presAbsCoefficient}
                    onChange={(e) => setCoefficients(prev => ({ ...prev, presAbsCoefficient: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Défaut : 1.3 (présentéisme = 1.3 × absentéisme)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productivityLossCoeff">
                    Coefficient perte de productivité
                  </Label>
                  <Input
                    id="productivityLossCoeff"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1"
                    value={coefficients.productivityLossCoeff}
                    onChange={(e) => setCoefficients(prev => ({ ...prev, productivityLossCoeff: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Défaut : 0.33 (33% de perte de productivité)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerYear">
                    Jours travaillés par an
                  </Label>
                  <Input
                    id="workingDaysPerYear"
                    type="number"
                    min="200"
                    max="260"
                    value={coefficients.workingDaysPerYear}
                    onChange={(e) => setCoefficients(prev => ({ ...prev, workingDaysPerYear: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Défaut : 220 jours</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={resetCoefficients}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  className="gradient-primary text-white"
                  onClick={handleSaveCoefficients}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-orange-500" />
                Seuils des signaux couleurs
              </CardTitle>
              <CardDescription>
                Définissez les seuils qui déclenchent les signaux Vert / Orange / Rouge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Absenteeism */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Absentéisme (%)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="absenteeismGreenMax" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Seuil Vert (max)
                    </Label>
                    <Input
                      id="absenteeismGreenMax"
                      type="number"
                      step="0.5"
                      value={thresholds.absenteeismGreenMax}
                      onChange={(e) => setThresholds(prev => ({ ...prev, absenteeismGreenMax: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="absenteeismOrangeMax" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Seuil Orange (max)
                    </Label>
                    <Input
                      id="absenteeismOrangeMax"
                      type="number"
                      step="0.5"
                      value={thresholds.absenteeismOrangeMax}
                      onChange={(e) => setThresholds(prev => ({ ...prev, absenteeismOrangeMax: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  🟢 Vert : ≤ {thresholds.absenteeismGreenMax}% | 🟠 Orange : {thresholds.absenteeismGreenMax}-{thresholds.absenteeismOrangeMax}% | 🔴 Rouge : &gt; {thresholds.absenteeismOrangeMax}%
                </p>
              </div>

              {/* Turnover */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Turnover (%)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="turnoverGreenMax" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Seuil Vert (max)
                    </Label>
                    <Input
                      id="turnoverGreenMax"
                      type="number"
                      step="1"
                      value={thresholds.turnoverGreenMax}
                      onChange={(e) => setThresholds(prev => ({ ...prev, turnoverGreenMax: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="turnoverOrangeMax" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Seuil Orange (max)
                    </Label>
                    <Input
                      id="turnoverOrangeMax"
                      type="number"
                      step="1"
                      value={thresholds.turnoverOrangeMax}
                      onChange={(e) => setThresholds(prev => ({ ...prev, turnoverOrangeMax: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Presenteeism Cost */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Coût présentéisme (% masse salariale)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presCostGreenMaxPct" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Seuil Vert (max)
                    </Label>
                    <Input
                      id="presCostGreenMaxPct"
                      type="number"
                      step="0.5"
                      value={thresholds.presCostGreenMaxPct}
                      onChange={(e) => setThresholds(prev => ({ ...prev, presCostGreenMaxPct: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presCostOrangeMaxPct" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Seuil Orange (max)
                    </Label>
                    <Input
                      id="presCostOrangeMaxPct"
                      type="number"
                      step="0.5"
                      value={thresholds.presCostOrangeMaxPct}
                      onChange={(e) => setThresholds(prev => ({ ...prev, presCostOrangeMaxPct: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={resetThresholds}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  className="gradient-primary text-white"
                  onClick={handleSaveThresholds}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Benchmarks sectoriels
              </CardTitle>
              <CardDescription>
                Valeurs de référence par secteur d'activité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium">Secteur</th>
                      <th className="px-4 py-3 text-left font-medium">Absentéisme (%)</th>
                      <th className="px-4 py-3 text-left font-medium">Turnover (%)</th>
                      <th className="px-4 py-3 text-left font-medium">Ancienneté (ans)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECTORS.map((sector) => {
                      const benchmark = safeBenchmarks.find(b => b?.sector === sector.value);
                      return (
                        <tr key={sector.value} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{sector.label}</td>
                          <td className="px-4 py-3">
                            {benchmark ? `${benchmark.absenteeismMin}-${benchmark.absenteeismMax}%` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {benchmark ? `${benchmark.turnoverMin}-${benchmark.turnoverMax}%` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {benchmark ? `${benchmark.avgSeniorityYears} ans` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Les benchmarks sont utilisés pour comparer les KPI des entreprises aux moyennes sectorielles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
