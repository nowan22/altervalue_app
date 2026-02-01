'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Building2,
  Calendar,
  Users,
  Clock,
  Info,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Calculator,
  Link2,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Brain,
  Heart,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDashboardContext } from '../../_components/dashboard-layout-client';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface SurveyType {
  id: string;
  typeId: string;
  name: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  isModular: boolean;
  estimatedDuration: number;
  anonymityThreshold: number;
}

interface Department {
  id?: string;
  code: string;
  name: string;
  headcount: number | null;
  isNew?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  PRESENTEEISM: 'Présentéisme',
  QVCT: 'QVCT',
  QVCT_BNQ: 'BNQ Ultimate',
  RPS: 'RPS',
  CLIMATE: 'Climat',
  CUSTOM: 'Personnalisé',
};

const STEPS = [
  { id: 'info', label: 'Informations', icon: ClipboardList },
  { id: 'modules', label: 'Modules', icon: Settings },
  { id: 'departments', label: 'Services', icon: Building2 },
  { id: 'config', label: 'Configuration', icon: Calculator },
  { id: 'launch', label: 'Lancement', icon: Link2 },
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { code: 'DIRECTION', name: 'Direction', headcount: null },
  { code: 'RH', name: 'Ressources Humaines', headcount: null },
  { code: 'FINANCE', name: 'Finance / Comptabilité', headcount: null },
  { code: 'COMMERCIAL', name: 'Commercial / Ventes', headcount: null },
  { code: 'TECH', name: 'IT / Tech', headcount: null },
  { code: 'PRODUCTION', name: 'Production / Opérations', headcount: null },
];

