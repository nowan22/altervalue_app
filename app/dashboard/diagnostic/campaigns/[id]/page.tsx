'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Square,
  Copy,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  BarChart3,
  FileText,
  Target,
  Download,
  Loader2,
} from 'lucide-react';
import { RadarChart, ScoreBars, ScoreGauge } from './_components/radar-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  token: string;
  targetPopulation: number | null;
  minRespondents: number;
  maxRespondents: number | null;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  launchedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    employeesCount: number;
    avgGrossSalary: number;
    employerContributionRate: number;
  };
  surveyType: {
    id: string;
    typeId: string;
    name: string;
    category: string;
    estimatedDuration: number;
    anonymityThreshold: number;
    definition: any;
  };
  _count: { responses: number };
  result: {
    responseCount: number;
    participationRate: number | null;
    scores: Record<string, number>;
    criticalIndicators: Record<string, any>;
    financialMetrics: Record<string, number> | null;
    qualitativeInsights: Record<string, any> | null;
    narrative: string | null;
    calculatedAt: string;
  } | null;
  deliverables: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  SCHEDULED: { label: 'Planifiée', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  ACTIVE: { label: 'En cours', color: 'bg-success/10 text-success border-success/20' },
  CLOSED: { label: 'Clôturée', color: 'bg-warning/10 text-warning border-warning/20' },
  COMPLETED: { label: 'Terminée', color: 'bg-primary/10 text-primary border-primary/20' },
  ARCHIVED: { label: 'Archivée', color: 'bg-muted text-muted-foreground' },
};

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCampaign(data);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger la campagne', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const handleLaunch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}/launch`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      toast({ title: 'Succès', description: 'Campagne lancée !' });
      fetchCampaign();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setShowLaunchDialog(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}/close`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      toast({ title: 'Succès', description: 'Campagne clôturée et résultats calculés' });
      fetchCampaign();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setShowCloseDialog(false);
    }
  };

  const handleRecalculate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}/calculate`, { method: 'POST' });
      if (!res.ok) throw new Error('Erreur');
      toast({ title: 'Succès', description: 'Résultats recalculés' });
      fetchCampaign();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors du recalcul', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyLink = () => {
    if (campaign) {
      navigator.clipboard.writeText(`${window.location.origin}/survey/${campaign.token}`);
      toast({ title: 'Lien copié !' });
    }
  };

  const downloadPdf = async () => {
    if (!campaign) return;
    
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${campaign.id}/pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }));
        throw new Error(data.error || 'Erreur lors de la génération');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'Succès', description: 'Rapport PDF téléchargé' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campagne non trouvée</p>
        <Button asChild className="mt-4"><Link href="/dashboard/diagnostic/campaigns">Retour</Link></Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
  const progress = campaign.targetPopulation
    ? Math.round((campaign._count.responses / campaign.targetPopulation) * 100)
    : null;
  const meetsThreshold = campaign._count.responses >= campaign.minRespondents;
  const canEdit = userRole !== 'OBSERVATEUR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/diagnostic/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
              <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {campaign.surveyType.name} • {campaign.company.name}
            </p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            {campaign.status === 'DRAFT' && (
              <Button onClick={() => setShowLaunchDialog(true)} className="bg-gradient-gold text-primary-foreground">
                <Play className="h-4 w-4 mr-2" />
                Lancer
              </Button>
            )}
            {campaign.status === 'ACTIVE' && (
              <>
                <Button variant="outline" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
                <Button onClick={() => setShowCloseDialog(true)} variant="secondary">
                  <Square className="h-4 w-4 mr-2" />
                  Clôturer
                </Button>
              </>
            )}
            {(campaign.status === 'COMPLETED' || campaign.status === 'CLOSED') && campaign.result && (
              <>
                <Button variant="outline" onClick={handleRecalculate} disabled={actionLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
                  Recalculer
                </Button>
                <Button 
                  onClick={downloadPdf} 
                  disabled={pdfLoading}
                  className="bg-gradient-gold text-primary-foreground"
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réponses</p>
                <p className="text-2xl font-bold">
                  {campaign._count.responses}
                  {campaign.targetPopulation && <span className="text-lg text-muted-foreground">/{campaign.targetPopulation}</span>}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            {progress !== null && (
              <Progress value={Math.min(progress, 100)} className="mt-2 h-2" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seuil d'anonymat</p>
                <p className="text-2xl font-bold">
                  {campaign._count.responses}/{campaign.minRespondents}
                </p>
              </div>
              {meetsThreshold ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-warning" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {meetsThreshold ? 'Seuil atteint' : `${campaign.minRespondents - campaign._count.responses} réponses manquantes`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée estimée</p>
                <p className="text-2xl font-bold">{campaign.surveyType.estimatedDuration} min</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de participation</p>
                <p className="text-2xl font-bold">
                  {campaign.result?.participationRate ? `${campaign.result.participationRate}%` : '--'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Link (when active) */}
      {campaign.status === 'ACTIVE' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">Lien de l'enquête</p>
                <p className="text-sm text-muted-foreground break-all">
                  {window.location.origin}/survey/{campaign.token}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button size="sm" asChild>
                  <a href={`/survey/${campaign.token}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {campaign.result && meetsThreshold && (
        <Tabs defaultValue="radar" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="radar">
              <Target className="h-4 w-4 mr-2" />
              Radar
            </TabsTrigger>
            <TabsTrigger value="scores">
              <BarChart3 className="h-4 w-4 mr-2" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="indicators">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="financial">
              <TrendingUp className="h-4 w-4 mr-2" />
              Financier
            </TabsTrigger>
            <TabsTrigger value="narrative">
              <FileText className="h-4 w-4 mr-2" />
              Synthèse
            </TabsTrigger>
          </TabsList>

          {/* Radar Tab */}
          <TabsContent value="radar">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Vue Radar</CardTitle>
                  <CardDescription>
                    Visualisation multidimensionnelle des résultats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadarChart 
                    scores={campaign.result.scores} 
                    maxScore={10}
                    height={350}
                  />
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>Scores clés</CardTitle>
                  <CardDescription>
                    {campaign.result.responseCount} réponses analysées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Display top 3 scores as gauges */}
                  {(() => {
                    const sortedScores = Object.entries(campaign.result!.scores)
                      .filter(([_, v]) => typeof v === 'number')
                      .sort((a, b) => (b[1] as number) - (a[1] as number));
                    
                    const topScores = sortedScores.slice(0, 3);
                    const bottomScores = sortedScores.slice(-3).reverse();
                    
                    return (
                      <div className="space-y-6">
                        {/* Top performers */}
                        <div>
                          <h4 className="text-sm font-medium text-success mb-4 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Points forts
                          </h4>
                          <div className="flex justify-around">
                            {topScores.map(([key, value]) => (
                              <ScoreGauge 
                                key={key}
                                score={value as number}
                                maxScore={10}
                                label={key.replace(/_/g, ' ').substring(0, 15)}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Areas of improvement */}
                        {bottomScores.length > 0 && bottomScores[0][1] < 6 && (
                          <div>
                            <h4 className="text-sm font-medium text-warning mb-4 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Axes d'amélioration
                            </h4>
                            <div className="flex justify-around">
                              {bottomScores.filter(([_, v]) => (v as number) < 6).slice(0, 3).map(([key, value]) => (
                                <ScoreGauge 
                                  key={key}
                                  score={value as number}
                                  maxScore={10}
                                  label={key.replace(/_/g, ' ').substring(0, 15)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scores Detail Tab */}
          <TabsContent value="scores">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Scores par dimension</CardTitle>
                <CardDescription>Résultats calculés sur {campaign.result.responseCount} réponses</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreBars scores={campaign.result.scores} maxScore={10} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indicators">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Indicateurs critiques</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(campaign.result.criticalIndicators || {}).length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium">Aucune alerte détectée</p>
                      <p className="text-sm text-muted-foreground">Tous les indicateurs sont dans les seuils acceptables</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(campaign.result.criticalIndicators).map(([key, indicator]: [string, any]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border ${
                          indicator.severity === 'critical' ? 'bg-destructive/10 border-destructive/20' :
                          indicator.severity === 'high' ? 'bg-warning/10 border-warning/20' :
                          'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            indicator.severity === 'critical' ? 'text-destructive' :
                            indicator.severity === 'high' ? 'text-warning' : 'text-muted-foreground'
                          }`} />
                          <div>
                            <p className="font-medium">{indicator.message}</p>
                            {indicator.recommendation && (
                              <p className="text-sm text-muted-foreground mt-1">{indicator.recommendation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Métriques financières</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.result.financialMetrics ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(campaign.result.financialMetrics).map(([key, value]) => (
                      <div key={key} className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                        <p className="text-2xl font-bold text-primary">
                          {typeof value === 'number' 
                            ? value >= 1000 
                              ? `${Math.round(value).toLocaleString('fr-FR')}€`
                              : value.toFixed(2)
                            : value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune métrique financière disponible pour ce type d'enquête</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="narrative">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Synthèse narrative</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.result.narrative ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {campaign.result.narrative}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Aucune synthèse générée</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Not enough responses warning */}
      {campaign.result && !meetsThreshold && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="font-medium">Résultats incomplets</p>
                <p className="text-sm text-muted-foreground">
                  Le seuil d'anonymat ({campaign.minRespondents} réponses) n'est pas atteint.
                  Les résultats ne seront affichés qu'une fois ce seuil franchi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Dialog */}
      <AlertDialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lancer la campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une fois lancée, vous ne pourrez plus modifier les paramètres de la campagne.
              Les répondants pourront accéder au questionnaire via le lien généré.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLaunch} disabled={actionLoading}>
              {actionLoading ? 'Lancement...' : 'Lancer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer la campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              {campaign._count.responses < campaign.minRespondents ? (
                <span className="text-warning">
                  Attention : vous n'avez que {campaign._count.responses} réponses sur {campaign.minRespondents} minimum requis.
                  Le seuil d'anonymat ne sera pas respecté.
                </span>
              ) : (
                'La campagne sera clôturée et les résultats seront calculés. Les répondants ne pourront plus participer.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClose} 
              disabled={actionLoading || campaign._count.responses < campaign.minRespondents}
            >
              {actionLoading ? 'Clôture...' : 'Clôturer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
