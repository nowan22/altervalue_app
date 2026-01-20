'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  PenLine,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface WorkflowValidationProps {
  companyId: string;
  workflowSteps: Array<{
    id: string;
    stepNumber: number;
    stepCode: string;
    stepName: string;
    description: string | null;
    status: string;
    completedAt: string | null;
    signature: string | null;
    tasks: Array<{
      id: string;
      taskCode: string;
      taskName: string;
      isRequired: boolean;
      isCompleted: boolean;
    }>;
  }>;
  onRefresh: () => void;
}

export function WorkflowValidation({ companyId, workflowSteps, onRefresh }: WorkflowValidationProps) {
  const { toast } = useToast();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set(workflowSteps.filter(s => s.status !== 'COMPLETED').map(s => s.stepNumber))
  );
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<typeof workflowSteps[0] | null>(null);
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(
        `/api/bnq/companies/${companyId}/workflow/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCompleted }),
        }
      );

      if (!response.ok) throw new Error('Erreur');
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la tâche',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteStep = async () => {
    if (!selectedStep || !signature) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bnq/companies/${companyId}/workflow/${selectedStep.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            signature,
            notes,
          }),
        }
      );

      if (!response.ok) throw new Error('Erreur');

      toast({
        title: 'Étape validée',
        description: `${selectedStep.stepName} a été complétée avec succès`,
      });

      setIsSignatureDialogOpen(false);
      setSelectedStep(null);
      setSignature('');
      setNotes('');
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider l\'étape',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (step: typeof workflowSteps[0]) => {
    if (step.status === 'COMPLETED') return 'completed';
    const requiredTasks = step.tasks.filter(t => t.isRequired);
    const completedRequired = requiredTasks.filter(t => t.isCompleted);
    if (completedRequired.length === requiredTasks.length) return 'ready';
    if (completedRequired.length > 0) return 'in_progress';
    return 'not_started';
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'ready':
        return <Check className="h-6 w-6 text-blue-600" />;
      case 'in_progress':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Complété</Badge>;
      case 'ready':
        return <Badge className="bg-blue-500">Prêt à valider</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">En cours</Badge>;
      default:
        return <Badge variant="secondary">À démarrer</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PenLine className="h-5 w-5 text-purple-600" />
          Workflow de Validation Direction
        </h2>
        <p className="text-sm text-muted-foreground">
          Suivez les 5 étapes pour valider l&apos;adhésion de la direction
        </p>
      </div>

      {/* Progress Line */}
      <div className="flex items-center justify-between mb-6 px-4">
        {workflowSteps.map((step, index) => {
          const status = getStepStatus(step);
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  status === 'completed'
                    ? 'bg-green-100 border-green-500'
                    : status === 'ready'
                      ? 'bg-blue-100 border-blue-500'
                      : status === 'in_progress'
                        ? 'bg-yellow-100 border-yellow-500'
                        : 'bg-gray-100 border-gray-300'
                }`}
              >
                {status === 'completed' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <span className={`font-bold ${
                    status === 'ready' ? 'text-blue-600' :
                    status === 'in_progress' ? 'text-yellow-600' :
                    'text-gray-400'
                  }`}>
                    {step.stepNumber}
                  </span>
                )}
              </div>
              {index < workflowSteps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Workflow Steps */}
      <div className="space-y-3">
        {workflowSteps.map((step) => {
          const status = getStepStatus(step);
          const isExpanded = expandedSteps.has(step.stepNumber);
          const requiredTasks = step.tasks.filter(t => t.isRequired);
          const completedTasks = step.tasks.filter(t => t.isCompleted);

          return (
            <Card key={step.id} className={`${
              status === 'completed' ? 'border-green-200 bg-green-50/50' :
              status === 'ready' ? 'border-blue-200 bg-blue-50/50' :
              status === 'in_progress' ? 'border-yellow-200 bg-yellow-50/50' :
              ''
            }`}>
              <CardHeader
                className="py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleStep(step.stepNumber)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    {getStepStatusIcon(status)}
                    <div>
                      <CardTitle className="text-base">{step.stepName}</CardTitle>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {completedTasks.length}/{step.tasks.length} tâches
                    </span>
                    {getStepStatusBadge(status)}
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0">
                      {/* Tasks */}
                      <div className="space-y-3 mb-4">
                        {step.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              task.isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <Checkbox
                              id={task.id}
                              checked={task.isCompleted}
                              onCheckedChange={(checked) =>
                                handleTaskToggle(task.id, checked as boolean)
                              }
                              disabled={status === 'completed'}
                            />
                            <label
                              htmlFor={task.id}
                              className={`flex-1 text-sm cursor-pointer ${
                                task.isCompleted ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {task.taskName}
                              {task.isRequired && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {task.isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Validation Section */}
                      {status === 'completed' && step.signature && (
                        <div className="p-4 bg-green-100 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Étape validée</span>
                          </div>
                          <p className="text-sm text-green-700 mt-2">
                            Signé par : {step.signature}
                          </p>
                          {step.completedAt && (
                            <p className="text-sm text-green-700">
                              Le : {new Date(step.completedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {status === 'ready' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-800">
                              <AlertCircle className="h-5 w-5" />
                              <span className="font-medium">
                                Toutes les tâches obligatoires sont complétées
                              </span>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStep(step);
                                setIsSignatureDialogOpen(true);
                              }}
                            >
                              <PenLine className="h-4 w-4 mr-2" />
                              Valider l&apos;étape
                            </Button>
                          </div>
                        </div>
                      )}

                      {status === 'in_progress' && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <Clock className="h-5 w-5" />
                            <span className="font-medium">
                              {requiredTasks.length - requiredTasks.filter(t => t.isCompleted).length} tâche(s) obligatoire(s) restante(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Final Status */}
      {workflowSteps.every(s => getStepStatus(s) === 'completed') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-300"
        >
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-800">
                🎉 Adhésion Direction Complète !
              </h3>
              <p className="text-green-700">
                Tous les documents et validations sont en place pour la certification BNQ
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider l&apos;étape</DialogTitle>
            <DialogDescription>
              {selectedStep?.stepName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                En signant cette étape, vous confirmez que toutes les tâches ont été
                réalisées conformément aux exigences de la norme BNQ 9700-800.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Signature électronique *</Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Entrez votre nom complet"
              />
              <p className="text-xs text-muted-foreground">
                Cette signature sera horodatée automatiquement
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaires ou observations..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCompleteStep} disabled={isLoading || !signature}>
              {isLoading ? 'Validation...' : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Signer et valider
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
