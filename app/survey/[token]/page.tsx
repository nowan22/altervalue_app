'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Lock,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

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
  allow_skip?: boolean;
  skip_label?: string;
  sensitive?: boolean;
  allow_other?: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  intro_text?: string;
  bnq_reference?: string;
  sphere_id?: number;
  questions?: Question[];
  type?: string;
  content?: any;
}

interface QuestionModule {
  id: string;
  title: string;
  description?: string;
  bnq_reference?: string;
  sections?: Section[];
  questions?: Question[];
}

interface SurveyData {
  campaignName: string;
  companyName: string;
  surveyTypeName: string;
  estimatedDuration: number;
  anonymityThreshold: number;
  questionnaire: { modules: QuestionModule[] };
  metadata: { name: string; framework: string[] | string; primary_objective: string };
  dataGovernance: { anonymity_threshold: number; rgpd_compliant: boolean };
  currentResponses: number;
  endDate: string | null;
  isLegacySurvey?: boolean;
  surveyId?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const normalizeOption = (option: QuestionOptionInput): QuestionOption => {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }
  return option;
};

// Flatten sections into questions for a module
const getModuleQuestions = (module: QuestionModule): Question[] => {
  if (module.questions) return module.questions;
  if (module.sections) {
    return module.sections.flatMap(section => section.questions || []);
  }
  return [];
};

// Get intro text from first section if available
const getModuleIntro = (module: QuestionModule): string | null => {
  if (module.sections && module.sections.length > 0) {
    return module.sections[0].intro_text || null;
  }
  return null;
};

// =============================================================================
// LIKERT SCALE COMPONENT (Mobile-First)
// =============================================================================

interface LikertScaleProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: Record<string, string>;
}

function LikertScale({ value, onChange, min = 0, max = 10, labels }: LikertScaleProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  
  return (
    <div className="space-y-4">
      {/* Number buttons grid - Mobile optimized - NO individual animations */}
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "relative h-12 sm:h-14 rounded-xl font-semibold text-lg transition-colors duration-150",
              "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50",
              "active:scale-95 touch-manipulation",
              value === num
                ? "bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/30"
                : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      
      {/* Labels - Static rendering, no animations */}
      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground px-1">
        <span className="max-w-[40%] text-left">{labels?.['0'] || 'Pas du tout'}</span>
        {value !== undefined && (
          <span className="text-2xl font-bold text-gradient-gold">
            {value}
          </span>
        )}
        <span className="max-w-[40%] text-right">{labels?.['10'] || 'Tout à fait'}</span>
      </div>
    </div>
  );
}

// =============================================================================
// RANK COMPONENT WITH DRAG & DROP + MOBILE BUTTONS
// =============================================================================

interface RankQuestionProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

