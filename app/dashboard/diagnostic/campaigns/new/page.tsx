'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  Calendar,
  Users,
  Clock,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDashboardContext } from '../../../_components/dashboard-layout-client';
import { useSession } from 'next-auth/react';

interface SurveyType {
  id: string;
  typeId: string;
  name: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  estimatedDuration: number;
  anonymityThreshold: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  PRESENTEEISM: 'Présentéisme',
  QVCT: 'QVCT',
  RPS: 'RPS',
  CLIMATE: 'Climat',
  CUSTOM: 'Personnalisé',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentCompanyId, currentCompany, companies } = useDashboardContext();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';

  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    surveyTypeId: '',
    companyId: currentCompanyId || '',
    targetPopulation: '',
    minRespondents: '15',
    maxRespondents: '',
    scheduledStartDate: '',
    scheduledEndDate: '',
  });

  const selectedType = surveyTypes.find(t => t.id === formData.surveyTypeId);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/diagnostic/types');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        setSurveyTypes(data);
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger les types d\'enquêtes', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (currentCompanyId && !formData.companyId) {
      setFormData(prev => ({ ...prev, companyId: currentCompanyId }));
    }
  }, [currentCompanyId]);

  useEffect(() => {
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        minRespondents: String(selectedType.anonymityThreshold),
      }));
    }
  }, [selectedType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.surveyTypeId || !formData.companyId) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/diagnostic/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetPopulation: formData.targetPopulation ? parseInt(formData.targetPopulation) : null,
          minRespondents: parseInt(formData.minRespondents) || 15,
          maxRespondents: formData.maxRespondents ? parseInt(formData.maxRespondents) : null,
          scheduledStartDate: formData.scheduledStartDate || null,
          scheduledEndDate: formData.scheduledEndDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const campaign = await res.json();
      toast({ title: 'Succès', description: 'Campagne créée avec succès' });
      router.push(`/dashboard/diagnostic/campaigns/${campaign.id}`);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole === 'OBSERVATEUR') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card max-w-md">
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
            <p className="text-muted-foreground">Les observateurs ne peuvent pas créer de campagnes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/diagnostic/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Nouvelle campagne</h1>
          <p className="text-muted-foreground mt-1">Configurez et lancez une nouvelle enquête</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne *</Label>
              <Input
                id="name"
                placeholder="ex: Diagnostic Q1 2026"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">Mission *</Label>
              <Select
                value={formData.companyId}
                onValueChange={value => setFormData(prev => ({ ...prev, companyId: value }))}
              >
                <SelectTrigger className="bg-input border-border">
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
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                <Select
                  value={formData.surveyTypeId}
                  onValueChange={value => setFormData(prev => ({ ...prev, surveyTypeId: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
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
                className="p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedType.estimatedDuration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Min. {selectedType.anonymityThreshold} réponses</span>
                  </div>
                </div>
                {selectedType.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedType.description}</p>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
            <CardDescription>Paramètres de la campagne</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetPopulation">Population cible</Label>
                <Input
                  id="targetPopulation"
                  type="number"
                  placeholder="ex: 150"
                  value={formData.targetPopulation}
                  onChange={e => setFormData(prev => ({ ...prev, targetPopulation: e.target.value }))}
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">Nombre de personnes invitées</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minRespondents">Réponses minimum *</Label>
                <Input
                  id="minRespondents"
                  type="number"
                  value={formData.minRespondents}
                  onChange={e => setFormData(prev => ({ ...prev, minRespondents: e.target.value }))}
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">Seuil d'anonymat</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRespondents">Réponses maximum (optionnel)</Label>
              <Input
                id="maxRespondents"
                type="number"
                placeholder="Illimité"
                value={formData.maxRespondents}
                onChange={e => setFormData(prev => ({ ...prev, maxRespondents: e.target.value }))}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">Laisser vide pour illimité</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledStartDate">Date de début</Label>
                <Input
                  id="scheduledStartDate"
                  type="date"
                  value={formData.scheduledStartDate}
                  onChange={e => setFormData(prev => ({ ...prev, scheduledStartDate: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledEndDate">Date de fin</Label>
                <Input
                  id="scheduledEndDate"
                  type="date"
                  value={formData.scheduledEndDate}
                  onChange={e => setFormData(prev => ({ ...prev, scheduledEndDate: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/diagnostic/campaigns">Annuler</Link>
          </Button>
          <Button type="submit" disabled={submitting} className="bg-gradient-gold text-primary-foreground">
            {submitting ? 'Création...' : 'Créer la campagne'}
          </Button>
        </div>
      </form>
    </div>
  );
}
