'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  PREVALENCE_OPTIONS,
  EFFICIENCY_OPTIONS,
  FACTOR_OPTIONS,
  IMPACT_OPTIONS,
  WORKING_HOURS_OPTIONS,
} from '@/lib/method-b-calculator';

interface SurveyFormProps {
  survey: {
    id: string;
    token: string;
    title: string;
    description: string | null;
    companyName: string;
    isActive: boolean;
    isExpired: boolean;
    status: string;
  };
}

export default function SurveyForm({ survey }: SurveyFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [q1Prevalence, setQ1Prevalence] = useState<string>('');
  const [q2EfficiencyPercent, setQ2EfficiencyPercent] = useState<string>('');
  const [q3Factors, setQ3Factors] = useState<string[]>([]);
  const [q3OtherText, setQ3OtherText] = useState('');
  const [q4Impact, setQ4Impact] = useState<string[]>([]);
  const [q5WorkingHours, setQ5WorkingHours] = useState<string>('');

  const steps = [
    { title: 'Fréquence', description: 'Votre expérience au travail' },
    { title: 'Efficacité', description: 'Votre niveau de performance' },
    { title: 'Facteurs', description: 'Les causes identifiées' },
    { title: 'Impact', description: 'Les conséquences observées' },
    { title: 'Temps de travail', description: 'Votre charge horaire' },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!q1Prevalence;
      case 1: return !!q2EfficiencyPercent;
      case 2: return true; // Optional
      case 3: return true; // Optional
      case 4: return !!q5WorkingHours;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyToken: survey.token,
          q1Prevalence,
          q2EfficiencyPercent: parseInt(q2EfficiencyPercent),
          q3Factors: q3Factors.length > 0 ? q3Factors : null,
          q3OtherText: q3Factors.includes('OTHER') ? q3OtherText : null,
          q4Impact: q4Impact.length > 0 ? q4Impact : null,
          q5WorkingHours,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Survey not active
  if (!survey.isActive || survey.isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Enquête non disponible</CardTitle>
            <CardDescription>
              {survey.isExpired
                ? 'Cette enquête est terminée.'
                : 'Cette enquête n\'est pas encore active ou a été clôturée.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-700">Merci pour votre participation !</CardTitle>
              <CardDescription>
                Vos réponses ont été enregistrées de manière anonyme. 
                Elles contribueront à améliorer le bien-être au travail.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Vos réponses sont 100% anonymes</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <ClipboardList className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
        <p className="text-muted-foreground mt-2">{survey.companyName}</p>
        {survey.description && (
          <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
            {survey.description}
          </p>
        )}
      </div>

      {/* Privacy notice */}
      <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-blue-50 rounded-lg">
        <Lock className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-700">
          Cette enquête est 100% anonyme. Aucune donnée personnelle n'est collectée.
        </span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Étape {currentStep + 1} sur {steps.length}</span>
          <span>{steps[currentStep].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Prevalence */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Label className="text-base">
                Au cours des 4 dernières semaines, avez-vous travaillé alors que votre état 
                de santé ou votre fatigue réduisait votre efficacité ?
              </Label>
              <RadioGroup value={q1Prevalence} onValueChange={setQ1Prevalence}>
                {PREVALENCE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option.value} id={`q1-${option.value}`} />
                    <Label htmlFor={`q1-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 1: Efficiency */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label className="text-base">
                Quand vous travaillez dans ces conditions, à quel niveau estimez-vous 
                votre efficacité par rapport à votre niveau habituel ?
              </Label>
              <RadioGroup value={q2EfficiencyPercent} onValueChange={setQ2EfficiencyPercent}>
                {EFFICIENCY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option.value.toString()} id={`q2-${option.value}`} />
                    <Label htmlFor={`q2-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Factors */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label className="text-base">
                Quels sont les principaux facteurs qui réduisent votre efficacité ?
                <span className="text-muted-foreground text-sm ml-2">(Plusieurs réponses possibles)</span>
              </Label>
              <div className="space-y-3">
                {FACTOR_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`q3-${option.value}`}
                      checked={q3Factors.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setQ3Factors([...q3Factors, option.value]);
                        } else {
                          setQ3Factors(q3Factors.filter(f => f !== option.value));
                        }
                      }}
                    />
                    <Label htmlFor={`q3-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {q3Factors.includes('OTHER') && (
                <div className="mt-4">
                  <Label htmlFor="q3OtherText">Précisez :</Label>
                  <Textarea
                    id="q3OtherText"
                    value={q3OtherText}
                    onChange={(e) => setQ3OtherText(e.target.value)}
                    placeholder="Décrivez le facteur..."
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Impact */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label className="text-base">
                Quels sont les impacts que vous observez sur votre travail ?
                <span className="text-muted-foreground text-sm ml-2">(Plusieurs réponses possibles)</span>
              </Label>
              <div className="space-y-3">
                {IMPACT_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`q4-${option.value}`}
                      checked={q4Impact.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setQ4Impact([...q4Impact, option.value]);
                        } else {
                          setQ4Impact(q4Impact.filter(i => i !== option.value));
                        }
                      }}
                    />
                    <Label htmlFor={`q4-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Working hours */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label className="text-base">
                Combien d'heures travaillez-vous en moyenne par semaine ?
              </Label>
              <RadioGroup value={q5WorkingHours} onValueChange={setQ5WorkingHours}>
                {WORKING_HOURS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option.value} id={`q5-${option.value}`} />
                    <Label htmlFor={`q5-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
