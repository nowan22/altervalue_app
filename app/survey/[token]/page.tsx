'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Shield,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';

interface QuestionOption {
  value: string | number;
  label: string;
  score?: number;
}

type QuestionOptionInput = QuestionOption | string;

interface Question {
  id: string;
  type: string;
  text: string;
  required?: boolean;
  scale?: string;
  options?: QuestionOptionInput[];
  min?: number;
  max?: number;
  unit?: string;
  labels?: Record<string, string>;
  max_choices?: number;
  max_length?: number;
}

interface QuestionModule {
  id: string;
  title: string;
  description?: string;
  bnq_reference?: string;
  questions: Question[];
}

interface SurveyData {
  campaignName: string;
  companyName: string;
  surveyTypeName: string;
  estimatedDuration: number;
  anonymityThreshold: number;
  questionnaire: { modules: QuestionModule[] };
  metadata: { name: string; framework: string[]; primary_objective: string };
  dataGovernance: { anonymity_threshold: number; rgpd_compliant: boolean };
  currentResponses: number;
  endDate: string | null;
  isLegacySurvey?: boolean;
  surveyId?: string;
}

// Helper to normalize option format (string or object)
const normalizeOption = (option: QuestionOptionInput): QuestionOption => {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return option;
};

export default function SurveyPage({ params }: { params: { token: string } }) {
  const router = useRouter();

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch(`/api/diagnostic/respond/${params.token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Enquête non disponible');
        }
        const data = await res.json();
        setSurveyData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [params.token]);

  const modules = surveyData?.questionnaire?.modules || [];
  const currentModule = modules[currentModuleIndex];
  const progress = modules.length > 0 ? ((currentModuleIndex + 1) / modules.length) * 100 : 0;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const isModuleComplete = () => {
    if (!currentModule) return true;
    return currentModule.questions.every(q => {
      if (!q.required) return true;
      const value = responses[q.id];
      if (q.type === 'consent') return value === true;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    });
  };

  const handleNext = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Generate a simple fingerprint from available data
      const fingerprint = `${navigator.userAgent}-${new Date().getTime()}-${Math.random()}`;
      
      const payload: any = { responses, fingerprint };
      
      // Add legacy survey fields if this is a legacy survey
      if (surveyData?.isLegacySurvey) {
        payload.isLegacySurvey = true;
        payload.surveyId = surveyData.surveyId;
      }
      
      const res = await fetch(`/api/diagnostic/respond/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement de l'enquête...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border bg-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enquête non disponible</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Merci pour votre participation !</h2>
              <p className="text-muted-foreground mb-4">
                Vos réponses ont été enregistrées de manière anonyme.
              </p>
              <p className="text-sm text-muted-foreground">
                Vous pouvez maintenant fermer cette page.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Welcome screen
  if (!started && surveyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card className="border-border bg-card">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Image
                  src="/logo-altervalue.png"
                  alt="AlterValue"
                  width={40}
                  height={40}
                  className="rounded"
                />
              </div>
              <CardTitle className="text-xl">{surveyData.campaignName}</CardTitle>
              <CardDescription>{surveyData.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Durée estimée : {surveyData.estimatedDuration} minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Vos réponses sont 100% anonymes et confidentielles</span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Objectif de l'enquête</p>
                <p className="text-sm text-muted-foreground">
                  {surveyData.metadata.primary_objective}
                </p>
              </div>

              {surveyData.metadata.framework && (
                <p className="text-xs text-muted-foreground text-center">
                  Référentiel : {Array.isArray(surveyData.metadata.framework) 
                    ? surveyData.metadata.framework.join(', ')
                    : surveyData.metadata.framework}
                </p>
              )}

              <Button 
                onClick={() => setStarted(true)} 
                className="w-full bg-gradient-gold text-primary-foreground"
                size="lg"
              >
                Commencer l'enquête
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Survey form
  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Section {currentModuleIndex + 1} / {modules.length}
            </span>
            <span className="font-medium">{currentModule?.title}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Form content */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModuleIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{currentModule?.title}</CardTitle>
                  {currentModule?.description && (
                    <CardDescription>{currentModule.description}</CardDescription>
                  )}
                  {currentModule?.bnq_reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Réf. : {currentModule.bnq_reference}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-8">
                  {currentModule?.questions.map((question, qIndex) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qIndex * 0.1 }}
                      className="space-y-4"
                    >
                      <Label className="text-base">
                        {question.text}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </Label>

                      {/* Consent */}
                      {question.type === 'consent' && (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={question.id}
                            checked={responses[question.id] === true}
                            onCheckedChange={(checked) => handleResponse(question.id, checked)}
                          />
                          <label htmlFor={question.id} className="text-sm text-muted-foreground cursor-pointer">
                            J'accepte
                          </label>
                        </div>
                      )}

                      {/* Scale (0-10) */}
                      {question.type === 'scale' && (
                        <div className="space-y-4">
                          <Slider
                            value={[responses[question.id] ?? 5]}
                            onValueChange={([value]) => handleResponse(question.id, value)}
                            max={10}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{question.labels?.['0'] || '0'}</span>
                            <span className="text-lg font-semibold text-primary">
                              {responses[question.id] ?? '-'}
                            </span>
                            <span>{question.labels?.['10'] || '10'}</span>
                          </div>
                        </div>
                      )}

                      {/* Number */}
                      {question.type === 'number' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={responses[question.id] ?? ''}
                            onChange={(e) => handleResponse(question.id, e.target.value ? Number(e.target.value) : null)}
                            min={question.min}
                            max={question.max}
                            className="w-32 bg-input border-border"
                          />
                          {question.unit && (
                            <span className="text-muted-foreground">{question.unit}</span>
                          )}
                        </div>
                      )}

                      {/* Single choice */}
                      {question.type === 'single_choice' && question.options && (
                        <RadioGroup
                          value={responses[question.id] ?? ''}
                          onValueChange={(value) => handleResponse(question.id, value)}
                          className="space-y-2"
                        >
                          {question.options.map((opt) => {
                            const option = normalizeOption(opt);
                            return (
                              <div key={String(option.value)} className="flex items-center space-x-3">
                                <RadioGroupItem value={String(option.value)} id={`${question.id}-${option.value}`} />
                                <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}

                      {/* Multiple choice */}
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((opt) => {
                            const option = normalizeOption(opt);
                            const selected = responses[question.id] || [];
                            const isSelected = selected.includes(option.value);
                            const maxReached = question.max_choices && selected.length >= question.max_choices;

                            return (
                              <div key={String(option.value)} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`${question.id}-${option.value}`}
                                  checked={isSelected}
                                  disabled={!isSelected && !!maxReached}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleResponse(question.id, [...selected, option.value]);
                                    } else {
                                      handleResponse(question.id, selected.filter((v: any) => v !== option.value));
                                    }
                                  }}
                                />
                                <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                          {question.max_choices && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {question.max_choices} choix maximum
                            </p>
                          )}
                        </div>
                      )}

                      {/* Open ended */}
                      {question.type === 'open_ended' && (
                        <Textarea
                          value={responses[question.id] ?? ''}
                          onChange={(e) => handleResponse(question.id, e.target.value)}
                          placeholder="Votre réponse..."
                          maxLength={question.max_length || 1000}
                          className="bg-input border-border min-h-[100px]"
                        />
                      )}

                      {/* Rank */}
                      {question.type === 'rank' && question.options && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground mb-3">
                            Glissez pour réorganiser (1 = plus prioritaire)
                          </p>
                          <Reorder.Group
                            axis="y"
                            values={responses[question.id] || question.options.map((o: any) => o.value || o)}
                            onReorder={(newOrder) => handleResponse(question.id, newOrder)}
                            className="space-y-2"
                          >
                            {(responses[question.id] || question.options.map((o: any) => o.value || o)).map((item: string, index: number) => (
                              <Reorder.Item
                                key={item}
                                value={item}
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span className="flex-1">{typeof item === 'string' ? item : (item as any).label || item}</span>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentModuleIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentModuleIndex < modules.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isModuleComplete()}
              className="bg-gradient-gold text-primary-foreground"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isModuleComplete() || submitting}
              className="bg-gradient-gold text-primary-foreground"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Terminer</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
