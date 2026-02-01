'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Settings,
  Users,
  Calculator,
  Shield,
  Building2,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  activeModules: number[];
  moduleConfig: Record<string, any>;
  customServices: Array<{ code: string; label: string; headcount?: number }>;
  anonymityThreshold: number;
  module3Enabled: boolean;
  module3Consent: boolean;
  targetPopulation: number | null;
  minRespondents: number;
  maxRespondents: number | null;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  company: {
    id: string;
    name: string;
    employeesCount: number;
    avgGrossSalary: number;
    departments: Array<{ code: string; name: string; headcount: number | null; isActive: boolean }>;
  };
  surveyType: {
    id: string;
    typeId: string;
    name: string;
    isModular: boolean;
    definition: any;
  };
}

const STEPS = [
  { id: 'modules', label: 'Modules', icon: Settings },
  { id: 'services', label: 'Services', icon: Building2 },
  { id: 'roi', label: 'Paramètres ROI', icon: Calculator },
  { id: 'anonymity', label: 'Anonymat', icon: Shield },
];

export default function ConfigureWizardPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const { toast } = useToast();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [module2Enabled, setModule2Enabled] = useState(false);
  const [module3Enabled, setModule3Enabled] = useState(false);
  const [module3Consent, setModule3Consent] = useState(false);
  const [averageDailyRate, setAverageDailyRate] = useState('');
  const [anonymityThreshold, setAnonymityThreshold] = useState(15);
  const [customServices, setCustomServices] = useState<Array<{ code: string; label: string; headcount?: number }>>([]);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledEndDate, setScheduledEndDate] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('');
  const [minRespondents, setMinRespondents] = useState('15');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/surveys/configure?campaignId=${campaignId}`);
        if (!res.ok) throw new Error('Campagne non trouvée');
        const data = await res.json();
        setCampaign(data);

        // Initialize form with existing data
        const activeModules = data.activeModules || [0, 1];
        setModule2Enabled(activeModules.includes(2));
        setModule3Enabled(activeModules.includes(3) || data.module3Enabled);
        setModule3Consent(data.module3Consent || false);
        setAverageDailyRate(data.moduleConfig?.roi?.averageDailyRate?.toString() || '');
        setAnonymityThreshold(data.anonymityThreshold || 15);
        setCustomServices(data.customServices || []);
        setScheduledStartDate(data.scheduledStartDate?.split('T')[0] || '');
        setScheduledEndDate(data.scheduledEndDate?.split('T')[0] || '');
        setTargetPopulation(data.targetPopulation?.toString() || '');
        setMinRespondents(data.minRespondents?.toString() || '15');

        // If no custom services, pre-fill from company departments
        if (!data.customServices?.length && data.company.departments?.length > 0) {
          setCustomServices(
            data.company.departments
              .filter((d: any) => d.isActive)
              .map((d: any) => ({
                code: d.code,
                label: d.name,
                headcount: d.headcount,
              }))
          );
        }
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger la campagne', variant: 'destructive' });
        router.push('/dashboard/diagnostic/campaigns');
      } finally {
        setLoading(false);
      }
    };
    if (campaignId) fetchCampaign();
  }, [campaignId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/surveys/configure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          module2Enabled,
          module3Enabled,
          module3Consent,
          averageDailyRate: averageDailyRate || undefined,
          anonymityThreshold,
          customServices,
          scheduledStartDate: scheduledStartDate || undefined,
          scheduledEndDate: scheduledEndDate || undefined,
          targetPopulation: targetPopulation || undefined,
          minRespondents,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      toast({ title: 'Succès', description: 'Configuration sauvegardée' });
      router.push(`/dashboard/diagnostic/campaigns/${campaignId}`);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Access control
  if (!['SUPER_ADMIN', 'EXPERT'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
            <p className="text-muted-foreground">Seuls les Experts et Super-Admins peuvent configurer les campagnes BNQ.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Campagne non trouvée</h3>
            <Button asChild variant="outline">
              <Link href="/dashboard/diagnostic/campaigns">Retour aux campagnes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if campaign is BNQ type
  const isBNQType = campaign.surveyType.typeId === 'BNQ_ULTIMATE' || campaign.surveyType.isModular;
  if (!isBNQType) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card max-w-md">
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuration non disponible</h3>
            <p className="text-muted-foreground mb-4">Cette campagne n'est pas de type BNQ Ultimate et ne nécessite pas de configuration avancée.</p>
            <Button asChild variant="outline">
              <Link href={`/dashboard/diagnostic/campaigns/${campaignId}`}>Voir la campagne</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/diagnostic/campaigns/${campaignId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Configuration BNQ Ultimate</h1>
          <p className="text-muted-foreground mt-1">{campaign.name} • {campaign.company.name}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {campaign.status}
        </Badge>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'bg-success/10 text-success'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {currentStep === 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Modules du questionnaire
              </CardTitle>
              <CardDescription>Sélectionnez les modules à inclure dans l'enquête</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Module 0 & 1 - Always active */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Module 0 - Consentement RGPD</p>
                    <p className="text-sm text-muted-foreground">Obligatoire • 30 sec</p>
                  </div>
                  <Badge>Activé</Badge>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Module 1 - Priorisation BNQ (Core)</p>
                    <p className="text-sm text-muted-foreground">Obligatoire • 8 min</p>
                  </div>
                  <Badge>Activé</Badge>
                </div>
              </div>

              {/* Module 2 - Optional */}
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Module 2 - Analyse RPS approfondie</p>
                    <p className="text-sm text-muted-foreground">Optionnel • 3 min</p>
                    <p className="text-xs text-muted-foreground mt-1">Évaluation détaillée des risques psychosociaux</p>
                  </div>
                  <Switch checked={module2Enabled} onCheckedChange={setModule2Enabled} />
                </div>
              </div>

              {/* Module 3 - Special */}
              <div className={`p-4 rounded-lg border ${
                module3Enabled ? 'border-warning/50 bg-warning/5' : 'border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Module 3 - Données de santé (sensibles)</p>
                    <p className="text-sm text-muted-foreground">Optionnel • 3 min • Seuil anonymat: 30</p>
                    <p className="text-xs text-muted-foreground mt-1">TMS, burn-out, absentéisme personnel</p>
                  </div>
                  <Switch checked={module3Enabled} onCheckedChange={setModule3Enabled} />
                </div>
                {module3Enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 bg-warning/10 rounded-lg"
                  >
                    <Alert variant="destructive" className="bg-transparent border-0 p-0">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Le Module 3 contient des données sensibles. Le seuil d'anonymat sera automatiquement relevé à 30 réponses minimum.
                        {campaign.company.employeesCount < 50 && (
                          <span className="block mt-2 font-medium text-error">
                            ⚠️ Attention: L'effectif de l'entreprise ({campaign.company.employeesCount}) est inférieur à 50. Le lancement peut être bloqué.
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2 mt-3">
                      <Switch checked={module3Consent} onCheckedChange={setModule3Consent} />
                      <Label className="text-sm">Je confirme avoir informé les répondants du traitement de données sensibles</Label>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Services / Départements
              </CardTitle>
              <CardDescription>Personnalisez les services pour l'analyse par segments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun service configuré.</p>
                  <p className="text-sm mt-2">Les services peuvent être ajoutés depuis la page de la mission.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/dashboard/companies/${campaign.company.id}`}>Gérer les services</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {customServices.map((service, index) => (
                    <div key={service.code} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{service.label}</p>
                        <p className="text-xs text-muted-foreground">Code: {service.code}</p>
                      </div>
                      {service.headcount && (
                        <Badge variant="outline">{service.headcount} personnes</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Paramètres ROI Présentéisme
              </CardTitle>
              <CardDescription>Configurez les paramètres pour le calcul du coût du présentéisme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="avgDailyRate">Coût journalier moyen (€)</Label>
                  <Input
                    id="avgDailyRate"
                    type="number"
                    min={0}
                    placeholder="ex: 350"
                    value={averageDailyRate}
                    onChange={e => setAverageDailyRate(e.target.value)}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Salaire brut annuel / jours travaillés. Par défaut: {Math.round(campaign.company.avgGrossSalary / 218)}€
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPop">Population cible</Label>
                  <Input
                    id="targetPop"
                    type="number"
                    min={0}
                    placeholder={campaign.company.employeesCount.toString()}
                    value={targetPopulation}
                    onChange={e => setTargetPopulation(e.target.value)}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Effectif de l'entreprise: {campaign.company.employeesCount}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Formule de calcul</h4>
                <p className="text-sm text-muted-foreground">
                  Coût présentéisme = Taux présentéisme × Coût journalier × Jours travaillés × Effectif
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Paramètres d'anonymat
              </CardTitle>
              <CardDescription>Configurez le seuil d'anonymat et les dates de la campagne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="threshold">Seuil d'anonymat (réponses minimum)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={module3Enabled ? 30 : 5}
                  value={anonymityThreshold}
                  onChange={e => setAnonymityThreshold(parseInt(e.target.value) || 15)}
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  {module3Enabled
                    ? 'Minimum 30 réponses requis (Module 3 activé)'
                    : 'Minimum recommandé: 15 réponses'}
                </p>
              </div>

              {anonymityThreshold > (targetPopulation ? parseInt(targetPopulation) : campaign.company.employeesCount) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Le seuil d'anonymat ({anonymityThreshold}) dépasse la population cible ({targetPopulation || campaign.company.employeesCount}). L'enquête ne pourra pas être analysée.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={scheduledStartDate}
                    onChange={e => setScheduledStartDate(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={scheduledEndDate}
                    onChange={e => setScheduledEndDate(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minResp">Réponses minimum</Label>
                <Input
                  id="minResp"
                  type="number"
                  min={5}
                  value={minRespondents}
                  onChange={e => setMinRespondents(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/diagnostic/campaigns/${campaignId}`}>Annuler</Link>
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sauvegarder la configuration
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
