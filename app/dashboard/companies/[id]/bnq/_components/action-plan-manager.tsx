'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Heart,
  Scale,
  Building2,
  UserCog,
  FileText,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  ACTIVITY_SPHERE_LABELS,
  PRIORITY_LABELS,
  INTERVENTION_STATUS_LABELS,
  BNQ_LEVEL_REQUIREMENTS,
} from '@/lib/bnq-requirements';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { BnqLevel, ActivitySphere, Priority, InterventionStatus } from '@prisma/client';

interface Intervention {
  id: string;
  title: string;
  description: string | null;
  sphere: ActivitySphere;
  priority: Priority;
  status: InterventionStatus;
  addressesPriority: boolean;
  responsiblePerson: string | null;
  responsibleRole: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  actualEndDate: string | null;
  budget: number | null;
  actualCost: number | null;
  targetParticipation: number | null;
  actualParticipation: number | null;
  satisfactionScore: number | null;
  expectedOutcome: string | null;
  actualOutcome: string | null;
  progressNotes: string | null;
}

interface ActionPlan {
  id: string;
  year: number;
  title: string;
  description: string | null;
  status: string;
  targetLevel: BnqLevel;
  minInterventions: number;
  minPriorities: number;
  minPratiquesGestion: number;
  approvedBy: string | null;
  approvedAt: string | null;
  interventions: Intervention[];
}

interface ActionPlanManagerProps {
  companyId: string;
  companyName: string;
  targetLevel: BnqLevel;
}

const SPHERE_ICONS = {
  HABITUDES_VIE: Heart,
  CONCILIATION_TRAVAIL: Scale,
  ENVIRONNEMENT_TRAVAIL: Building2,
  PRATIQUES_GESTION: UserCog,
};