export default function CreateSurveyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentCompanyId, currentCompany, companies } = useDashboardContext();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  
  // Data loading
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    surveyTypeId: '',
    companyId: currentCompanyId || '',
    // Modules
    module2Enabled: true,
    module3Enabled: false,
    module3Consent: false,
    // ROI
    averageDailyRate: '',
    // Anonymity
    anonymityThreshold: '15',
    // Dates & targets
    targetPopulation: '',
    minRespondents: '15',
    maxRespondents: '',
    scheduledStartDate: '',
    scheduledEndDate: '',
  });

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const selectedType = surveyTypes.find(t => t.id === formData.surveyTypeId);
  const selectedCompany = companies.find(c => c.id === formData.companyId);

  // Fetch survey types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/diagnostic/types');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        setSurveyTypes(data);
        
        // Pre-select BNQ Ultimate if available
        const bnqType = data.find((t: SurveyType) => t.typeId === 'BNQ_ULTIMATE');
        if (bnqType) {
          setFormData(prev => ({ ...prev, surveyTypeId: bnqType.id }));
        }
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger les types', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  // Sync company
  useEffect(() => {
    if (currentCompanyId && !formData.companyId) {
      setFormData(prev => ({ ...prev, companyId: currentCompanyId }));
    }
  }, [currentCompanyId]);

  // Fetch departments when company changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.companyId) {
        setDepartments(DEFAULT_DEPARTMENTS.map(d => ({ ...d, isNew: true })));
        return;
      }

      setLoadingDepartments(true);
      try {
        const res = await fetch(`/api/companies/${formData.companyId}/departments`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setDepartments(data);
          } else {
            setDepartments(DEFAULT_DEPARTMENTS.map(d => ({ ...d, isNew: true })));
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments(DEFAULT_DEPARTMENTS.map(d => ({ ...d, isNew: true })));
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [formData.companyId]);

  // Calculate daily rate from company data
  useEffect(() => {
    if (selectedCompany && !formData.averageDailyRate) {
      const annualSalary = (selectedCompany as any).avgGrossSalary || 45000;
      const contributionRate = (selectedCompany as any).employerContributionRate || 45;
      const dailyRate = Math.round((annualSalary * (1 + contributionRate / 100)) / 220);
      setFormData(prev => ({ ...prev, averageDailyRate: String(dailyRate) }));
    }
  }, [selectedCompany]);

  // Update anonymity threshold when Module 3 is enabled
  useEffect(() => {
    if (formData.module3Enabled) {
      setFormData(prev => ({
        ...prev,
        anonymityThreshold: String(Math.max(parseInt(prev.anonymityThreshold) || 15, 30)),
        minRespondents: String(Math.max(parseInt(prev.minRespondents) || 15, 30)),
      }));
    }
  }, [formData.module3Enabled]);

  const handleAddDepartment = () => {
    setDepartments(prev => [
      ...prev,
      { code: '', name: '', headcount: null, isNew: true },
    ]);
  };

  const handleRemoveDepartment = (index: number) => {
    setDepartments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDepartmentChange = (index: number, field: keyof Department, value: any) => {
    setDepartments(prev =>
      prev.map((dept, i) =>
        i === index
          ? { ...dept, [field]: value, code: field === 'name' && !dept.code ? value.toUpperCase().replace(/\s+/g, '_').substring(0, 20) : dept.code }
          : dept
      )
    );
  };

  const handleSaveDepartments = async () => {
    if (!formData.companyId) return;

    try {
      const validDepts = departments.filter(d => d.code && d.name);
      const res = await fetch(`/api/companies/${formData.companyId}/departments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments: validDepts }),
      });

      if (!res.ok) throw new Error('Erreur');
      
      const saved = await res.json();
      setDepartments(saved);
      toast({ title: 'Succès', description: 'Services enregistrés' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.surveyTypeId || !formData.companyId) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // First save departments
      if (departments.length > 0) {
        await handleSaveDepartments();
      }

      // Then create campaign
      const res = await fetch('/api/surveys/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const campaign = await res.json();
      setCreatedCampaign(campaign);
      setCurrentStep(4); // Go to launch step
      toast({ title: 'Succès', description: 'Campagne créée avec succès' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getSurveyUrl = () => {
    if (!createdCampaign) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/survey/${createdCampaign.token}`;
  };

  const handleCopyLink = async () => {
    const url = getSurveyUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Copié !', description: 'Lien copié dans le presse-papier' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' });
    }
  };

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: return formData.name && formData.surveyTypeId && formData.companyId;
      case 1: return true; // Modules always valid
      case 2: return departments.filter(d => d.code && d.name).length > 0;
      case 3: return formData.averageDailyRate && formData.scheduledEndDate;
      case 4: return true;
      default: return false;
    }
  }, [currentStep, formData, departments]);

  // Access control
  if (userRole === 'OBSERVATEUR' || userRole === 'PILOTE_QVCT') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card max-w-md">
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès réservé</h3>
            <p className="text-muted-foreground">Seuls les Experts peuvent configurer les enquêtes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/diagnostic/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Configuration Campagne</h1>
          <p className="text-muted-foreground mt-1">Paramétrez votre enquête QVCT avant l'envoi</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = index <= currentStep || (index === currentStep + 1 && canProceed());
          
          return (
            <button
              key={step.id}
              onClick={() => isAccessible && setCurrentStep(index)}
              disabled={!isAccessible}
              className={cn(
                "flex flex-col items-center gap-2 transition-all",
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isActive && "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30",
                isCompleted && "bg-teal-500/20 text-teal-500",
                !isActive && !isCompleted && "bg-muted/50 text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary",
                !isActive && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Informations générales</CardTitle>
                <CardDescription>Définissez le périmètre de l'enquête</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la campagne *</Label>
                  <Input
                    id="name"
                    placeholder="ex: Diagnostic QVCT Q1 2026"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-input border-border/50 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyId">Mission *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={value => setFormData(prev => ({ ...prev, companyId: value }))}
                  >
                    <SelectTrigger className="bg-input border-border/50 h-12">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sélectionner une mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surveyTypeId">Type d'enquête *</Label>
                  {loading ? (
                    <div className="h-12 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <Select
                      value={formData.surveyTypeId}
                      onValueChange={value => setFormData(prev => ({ ...prev, surveyTypeId: value }))}
                    >
                      <SelectTrigger className="bg-input border-border/50 h-12">
                        <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {surveyTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <span>{type.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[type.category] || type.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-muted/30 rounded-xl border border-border/30"
                  >
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{selectedType.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Min. {selectedType.anonymityThreshold} réponses</span>
                      </div>
                      {selectedType.isModular && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                          <Sparkles className="h-3 w-3 mr-1" />Modulaire
                        </Badge>
                      )}
                    </div>
                    {selectedType.description && (
                      <p className="text-sm text-muted-foreground mt-3">{selectedType.description}</p>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Module Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Module 0+1: Core (always active) */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Module 0+1 : BNQ Core</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20">Obligatoire</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Consentement RGPD + 4 sphères BNQ (Habitudes de vie, Conciliation, Environnement, Pratiques)
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 8 min</span>
                        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Seuil: 15</span>
                      </div>
                    </div>
                    <Switch checked disabled className="data-[state=checked]:bg-amber-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Module 2: RPS */}
              <Card className={cn(
                "border-border/50 bg-card/80 backdrop-blur transition-all",
                formData.module2Enabled && "border-teal-500/30 bg-teal-500/5"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      formData.module2Enabled 
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Brain className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Module 2 : Pratiques de gestion (RPS)</h3>
                        <Badge variant="outline">Optionnel</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        8 dimensions RPS BNQ : charge de travail, autonomie, reconnaissance, communication...
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> +5 min</span>
                        <span>Niveaux visés : ESE, ESE+</span>
                      </div>
                    </div>
                    <Switch
                      checked={formData.module2Enabled}
                      onCheckedChange={checked => setFormData(prev => ({ ...prev, module2Enabled: checked }))}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Module 3: Santé */}
              <Card className={cn(
                "border-border/50 bg-card/80 backdrop-blur transition-all",
                formData.module3Enabled && "border-rose-500/30 bg-rose-500/5"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      formData.module3Enabled 
                        ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Heart className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Module 3 : Santé et Présentéisme</h3>
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />Sensible
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Données santé perçue, présentéisme, TMS, détresse psychologique
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> +5 min</span>
                        <span className="flex items-center gap-1 text-amber-500"><Shield className="h-3 w-3" /> Seuil: 30</span>
                      </div>
                      
                      {/* Warning box */}
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-xs text-amber-200 leading-relaxed">
                          <strong>Attention :</strong> Ce module contient des données de santé (RGPD sensible). 
                          Conditions requises : effectif ≥ 50, consentement DRH, seuil 30 répondants minimum.
                        </p>
                      </div>

                      {formData.module3Enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 flex items-center gap-3"
                        >
                          <Switch
                            id="module3Consent"
                            checked={formData.module3Consent}
                            onCheckedChange={checked => setFormData(prev => ({ ...prev, module3Consent: checked }))}
                            className="data-[state=checked]:bg-rose-500"
                          />
                          <Label htmlFor="module3Consent" className="text-sm cursor-pointer">
                            Je confirme avoir obtenu le consentement du DRH/dirigeant
                          </Label>
                        </motion.div>
                      )}
                    </div>
                    <Switch
                      checked={formData.module3Enabled}
                      onCheckedChange={checked => setFormData(prev => ({ ...prev, module3Enabled: checked, module3Consent: false }))}
                      className="data-[state=checked]:bg-rose-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Duration summary */}
              <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-xl">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  Durée estimée : {8 + (formData.module2Enabled ? 5 : 0) + (formData.module3Enabled ? 5 : 0)} minutes
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Departments */}
          {currentStep === 2 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Services / Départements</CardTitle>
                    <CardDescription>Personnalisez les options de la question Q4 (Service d'appartenance)</CardDescription>
                  </div>
                  <Button onClick={handleAddDepartment} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingDepartments ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  departments.map((dept, index) => (
                    <motion.div
                      key={dept.id || `new-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/30"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                      <Input
                        placeholder="Nom du service"
                        value={dept.name}
                        onChange={e => handleDepartmentChange(index, 'name', e.target.value)}
                        className="flex-1 bg-input border-border/50 h-10"
                      />
                      <Input
                        type="number"
                        placeholder="Effectif"
                        value={dept.headcount || ''}
                        onChange={e => handleDepartmentChange(index, 'headcount', e.target.value)}
                        className="w-24 bg-input border-border/50 h-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDepartment(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))
                )}

                {departments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun service défini</p>
                    <Button onClick={handleAddDepartment} variant="link" size="sm">
                      Ajouter un service
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  Ces services apparaîtront comme options dans la question "Quel est votre service ?" du questionnaire.
                  L'effectif est optionnel mais permet d'affiner l'analyse.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* ROI Parameters */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Paramètres ROI
                  </CardTitle>
                  <CardDescription>Pour le calcul du coût du présentéisme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="averageDailyRate">Salaire journalier moyen chargé (€) *</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="averageDailyRate"
                        type="number"
                        min={0}
                        placeholder="ex: 350"
                        value={formData.averageDailyRate}
                        onChange={e => setFormData(prev => ({ ...prev, averageDailyRate: e.target.value }))}
                        className="bg-input border-border/50 h-12 w-40"
                      />
                      <span className="text-muted-foreground">€ / jour</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calcul suggéré : (Salaire brut annuel × (1 + taux charges)) / 220 jours
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Anonymity */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-500" />
                    Seuil d'anonymat
                  </CardTitle>
                  <CardDescription>Nombre minimum de réponses pour garantir l'anonymat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={formData.module3Enabled ? 30 : 5}
                      value={formData.anonymityThreshold}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 5;
                        const min = formData.module3Enabled ? 30 : 5;
                        setFormData(prev => ({
                          ...prev,
                          anonymityThreshold: String(Math.max(val, min)),
                          minRespondents: String(Math.max(val, min)),
                        }));
                      }}
                      className="bg-input border-border/50 h-12 w-24"
                    />
                    <span className="text-muted-foreground">réponses minimum</span>
                  </div>
                  {formData.module3Enabled && (
                    <div className="flex items-center gap-2 text-amber-500 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Module 3 activé : seuil minimum de 30 réponses requis</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Période de collecte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledStartDate">Date de début</Label>
                      <Input
                        id="scheduledStartDate"
                        type="date"
                        value={formData.scheduledStartDate}
                        onChange={e => setFormData(prev => ({ ...prev, scheduledStartDate: e.target.value }))}
                        className="bg-input border-border/50 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledEndDate">Date de fin *</Label>
                      <Input
                        id="scheduledEndDate"
                        type="date"
                        required
                        value={formData.scheduledEndDate}
                        onChange={e => setFormData(prev => ({ ...prev, scheduledEndDate: e.target.value }))}
                        className="bg-input border-border/50 h-12"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetPopulation">Population cible</Label>
                      <Input
                        id="targetPopulation"
                        type="number"
                        min={0}
                        placeholder="ex: 150"
                        value={formData.targetPopulation}
                        onChange={e => setFormData(prev => ({ ...prev, targetPopulation: e.target.value }))}
                        className="bg-input border-border/50 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minRespondents">Réponses minimum</Label>
                      <Input
                        id="minRespondents"
                        type="number"
                        min={formData.module3Enabled ? 30 : 5}
                        value={formData.minRespondents}
                        onChange={e => setFormData(prev => ({ ...prev, minRespondents: e.target.value }))}
                        className="bg-input border-border/50 h-12"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Launch */}
          {currentStep === 4 && createdCampaign && (
            <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-500 via-teal-500 to-amber-500" />
              <CardContent className="p-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-3xl flex items-center justify-center"
                >
                  <CheckCircle className="h-10 w-10 text-teal-500" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-gradient-gold mb-2">Campagne créée !</h2>
                  <p className="text-muted-foreground">
                    "{createdCampaign.name}" est prête à être lancée.
                  </p>
                </div>

                {/* Survey Link */}
                <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Link2 className="h-5 w-5" />
                    <span className="font-medium">Lien de l'enquête</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                    <Input
                      readOnly
                      value={getSurveyUrl()}
                      className="bg-transparent border-0 text-center text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-teal-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* QR Code placeholder */}
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <QrCode className="h-4 w-4" />
                    <span>QR Code disponible dans les détails de la campagne</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Modules</p>
                    <p className="font-semibold">
                      {(createdCampaign.activeModules as number[])?.length || 2}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Seuil</p>
                    <p className="font-semibold">{createdCampaign.anonymityThreshold}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Durée</p>
                    <p className="font-semibold">~{8 + ((createdCampaign.activeModules as number[])?.includes(2) ? 5 : 0) + ((createdCampaign.activeModules as number[])?.includes(3) ? 5 : 0)} min</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/diagnostic/campaigns">Voir toutes les campagnes</Link>
                  </Button>
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white" asChild>
                    <Link href={`/dashboard/diagnostic/campaigns/${createdCampaign.id}`}>
                      Gérer cette campagne
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              className="bg-gradient-to-r from-teal-500 to-teal-600 text-white"
            >
              {submitting ? 'Création...' : 'Créer la campagne'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