function RankQuestion({ question, value, onChange }: RankQuestionProps) {
  const options = question.options || [];
  const items = value.length > 0 ? value : options.map((o: any) => o.value || o);
  
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onChange(newItems);
  };
  
  const getLabel = (itemValue: string): string => {
    const opt = options.find((o: any) => (o.value || o) === itemValue);
    return opt ? (typeof opt === 'string' ? opt : opt.label) : itemValue;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Classez par ordre de priorité (1 = plus important). Glissez ou utilisez les flèches.
      </p>
      
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={onChange}
        className="space-y-2"
      >
        {items.map((item: string, index: number) => (
          <Reorder.Item
            key={item}
            value={item}
            className={cn(
              "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl",
              "bg-card/50 border border-border/50",
              "cursor-grab active:cursor-grabbing",
              "hover:bg-muted/50 hover:border-primary/30 transition-all",
              "touch-manipulation"
            )}
          >
            {/* Rank badge */}
            <span className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
              "font-bold text-sm sm:text-base flex-shrink-0",
              index === 0 
                ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white" 
                : "bg-muted text-muted-foreground"
            )}>
              {index + 1}
            </span>
            
            {/* Drag handle */}
            <GripVertical className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 hidden sm:block" />
            
            {/* Label */}
            <span className="flex-1 text-sm sm:text-base leading-tight">
              {getLabel(item)}
            </span>
            
            {/* Mobile move buttons */}
            <div className="flex flex-col gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1.5 rounded-lg bg-muted/50 disabled:opacity-30 touch-manipulation"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1.5 rounded-lg bg-muted/50 disabled:opacity-30 touch-manipulation"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

// =============================================================================
// MAIN SURVEY PAGE COMPONENT
// =============================================================================

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
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());

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
  const currentQuestions = currentModule ? getModuleQuestions(currentModule) : [];
  const moduleIntro = currentModule ? getModuleIntro(currentModule) : null;
  
  // Calculate progress - questions answered vs total
  const totalQuestions = modules.reduce((acc, m) => acc + getModuleQuestions(m).length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const overallProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const moduleProgress = modules.length > 0 ? ((currentModuleIndex + 1) / modules.length) * 100 : 0;

  const handleResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    setSkippedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  }, []);

  const handleSkipQuestion = useCallback((questionId: string) => {
    setSkippedQuestions(prev => new Set([...prev, questionId]));
    setResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[questionId];
      return newResponses;
    });
  }, []);

  const isModuleComplete = useCallback(() => {
    if (!currentModule) return true;
    const questions = getModuleQuestions(currentModule);
    return questions.every(q => {
      if (!q.required) return true;
      if (skippedQuestions.has(q.id) && q.allow_skip) return true;
      const value = responses[q.id];
      if (q.type === 'consent') return value === true;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    });
  }, [currentModule, responses, skippedQuestions]);

  const handleNext = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fingerprint = `${navigator.userAgent}-${Date.now()}-${Math.random()}`;
      
      const payload: any = { 
        token: params.token,
        responses, 
        fingerprint,
        skipValidation: false,
      };
      
      if (surveyData?.isLegacySurvey) {
        payload.isLegacySurvey = true;
        payload.surveyId = surveyData.surveyId;
      }
      
      // Try new submit endpoint first, fall back to legacy
      let res = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 404) {
        // Fall back to legacy endpoint
        res = await fetch(`/api/diagnostic/respond/${params.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses, fingerprint, isLegacySurvey: surveyData?.isLegacySurvey, surveyId: surveyData?.surveyId }),
        });
      }

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

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Chargement de l'enquête...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ERROR STATE
  // =========================================================================
  if (error && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Enquête non disponible</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS/THANK YOU SCREEN
  // =========================================================================
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
            {/* Header gradient */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-teal-500 to-amber-500" />
            
            <CardContent className="p-8 sm:p-12 text-center space-y-6">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-3xl flex items-center justify-center"
              >
                <CheckCircle className="h-10 w-10 text-teal-500" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                  Merci pour votre participation !
                </h2>
                <p className="text-muted-foreground text-lg">
                  Vos réponses ont été enregistrées avec succès.
                </p>
              </div>
              
              {/* Anonymity reminder */}
              <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Confidentialité garantie</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vos données sont <strong>100% anonymisées</strong> et traitées par AlterValue 
                  pour améliorer votre qualité de vie au travail. Aucune réponse individuelle 
                  ne sera communiquée à votre employeur.
                </p>
              </div>
              
              {/* AlterValue branding */}
              <div className="pt-4 flex items-center justify-center gap-3 text-muted-foreground">
                <Image
                  src="/logo-altervalue.png"
                  alt="AlterValue"
                  width={32}
                  height={32}
                  className="rounded-lg opacity-60"
                />
                <span className="text-sm">Propulsé par AlterValue</span>
              </div>
              
              <p className="text-xs text-muted-foreground/60">
                Vous pouvez maintenant fermer cette page.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // WELCOME SCREEN
  // =========================================================================
  if (!started && surveyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
            {/* Header gradient */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-teal-500 to-amber-500" />
            
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500/20 to-teal-500/20 rounded-3xl flex items-center justify-center mb-4">
                <Image
                  src="/logo-altervalue.png"
                  alt="AlterValue"
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                {surveyData.campaignName}
              </CardTitle>
              <CardDescription className="text-base">
                {surveyData.companyName}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              {/* Key info */}
              <div className="grid gap-3">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Durée estimée</p>
                    <p className="text-sm text-muted-foreground">{surveyData.estimatedDuration} minutes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-medium">100% anonyme</p>
                    <p className="text-sm text-muted-foreground">Aucune donnée personnelle collectée</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Déjà {surveyData.currentResponses} réponses</p>
                    <p className="text-sm text-muted-foreground">Seuil anonymat : {surveyData.anonymityThreshold}</p>
                  </div>
                </div>
              </div>

              {/* Objective */}
              <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 p-5 rounded-2xl border border-primary/10">
                <p className="text-sm font-medium mb-2 text-primary">Objectif de l'enquête</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {surveyData.metadata.primary_objective}
                </p>
              </div>

              {/* Framework */}
              {surveyData.metadata.framework && (
                <p className="text-xs text-center text-muted-foreground/60">
                  Référentiel : {Array.isArray(surveyData.metadata.framework) 
                    ? surveyData.metadata.framework.join(', ')
                    : surveyData.metadata.framework}
                </p>
              )}

              {/* CTA */}
              <Button 
                onClick={() => setStarted(true)} 
                className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
                size="lg"
              >
                Commencer l'enquête
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // SURVEY FORM
  // =========================================================================
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed progress header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Module info */}
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Module {currentModuleIndex + 1}/{modules.length}
            </span>
            <span className="font-medium text-primary truncate ml-4">
              {currentModule?.title}
            </span>
          </div>
          
          {/* Progress bars */}
          <div className="space-y-1.5">
            {/* Module progress */}
            <div className="flex items-center gap-2">
              <Progress value={moduleProgress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(moduleProgress)}%
              </span>
            </div>
            {/* Overall progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-xs text-teal-500 w-10 text-right">
                {answeredQuestions}/{totalQuestions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="pt-28 pb-28 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModuleIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "linear" }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
                {/* Module header with gradient */}
                <div className="h-1 bg-gradient-to-r from-amber-500 via-teal-500 to-amber-500" />
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl sm:text-2xl">{currentModule?.title}</CardTitle>
                  {currentModule?.description && (
                    <CardDescription className="text-base">{currentModule.description}</CardDescription>
                  )}
                  {currentModule?.bnq_reference && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Réf. : {currentModule.bnq_reference}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-10 pt-4">
                  {/* Module intro text */}
                  {moduleIntro && (
                    <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {moduleIntro}
                    </div>
                  )}
                  
                  {/* Questions - Static rendering, no staggered animations */}
                  {currentQuestions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="space-y-4"
                    >
                      {/* Question number & text */}
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <Label className="text-base sm:text-lg leading-relaxed block">
                            {question.text}
                            {question.required && !question.allow_skip && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </Label>
                          {question.sensitive && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>Question sensible - réponse optionnelle</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question content based on type */}
                      <div className="pl-11">
                        {/* Consent */}
                        {question.type === 'consent' && (
                          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                            <Checkbox
                              id={question.id}
                              checked={responses[question.id] === true}
                              onCheckedChange={(checked) => handleResponse(question.id, checked)}
                              className="mt-0.5"
                            />
                            <label htmlFor={question.id} className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                              J'accepte les conditions de confidentialité et je consens à participer à cette enquête anonyme.
                            </label>
                          </div>
                        )}

                        {/* Scale (Likert 0-10) */}
                        {question.type === 'scale' && (
                          <LikertScale
                            value={responses[question.id]}
                            onChange={(val) => handleResponse(question.id, val)}
                            min={0}
                            max={10}
                            labels={question.labels}
                          />
                        )}

                        {/* Number */}
                        {question.type === 'number' && (
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              value={responses[question.id] ?? ''}
                              onChange={(e) => handleResponse(question.id, e.target.value ? Number(e.target.value) : null)}
                              min={question.min}
                              max={question.max}
                              className="w-32 h-12 text-lg bg-card border-border/50"
                            />
                            {question.unit && (
                              <span className="text-muted-foreground">{question.unit}</span>
                            )}
                          </div>
                        )}

                        {/* Single choice */}
                        {(question.type === 'single_choice' || question.type === 'dropdown') && question.options && (
                          <RadioGroup
                            value={responses[question.id] ?? ''}
                            onValueChange={(value) => handleResponse(question.id, value)}
                            className="space-y-2"
                          >
                            {question.options.map((opt) => {
                              const option = normalizeOption(opt);
                              const isSelected = responses[question.id] === String(option.value);
                              return (
                                <div 
                                  key={String(option.value)} 
                                  className={cn(
                                    "flex items-center space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer",
                                    isSelected 
                                      ? "border-primary/50 bg-primary/5" 
                                      : "border-border/30 hover:border-border hover:bg-muted/30"
                                  )}
                                  onClick={() => handleResponse(question.id, String(option.value))}
                                >
                                  <RadioGroupItem value={String(option.value)} id={`${question.id}-${option.value}`} />
                                  <Label 
                                    htmlFor={`${question.id}-${option.value}`} 
                                    className="font-normal cursor-pointer flex-1 text-sm sm:text-base"
                                  >
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
                                <div 
                                  key={String(option.value)} 
                                  className={cn(
                                    "flex items-center space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-all",
                                    isSelected 
                                      ? "border-primary/50 bg-primary/5" 
                                      : "border-border/30 hover:border-border hover:bg-muted/30",
                                    !isSelected && maxReached && "opacity-50"
                                  )}
                                >
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
                                  <Label 
                                    htmlFor={`${question.id}-${option.value}`} 
                                    className={cn(
                                      "font-normal cursor-pointer flex-1 text-sm sm:text-base",
                                      !isSelected && maxReached && "cursor-not-allowed"
                                    )}
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                            {question.max_choices && (
                              <p className="text-xs text-muted-foreground mt-2 pl-1">
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
                            className="bg-card border-border/50 min-h-[120px] text-base"
                          />
                        )}

                        {/* Rank */}
                        {question.type === 'rank' && question.options && (
                          <RankQuestion
                            question={question}
                            value={responses[question.id] || []}
                            onChange={(val) => handleResponse(question.id, val)}
                          />
                        )}

                        {/* Skip option for sensitive questions */}
                        {question.allow_skip && (
                          <button
                            type="button"
                            onClick={() => handleSkipQuestion(question.id)}
                            className={cn(
                              "mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors",
                              skippedQuestions.has(question.id) && "text-primary font-medium"
                            )}
                          >
                            {skippedQuestions.has(question.id) 
                              ? "✓ Question ignorée"
                              : question.skip_label || "Préfère ne pas répondre"
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentModuleIndex === 0}
            className="h-12 px-6"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Précédent</span>
          </Button>

          {currentModuleIndex < modules.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isModuleComplete()}
              className="h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
            >
              Suivant
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isModuleComplete() || submitting}
              className="h-12 px-8 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Envoi...</>
              ) : (
                <><Send className="h-5 w-5 mr-2" />Terminer</>               )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
