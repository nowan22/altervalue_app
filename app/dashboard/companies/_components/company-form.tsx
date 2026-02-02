"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Building2,
  Save,
  ArrowLeft,
  Users,
  Euro,
  Percent,
  Info,
  Dices,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTORS, SECTOR_DEFAULTS } from "@/lib/sectors";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface CompanyFormProps {
  company?: any;
  isEdit?: boolean;
}

export default function CompanyForm({ company, isEdit = false }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(false);

  // v4.2: Check if user is SUPER_ADMIN for demo mode checkbox
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';

  const [formData, setFormData] = useState({
    name: company?.name ?? "",
    sector: company?.sector ?? "",
    country: company?.country ?? "France",
    employeesCount: company?.employeesCount?.toString?.() ?? "",
    avgGrossSalary: company?.avgGrossSalary?.toString?.() ?? "35000",
    employerContributionRate: ((company?.employerContributionRate ?? 0.45) * 100).toString(),
    absenteeismRate: company?.absenteeismRate?.toString?.() ?? "",
  });

  // v4.2: Demo mode state (only for SUPER_ADMIN)
  const [isDemo, setIsDemo] = useState(company?.isDemo ?? false);

  // Auto-fill sector defaults
  useEffect(() => {
    if (formData.sector && !isEdit) {
      const defaults = SECTOR_DEFAULTS[formData.sector];
      if (defaults && !formData.absenteeismRate) {
        setFormData(prev => ({
          ...prev,
          absenteeismRate: defaults.absenteeismRate.toString(),
        }));
      }
    }
  }, [formData.sector, isEdit, formData.absenteeismRate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        sector: formData.sector,
        country: formData.country,
        employeesCount: parseInt(formData.employeesCount),
        avgGrossSalary: parseFloat(formData.avgGrossSalary),
        employerContributionRate: parseFloat(formData.employerContributionRate) / 100,
        absenteeismRate: parseFloat(formData.absenteeismRate),
      };

      // v4.2: Include isDemo only if SUPER_ADMIN
      if (isSuperAdmin) {
        payload.isDemo = isDemo;
      }

      const url = isEdit ? `/api/companies/${company?.id ?? ''}` : '/api/companies';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: isEdit ? "Dossier mis à jour" : "Dossier créé avec succès",
        });
        // Redirect to my-mission for new companies, or back to list for edits
        router.push(isEdit ? '/dashboard/companies' : '/dashboard/my-mission');
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error?.error ?? "Une erreur s'est produite",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>{isEdit ? "Modifier le dossier" : "Nouveau dossier entreprise"}</CardTitle>
              <CardDescription>
                {isEdit
                  ? "Mettez à jour les informations de l'entreprise"
                  : "Renseignez les informations de l'entreprise pour calculer le coût du présentéisme"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informations générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    Nom de l'entreprise *
                    <HelpTooltip tooltipKey="company_form_name" iconSize={13} />
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Acme Corp"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector" className="flex items-center gap-1.5">
                    Secteur d'activité *
                    <HelpTooltip tooltipKey="company_form_sector" iconSize={13} />
                  </Label>
                  <Select
                    value={formData.sector}
                    onValueChange={(value) => handleChange('sector', value)}
                    required
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
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    placeholder="France"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeesCount" className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Effectif *
                    <HelpTooltip tooltipKey="company_form_employees" iconSize={13} />
                  </Label>
                  <Input
                    id="employeesCount"
                    type="number"
                    min="1"
                    placeholder="Ex: 150"
                    value={formData.employeesCount}
                    onChange={(e) => handleChange('employeesCount', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Données financières
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avgGrossSalary" className="flex items-center gap-1.5">
                    Salaire brut moyen (€/an) *
                    <HelpTooltip tooltipKey="company_form_salary" iconSize={13} />
                  </Label>
                  <Input
                    id="avgGrossSalary"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="35000"
                    value={formData.avgGrossSalary}
                    onChange={(e) => handleChange('avgGrossSalary', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Salaire brut annuel moyen par salarié</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employerContributionRate" className="flex items-center gap-1.5">
                    Taux de charges patronales (%) *
                    <HelpTooltip tooltipKey="company_form_contributions" iconSize={13} />
                  </Label>
                  <Input
                    id="employerContributionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="45"
                    value={formData.employerContributionRate}
                    onChange={(e) => handleChange('employerContributionRate', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Généralement entre 40% et 50%</p>
                </div>
              </div>
            </div>

            {/* KPI Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Indicateurs RH
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="absenteeismRate" className="flex items-center gap-1.5">
                    Taux d'absentéisme (%) *
                    <HelpTooltip tooltipKey="company_form_absenteeism" iconSize={13} />
                  </Label>
                  <Input
                    id="absenteeismRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="5.0"
                    value={formData.absenteeismRate}
                    onChange={(e) => handleChange('absenteeismRate', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Moyenne nationale : 5-6%. Auto-rempli selon le secteur.
                  </p>
                </div>
              </div>

              {formData.sector && SECTOR_DEFAULTS[formData.sector] && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-medium">Valeurs de référence pour ce secteur :</p>
                    <ul className="mt-1 space-y-1">
                      <li>Absentéisme moyen : {SECTOR_DEFAULTS[formData.sector].absenteeismRate}%</li>
                      <li>Turnover moyen : {SECTOR_DEFAULTS[formData.sector].turnoverRate}%</li>
                      <li>Ancienneté moyenne : {SECTOR_DEFAULTS[formData.sector].avgSeniorityYears} ans</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* v4.2: Demo Mode - Only for SUPER_ADMIN */}
            {isSuperAdmin && (
              <div className="space-y-4 pt-4 border-t border-amber-500/30">
                <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Dices className="h-4 w-4" />
                  Mode Démonstration
                </h3>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <p className="font-medium">Option réservée aux Super-Administrateurs</p>
                      <p className="mt-1 text-amber-600 dark:text-amber-400">
                        Les missions démo permettent de tester les fonctionnalités avec des données fictives. 
                        Elles sont exclues des statistiques et benchmarks globaux.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="isDemo"
                      checked={isDemo}
                      onCheckedChange={(checked) => setIsDemo(checked === true)}
                      className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <Label 
                      htmlFor="isDemo" 
                      className="text-sm font-medium text-amber-700 dark:text-amber-300 cursor-pointer"
                    >
                      Mission de démonstration (données fictives à des fins de test/démo)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? "Mettre à jour" : "Créer le dossier"}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
