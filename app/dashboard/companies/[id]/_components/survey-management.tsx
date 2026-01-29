'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Link as LinkIcon,
  Copy,
  Play,
  Square,
  Trash2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3,
  ExternalLink,
  FileDown,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  surveyToken: string;
  startDate: string | null;
  endDate: string | null;
  closedAt: string | null;
  createdAt: string;
  _count: { responses: number };
  aggregate: {
    respondentsCount: number;
    prevalence: number;
    avgEfficiencyScore: number;
    qualityFlag: string;
    presCostB: number | null;
    presCostBPct: number | null;
    presCostBPerEmployee: number | null;
    factorDistribution: string | null;
    impactDistribution: string | null;
  } | null;
}

interface IndicativeResult {
  isIndicative: boolean;
  calculatedAt: string;
  surveyStatus: string;
  respondentsCount: number;
  prevalence: number;
  avgEfficiencyScore: number;
  responseRate: number;
  qualityFlag: string;
  presCostB: number;
  presCostBPct: number;
  presCostBPerEmployee: number;
  productivityLoss: number;
  affectedEmployees: number;
  degradedHours: number;
  valuePerHour: number;
  payroll: number;
}

interface SurveyManagementProps {
  companyId: string;
  companyName: string;
  employeesCount: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-muted0', icon: Clock },
  ACTIVE: { label: 'En cours', color: 'bg-green-500', icon: Play },
  CLOSED: { label: 'Clôturée', color: 'bg-blue-500', icon: CheckCircle },
  ARCHIVED: { label: 'Archivée', color: 'bg-gray-400', icon: Square },
};