export function ActionPlanManager({ companyId, companyName, targetLevel }: ActionPlanManagerProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  
  // Dialog states
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateInterventionOpen, setIsCreateInterventionOpen] = useState(false);
  const [isEditInterventionOpen, setIsEditInterventionOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newPlanYear, setNewPlanYear] = useState(new Date().getFullYear());
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [interventionForm, setInterventionForm] = useState<Partial<Intervention>>({
    sphere: 'HABITUDES_VIE',
    priority: 'MEDIUM',
    addressesPriority: false,
  });

  // Fetch action plans
  useEffect(() => {
    fetchPlans();
  }, [companyId]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/bnq/companies/${companyId}/action-plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
        // Auto-expand current year plan
        const currentYearPlan = data.find((p: ActionPlan) => p.year === new Date().getFullYear());
        if (currentYearPlan) {
          setExpandedPlans([currentYearPlan.id]);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create action plan
  const handleCreatePlan = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/bnq/companies/${companyId}/action-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: newPlanYear,
          title: newPlanTitle || `Plan d'action santé mieux-être ${newPlanYear}`,
          targetLevel,
        }),
      });

      if (response.ok) {
        toast({ title: 'Plan créé', description: `Plan d'action ${newPlanYear} créé avec succès` });
        setIsCreatePlanOpen(false);
        setNewPlanYear(new Date().getFullYear());
        setNewPlanTitle('');
        fetchPlans();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Create intervention
  const handleCreateIntervention = async () => {
    if (!selectedPlan || !interventionForm.title) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/bnq/action-plans/${selectedPlan.id}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interventionForm),
      });

      if (response.ok) {
        toast({ title: 'Intervention créée' });
        setIsCreateInterventionOpen(false);
        setInterventionForm({ sphere: 'HABITUDES_VIE', priority: 'MEDIUM', addressesPriority: false });
        fetchPlans();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Update intervention
  const handleUpdateIntervention = async () => {
    if (!selectedPlan || !selectedIntervention) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/bnq/action-plans/${selectedPlan.id}/interventions/${selectedIntervention.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interventionForm),
        }
      );

      if (response.ok) {
        toast({ title: 'Intervention mise à jour' });
        setIsEditInterventionOpen(false);
        setSelectedIntervention(null);
        fetchPlans();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete intervention
  const handleDeleteIntervention = async () => {
    if (!selectedPlan || !selectedIntervention) return;
    
    try {
      const response = await fetch(
        `/api/bnq/action-plans/${selectedPlan.id}/interventions/${selectedIntervention.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({ title: 'Intervention supprimée' });
        setIsDeleteDialogOpen(false);
        setSelectedIntervention(null);
        fetchPlans();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  // Calculate plan progress
  const calculatePlanProgress = (plan: ActionPlan) => {
    const total = plan.interventions.length;
    const completed = plan.interventions.filter(i => i.status === 'COMPLETED').length;
    const inProgress = plan.interventions.filter(i => i.status === 'IN_PROGRESS').length;
    const priorityCount = plan.interventions.filter(i => i.addressesPriority).length;
    const pratiquesGestion = plan.interventions.filter(i => i.sphere === 'PRATIQUES_GESTION').length;
    
    return {
      total,
      completed,
      inProgress,
      priorityCount,
      pratiquesGestion,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      meetsMinInterventions: total >= plan.minInterventions,
      meetsMinPriorities: priorityCount >= plan.minPriorities,
      meetsMinPratiquesGestion: pratiquesGestion >= plan.minPratiquesGestion,
    };
  };

  // Toggle plan expansion
  const togglePlan = (planId: string) => {
    setExpandedPlans(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  // Open edit intervention dialog
  const openEditIntervention = (plan: ActionPlan, intervention: Intervention) => {
    setSelectedPlan(plan);
    setSelectedIntervention(intervention);
    setInterventionForm(intervention);
    setIsEditInterventionOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (plan: ActionPlan, intervention: Intervention) => {
    setSelectedPlan(plan);
    setSelectedIntervention(intervention);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const levelReqs = BNQ_LEVEL_REQUIREMENTS[targetLevel as keyof typeof BNQ_LEVEL_REQUIREMENTS] || BNQ_LEVEL_REQUIREMENTS.ES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Plans d'action santé mieux-être
          </h3>
          <p className="text-sm text-muted-foreground">
            Objectif {BNQ_LEVEL_LABELS[targetLevel].badge} : minimum {levelReqs.minInterventions} interventions 
            dont {levelReqs.minPriorities} sur besoins prioritaires
            {levelReqs.minPratiquesGestion > 0 && ` et ${levelReqs.minPratiquesGestion} sur pratiques de gestion`}
          </p>
        </div>
        <Button onClick={() => setIsCreatePlanOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau plan
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun plan d'action</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre premier plan d'action annuel
            </p>
            <Button className="mt-4" onClick={() => setIsCreatePlanOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const progress = calculatePlanProgress(plan);
            const isExpanded = expandedPlans.includes(plan.id);
            const SphereIcon = SPHERE_ICONS;

            return (
              <Collapsible key={plan.id} open={isExpanded} onOpenChange={() => togglePlan(plan.id)}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {plan.title}
                              <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {plan.status === 'ACTIVE' ? 'Actif' : plan.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {progress.total} interventions • {progress.completed} terminées • {progress.inProgress} en cours
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            <Badge 
                              variant={progress.meetsMinInterventions ? 'default' : 'outline'}
                              className={progress.meetsMinInterventions ? 'bg-green-100 text-green-800' : ''}
                            >
                              {progress.total}/{plan.minInterventions} interv.
                            </Badge>
                            <Badge 
                              variant={progress.meetsMinPriorities ? 'default' : 'outline'}
                              className={progress.meetsMinPriorities ? 'bg-green-100 text-green-800' : ''}
                            >
                              {progress.priorityCount}/{plan.minPriorities} priorités
                            </Badge>
                            {plan.minPratiquesGestion > 0 && (
                              <Badge 
                                variant={progress.meetsMinPratiquesGestion ? 'default' : 'outline'}
                                className={progress.meetsMinPratiquesGestion ? 'bg-green-100 text-green-800' : ''}
                              >
                                {progress.pratiquesGestion}/{plan.minPratiquesGestion} gestion
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={progress.percentage} className="w-20 h-2" />
                            <span className="text-sm font-medium w-10">{progress.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Add intervention button */}
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setInterventionForm({ sphere: 'HABITUDES_VIE', priority: 'MEDIUM', addressesPriority: false });
                            setIsCreateInterventionOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une intervention
                        </Button>
                      </div>

                      {/* Interventions by sphere */}
                      {(['HABITUDES_VIE', 'CONCILIATION_TRAVAIL', 'ENVIRONNEMENT_TRAVAIL', 'PRATIQUES_GESTION'] as ActivitySphere[]).map(sphere => {
                        const sphereInterventions = plan.interventions.filter(i => i.sphere === sphere);
                        const sphereInfo = ACTIVITY_SPHERE_LABELS[sphere];
                        const Icon = SPHERE_ICONS[sphere];

                        if (sphereInterventions.length === 0) return null;

                        return (
                          <div key={sphere} className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`p-1.5 rounded ${sphereInfo.color}`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="font-medium">{sphereInfo.name}</h4>
                              <Badge variant="outline">{sphereInterventions.length}</Badge>
                            </div>
                            <div className="space-y-3 pl-8">
                              {sphereInterventions.map(intervention => {
                                const statusInfo = INTERVENTION_STATUS_LABELS[intervention.status];
                                const priorityInfo = PRIORITY_LABELS[intervention.priority];

                                return (
                                  <motion.div
                                    key={intervention.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <Badge className={`${statusInfo.color} text-white`}>
                                            {statusInfo.name}
                                          </Badge>
                                          <Badge variant="outline" className={priorityInfo.color.replace('bg-', 'border-')}>
                                            {priorityInfo.name}
                                          </Badge>
                                          {intervention.addressesPriority && (
                                            <Badge className="bg-amber-100 text-amber-800">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Besoin prioritaire
                                            </Badge>
                                          )}
                                        </div>
                                        <h5 className="font-medium">{intervention.title}</h5>
                                        {intervention.description && (
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {intervention.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                          {intervention.responsiblePerson && (
                                            <span className="flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              {intervention.responsiblePerson}
                                            </span>
                                          )}
                                          {intervention.targetEndDate && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              Échéance: {new Date(intervention.targetEndDate).toLocaleDateString('fr-FR')}
                                            </span>
                                          )}
                                          {intervention.targetParticipation && (
                                            <span className="flex items-center gap-1">
                                              <TrendingUp className="h-3 w-3" />
                                              Cible: {intervention.targetParticipation}%
                                            </span>
                                          )}
                                        </div>
                                        {intervention.status === 'COMPLETED' && (
                                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                            <div className="flex items-center gap-4">
                                              {intervention.actualParticipation && (
                                                <span>Participation: {intervention.actualParticipation}%</span>
                                              )}
                                              {intervention.satisfactionScore && (
                                                <span>Satisfaction: {intervention.satisfactionScore}/10</span>
                                              )}
                                            </div>
                                            {intervention.actualOutcome && (
                                              <p className="text-muted-foreground mt-1">
                                                Résultat: {intervention.actualOutcome}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openEditIntervention(plan, intervention)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openDeleteDialog(plan, intervention)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {plan.interventions.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune intervention dans ce plan. Ajoutez-en une pour commencer.
                        </p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau plan d'action</DialogTitle>
            <DialogDescription>
              Créez un plan d'action annuel pour {companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Année</Label>
              <Input
                type="number"
                value={newPlanYear}
                onChange={(e) => setNewPlanYear(parseInt(e.target.value))}
                min={2020}
                max={2050}
              />
            </div>
            <div>
              <Label>Titre (optionnel)</Label>
              <Input
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder={`Plan d'action santé mieux-être ${newPlanYear}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePlan} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Intervention Dialog */}
      <Dialog 
        open={isCreateInterventionOpen || isEditInterventionOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateInterventionOpen(false);
            setIsEditInterventionOpen(false);
            setSelectedIntervention(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditInterventionOpen ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan && `Plan ${selectedPlan.year}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Titre *</Label>
                <Input
                  value={interventionForm.title || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de l'intervention"
                />
              </div>
              <div>
                <Label>Sphère d'activité *</Label>
                <Select
                  value={interventionForm.sphere}
                  onValueChange={(v) => setInterventionForm(prev => ({ ...prev, sphere: v as ActivitySphere }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_SPHERE_LABELS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select
                  value={interventionForm.priority}
                  onValueChange={(v) => setInterventionForm(prev => ({ ...prev, priority: v as Priority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isEditInterventionOpen && (
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={interventionForm.status}
                    onValueChange={(v) => setInterventionForm(prev => ({ ...prev, status: v as InterventionStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERVENTION_STATUS_LABELS).map(([key, info]) => (
                        <SelectItem key={key} value={key}>{info.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addressesPriority"
                    checked={interventionForm.addressesPriority}
                    onCheckedChange={(checked) => setInterventionForm(prev => ({ ...prev, addressesPriority: !!checked }))}
                  />
                  <Label htmlFor="addressesPriority" className="cursor-pointer">
                    Répond à un besoin prioritaire identifié (BNQ Art. 8.2)
                  </Label>
                </div>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={interventionForm.description || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de l'intervention..."
                />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input
                  value={interventionForm.responsiblePerson || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                  placeholder="Nom du responsable"
                />
              </div>
              <div>
                <Label>Fonction</Label>
                <Input
                  value={interventionForm.responsibleRole || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, responsibleRole: e.target.value }))}
                  placeholder="RH, Manager, etc."
                />
              </div>
              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={interventionForm.startDate ? new Date(interventionForm.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Échéance cible</Label>
                <Input
                  type="date"
                  value={interventionForm.targetEndDate ? new Date(interventionForm.targetEndDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, targetEndDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Budget (€)</Label>
                <Input
                  type="number"
                  value={interventionForm.budget || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, budget: parseFloat(e.target.value) || undefined }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Cible participation (%)</Label>
                <Input
                  type="number"
                  value={interventionForm.targetParticipation || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, targetParticipation: parseFloat(e.target.value) || undefined }))}
                  placeholder="50"
                  min={0}
                  max={100}
                />
              </div>
              <div className="col-span-2">
                <Label>Résultat attendu (objectif mesurable)</Label>
                <Textarea
                  value={interventionForm.expectedOutcome || ''}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, expectedOutcome: e.target.value }))}
                  placeholder="Décrivez le résultat mesurable attendu..."
                />
              </div>
              {isEditInterventionOpen && interventionForm.status === 'COMPLETED' && (
                <>
                  <div>
                    <Label>Participation réelle (%)</Label>
                    <Input
                      type="number"
                      value={interventionForm.actualParticipation || ''}
                      onChange={(e) => setInterventionForm(prev => ({ ...prev, actualParticipation: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Label>Score satisfaction (/10)</Label>
                    <Input
                      type="number"
                      value={interventionForm.satisfactionScore || ''}
                      onChange={(e) => setInterventionForm(prev => ({ ...prev, satisfactionScore: parseFloat(e.target.value) || undefined }))}
                      min={0}
                      max={10}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Résultat obtenu</Label>
                    <Textarea
                      value={interventionForm.actualOutcome || ''}
                      onChange={(e) => setInterventionForm(prev => ({ ...prev, actualOutcome: e.target.value }))}
                      placeholder="Décrivez le résultat obtenu..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateInterventionOpen(false);
                setIsEditInterventionOpen(false);
                setSelectedIntervention(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={isEditInterventionOpen ? handleUpdateIntervention : handleCreateIntervention}
              disabled={saving || !interventionForm.title}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditInterventionOpen ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'intervention "{selectedIntervention?.title}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIntervention} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