export function SurveyManagement({ companyId, companyName, employeesCount }: SurveyManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [newSurveyTitle, setNewSurveyTitle] = useState('Enquête Présentéisme');
  const [newSurveyDescription, setNewSurveyDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [indicativeResults, setIndicativeResults] = useState<Record<string, IndicativeResult>>({});
  const [calculatingPreview, setCalculatingPreview] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSurvey, setEmailSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, [companyId]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/surveys`);
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSurveyTitle,
          description: newSurveyDescription,
        }),
      });

      if (response.ok) {
        toast({ title: 'Enquête créée', description: 'L\'enquête a été créée avec succès.' });
        setIsCreateDialogOpen(false);
        setNewSurveyTitle('Enquête Présentéisme');
        setNewSurveyDescription('');
        fetchSurveys();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (surveyId: string, newStatus: string) => {
    setActionLoading(surveyId);
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
        toast({ title: 'Statut mis à jour', description: `L'enquête est maintenant : ${statusLabel}` });
        fetchSurveys();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSurvey = async () => {
    if (!selectedSurvey) return;
    
    try {
      const response = await fetch(`/api/surveys/${selectedSurvey.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Enquête supprimée' });
        setIsDeleteDialogOpen(false);
        setSelectedSurvey(null);
        fetchSurveys();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression.', variant: 'destructive' });
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/survey/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié', description: 'Le lien a été copié dans le presse-papiers.' });
  };

  const openSurveyLink = (token: string) => {
    const url = `${window.location.origin}/survey/${token}`;
    window.open(url, '_blank');
  };

  const calculateIndicativePreview = async (surveyId: string) => {
    setCalculatingPreview(surveyId);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/calculate-preview`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setIndicativeResults(prev => ({ ...prev, [surveyId]: result }));
        toast({ 
          title: 'Calcul effectué', 
          description: 'Résultat indicatif généré avec succès.' 
        });
      } else {
        const error = await response.json();
        toast({ 
          title: 'Erreur', 
          description: error.error || 'Erreur lors du calcul.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors du calcul.', variant: 'destructive' });
    } finally {
      setCalculatingPreview(null);
    }
  };

  const exportPdf = async (surveyId: string) => {
    setExportingPdf(surveyId);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/export-pdf`);
      if (response.ok) {
        const data = await response.json();
        // Open print dialog with HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast({ title: 'Export prêt', description: 'Le rapport PDF est prêt à imprimer.' });
      } else {
        const error = await response.json();
        toast({ 
          title: 'Erreur', 
          description: error.error || 'Erreur lors de l\'export.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de l\'export.', variant: 'destructive' });
    } finally {
      setExportingPdf(null);
    }
  };

  const generateEmailContent = (survey: Survey) => {
    const surveyUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/survey/${survey.surveyToken}` 
      : `/survey/${survey.surveyToken}`;
    
    return `Bonjour,

Nous menons actuellement une enquête anonyme sur le bien-être au travail et vous invitons à y participer.

📋 **${survey.title}**

Cette enquête est totalement anonyme et ne prend que 2-3 minutes. Vos réponses nous aideront à mieux comprendre les conditions de travail et à identifier les axes d'amélioration.

👉 **Accéder à l'enquête** : ${surveyUrl}

Votre participation est précieuse. Nous vous remercions par avance de votre contribution.

Bien cordialement,
L'équipe QVCT de ${companyName}

---
💡 Rappel : Cette enquête est confidentielle et anonyme. Aucune donnée personnelle n'est collectée.`;
  };

  const copyEmailToClipboard = () => {
    if (!emailSurvey) return;
    navigator.clipboard.writeText(generateEmailContent(emailSurvey));
    toast({ 
      title: 'Email copié', 
      description: 'Le texte a été copié dans le presse-papiers.' 
    });
  };

  // Get closed surveys for trends
  const closedSurveys = surveys
    .filter(s => s.status === 'CLOSED' && s.aggregate)
    .sort((a, b) => new Date(a.closedAt || 0).getTime() - new Date(b.closedAt || 0).getTime());

  // Check for trends (comparing last 2 surveys)
  const getTrendData = () => {
    if (closedSurveys.length < 2) return null;
    const prev = closedSurveys[closedSurveys.length - 2];
    const current = closedSurveys[closedSurveys.length - 1];
    if (!prev.aggregate || !current.aggregate) return null;

    const prevalenceDiff = (current.aggregate.prevalence - prev.aggregate.prevalence) * 100;
    const costDiff = current.aggregate.presCostB && prev.aggregate.presCostB
      ? ((current.aggregate.presCostB - prev.aggregate.presCostB) / prev.aggregate.presCostB) * 100
      : null;
    const efficiencyDiff = (current.aggregate.avgEfficiencyScore - prev.aggregate.avgEfficiencyScore) * 100;

    return {
      prevalenceDiff,
      costDiff,
      efficiencyDiff,
      isWorsening: prevalenceDiff > 10,
    };
  };

  const trendData = getTrendData();

  // Chart data for evolution
  const chartData = closedSurveys.map(s => ({
    name: s.closedAt ? new Date(s.closedAt).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '',
    prevalence: (s.aggregate?.prevalence ?? 0) * 100,
    efficacite: (s.aggregate?.avgEfficiencyScore ?? 0) * 100,
    cout: (s.aggregate?.presCostB ?? 0) / 1000,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            Enquêtes Présentéisme (Méthode B)
          </h3>
          <p className="text-sm text-muted-foreground">
            Créez des enquêtes anonymes pour mesurer le présentéisme réel
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle enquête
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-800 dark:text-purple-300">Méthode B - Enquête Interne</p>
              <p className="text-purple-700 dark:text-purple-400 mt-1">
                Cette méthode permet de mesurer le présentéisme réel à partir de réponses anonymes.
                Un minimum de <strong>10 répondants</strong> est requis pour activer le calcul.
                Pour une robustesse optimale, visez un taux de participation de 30%+ ({Math.ceil(employeesCount * 0.3)} réponses).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trends Section - only if multiple closed surveys */}
      {closedSurveys.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Historique et tendances
            </CardTitle>
            <CardDescription>
              Évolution des indicateurs sur les {closedSurveys.length} enquêtes clôturées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Alert if worsening */}
            {trendData?.isWorsening && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-300">Alerte : Dégradation détectée</p>
                    <p className="text-red-700 dark:text-red-400 mt-1">
                      La prévalence a augmenté de {trendData.prevalenceDiff.toFixed(1)} points depuis la dernière enquête. 
                      Envisagez des actions correctives prioritaires.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-muted dark:bg-card rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Prévalence N vs N-1</p>
                <div className="flex items-center gap-2">
                  {trendData && (
                    <>
                      {trendData.prevalenceDiff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : trendData.prevalenceDiff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : null}
                      <span className={`font-semibold ${
                        trendData.prevalenceDiff > 0 ? 'text-red-600' : 
                        trendData.prevalenceDiff < 0 ? 'text-green-600' : ''
                      }`}>
                        {trendData.prevalenceDiff > 0 ? '+' : ''}{trendData.prevalenceDiff.toFixed(1)} pts
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted dark:bg-card rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Efficacité N vs N-1</p>
                <div className="flex items-center gap-2">
                  {trendData && (
                    <>
                      {trendData.efficiencyDiff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : trendData.efficiencyDiff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className={`font-semibold ${
                        trendData.efficiencyDiff > 0 ? 'text-green-600' : 
                        trendData.efficiencyDiff < 0 ? 'text-red-600' : ''
                      }`}>
                        {trendData.efficiencyDiff > 0 ? '+' : ''}{trendData.efficiencyDiff.toFixed(1)} pts
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted dark:bg-card rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Coût N vs N-1</p>
                <div className="flex items-center gap-2">
                  {trendData?.costDiff != null && (
                    <>
                      {trendData.costDiff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : trendData.costDiff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : null}
                      <span className={`font-semibold ${
                        trendData.costDiff > 0 ? 'text-red-600' : 
                        trendData.costDiff < 0 ? 'text-green-600' : ''
                      }`}>
                        {trendData.costDiff > 0 ? '+' : ''}{trendData.costDiff.toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => {
                    if (name === 'cout') return [`${value.toFixed(1)}k €`, 'Coût'];
                    return [`${value.toFixed(1)}%`, name === 'prevalence' ? 'Prévalence' : 'Efficacité'];
                  }} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="prevalence"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Prévalence (%)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficacite"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Efficacité (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cout"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Coût (k€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune enquête</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre première enquête pour mesurer le présentéisme avec la Méthode B
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une enquête
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => {
            const statusConfig = STATUS_CONFIG[survey.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusConfig.icon;
            const responseRate = (survey._count.responses / employeesCount) * 100;
            const hasEnoughResponses = survey._count.responses >= 10;

            return (
              <motion.div
                key={survey.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {survey.title}
                          <Badge className={`${statusConfig.color} text-white`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </CardTitle>
                        {survey.description && (
                          <CardDescription className="mt-1">{survey.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {survey.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(survey.id, 'ACTIVE')}
                            disabled={actionLoading === survey.id}
                          >
                            {actionLoading === survey.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Lancer
                              </>
                            )}
                          </Button>
                        )}
                        {survey.status === 'ACTIVE' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLink(survey.surveyToken)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copier le lien
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEmailSurvey(survey);
                                setIsEmailDialogOpen(true);
                              }}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Générer email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSurveyLink(survey.surveyToken)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {hasEnoughResponses && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => calculateIndicativePreview(survey.id)}
                                disabled={calculatingPreview === survey.id}
                              >
                                {calculatingPreview === survey.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <BarChart3 className="h-4 w-4 mr-1" />
                                    Calculer (indicatif)
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(survey.id, 'CLOSED')}
                              disabled={actionLoading === survey.id}
                            >
                              {actionLoading === survey.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Square className="h-4 w-4 mr-1" />
                                  Clôturer
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {survey.status === 'CLOSED' && survey.aggregate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportPdf(survey.id)}
                            disabled={exportingPdf === survey.id}
                          >
                            {exportingPdf === survey.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <FileDown className="h-4 w-4 mr-1" />
                                Export PDF
                              </>
                            )}
                          </Button>
                        )}
                        {(survey.status === 'DRAFT' || survey.status === 'CLOSED') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSurvey(survey);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Responses */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Réponses</p>
                        <p className="text-lg font-semibold flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {survey._count.responses}
                          <span className="text-sm font-normal text-muted-foreground">/ {employeesCount}</span>
                        </p>
                        <Progress value={responseRate} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {responseRate.toFixed(1)}% de participation
                        </p>
                      </div>

                      {/* Validity */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Validité</p>
                        {hasEnoughResponses ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valide (≥10 rép.)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {10 - survey._count.responses} rép. manquantes
                          </Badge>
                        )}
                      </div>

                      {/* Results (if closed and has aggregate) */}
                      {survey.status === 'CLOSED' && survey.aggregate && (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Prévalence</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {(survey.aggregate.prevalence * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">des salariés concernés</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Coût Méthode B</p>
                            {survey.aggregate.presCostB ? (
                              <>
                                <p className="text-lg font-semibold text-red-600">
                                  {survey.aggregate.presCostB.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {survey.aggregate.presCostBPct?.toFixed(1)}% de la masse salariale
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">Non calculé</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Indicative Results for active surveys */}
                      {survey.status === 'ACTIVE' && indicativeResults[survey.id] && (
                        <>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              Prévalence (indicatif)
                            </p>
                            <p className="text-lg font-semibold text-purple-600">
                              {(indicativeResults[survey.id].prevalence * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">des salariés concernés</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              Coût (indicatif)
                            </p>
                            <p className="text-lg font-semibold text-amber-600">
                              {indicativeResults[survey.id].presCostB.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {indicativeResults[survey.id].presCostBPct.toFixed(1)}% de la masse salariale
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Survey link for active surveys */}
                    {survey.status === 'ACTIVE' && (
                      <div className="mt-4 p-3 bg-muted dark:bg-card rounded-lg">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <code className="text-xs text-muted-foreground flex-1 truncate">
                            {typeof window !== 'undefined' && `${window.location.origin}/survey/${survey.surveyToken}`}
                          </code>
                        </div>
                      </div>
                    )}

                    {/* Indicative results warning banner */}
                    {survey.status === 'ACTIVE' && indicativeResults[survey.id] && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-medium">Résultat indicatif - Enquête en cours</p>
                            <p className="mt-1 text-amber-700 dark:text-amber-400">
                              Ce calcul est basé sur les {indicativeResults[survey.id].respondentsCount} réponses actuelles 
                              et peut évoluer. Les résultats définitifs seront disponibles après clôture de l&apos;enquête.
                            </p>
                            <p className="mt-1 text-amber-600 dark:text-amber-500 text-[10px]">
                              Calculé le {new Date(indicativeResults[survey.id].calculatedAt).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle enquête</DialogTitle>
            <DialogDescription>
              Créez une enquête anonyme pour mesurer le présentéisme
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newSurveyTitle}
                onChange={(e) => setNewSurveyTitle(e.target.value)}
                placeholder="Enquête Présentéisme"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={newSurveyDescription}
                onChange={(e) => setNewSurveyDescription(e.target.value)}
                placeholder="Description de l'enquête..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSurvey} disabled={creating || !newSurveyTitle}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'enquête ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les réponses seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSurvey} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Generation Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Email de relance
            </DialogTitle>
            <DialogDescription>
              Copiez ce texte et collez-le dans votre outil d&apos;emailing (Outlook, Gmail, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted dark:bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Objet suggéré :</p>
              <p className="text-sm mb-4 font-medium">
                [Important] Participez à l&apos;enquête anonyme sur le bien-être au travail
              </p>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Corps du message :</p>
              <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground dark:text-muted-foreground">
                {emailSurvey && generateEmailContent(emailSurvey)}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={copyEmailToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le texte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
