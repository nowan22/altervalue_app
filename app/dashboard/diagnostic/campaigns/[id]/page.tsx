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
  Dices,
  ArrowRight,
  Gauge,
  Euro,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { QRCode } from '@/components/ui/qr-code';
import DemoDataDialog from '@/app/dashboard/_components/demo-data-dialog';

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
    isDemo?: boolean;
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
  
  // v4.3: Analytics summary for Executive Summary Card
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    globalScore: number | null;
    participationRate: number | null;
    presenteeismCost: number | null;
    loading: boolean;
  }>({ globalScore: null, participationRate: null, presenteeismCost: null, loading: false });

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
  
  // v4.3: Fetch analytics summary for closed/completed campaigns
  const fetchAnalyticsSummary = async () => {
    if (!campaign || (campaign.status !== 'CLOSED' && campaign.status !== 'COMPLETED')) return;
    if (campaign._count.responses < campaign.minRespondents) return;
    
    setAnalyticsSummary(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${params.id}/analytics`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      
      // Extract key KPIs from analytics data
      // sphereScores is an array of { sphere, score, name, short, color }
      const sphereScoresArray = data.sphereScores || [];
      const sphereValues = sphereScoresArray
        .map((s: { score: number }) => s.score)
        .filter((v: number) => typeof v === 'number' && !isNaN(v));
      const globalScore = sphereValues.length > 0 
        ? Math.round(sphereValues.reduce((a: number, b: number) => a + b, 0) / sphereValues.length)
        : null;
      
      // participationRate is nested in data.participation
      const participationRate = data.participation?.participationRate ?? null;
      
      // financialMetrics contains estimatedAnnualCost
      const presenteeismCost = data.financialMetrics?.estimatedAnnualCost ?? null;
      
      setAnalyticsSummary({
        globalScore,
        participationRate,
        presenteeismCost,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      setAnalyticsSummary(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);
  
  // Fetch analytics when campaign is loaded and closed/completed
  useEffect(() => {
    if (campaign && (campaign.status === 'CLOSED' || campaign.status === 'COMPLETED')) {
      fetchAnalyticsSummary();
    }
  }, [campaign?.id, campaign?.status]);

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

  // BUG #4 FIX: Now uses the same strategic-report endpoint as the results dashboard
  const downloadPdf = async () => {
    if (!campaign) return;
    
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${campaign.id}/strategic-report`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }));
        throw new Error(data.error || 'Erreur lors de la génération');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_strategique_${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'Succès', description: 'Rapport Stratégique PDF téléchargé' });
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
  
  // v4.2: Demo mode checks
  const companyIsDemo = campaign.company.isDemo === true;
  const userIsSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* v4.2: Demo Mode Banner - Discrete version */}
      {companyIsDemo && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-500 dark:text-zinc-400">
          <Dices className="h-3.5 w-3.5" />
          <span>Mission de démonstration — Données non issues d'une enquête réelle</span>
        </div>
      )}

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
              {companyIsDemo && (
                <Badge variant="outline" className="text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600 text-[10px] px-1.5">
                  DÉMO
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {campaign.surveyType.name} • {campaign.company.name}
            </p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {/* v4.2: Demo data generation dropdown (discrete) */}
            {companyIsDemo && userIsSuperAdmin && (campaign.status === 'DRAFT' || campaign.status === 'ACTIVE') && (
              <DemoDataDialog
                campaignId={campaign.id}
                campaignName={campaign.name}
                companyIsDemo={companyIsDemo}
                userIsSuperAdmin={userIsSuperAdmin}
                responseCount={campaign._count.responses}
              />
            )}
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
                <Link href={`/dashboard/diagnostic/campaigns/${campaign.id}/results`}>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard Expert
                  </Button>
                </Link>
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

      {/* Survey Link & QR Code (when active) */}
      {campaign.status === 'ACTIVE' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Link Section */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="font-medium text-lg mb-1">Lien de l'enquête</p>
                  <p className="text-sm text-muted-foreground break-all font-mono bg-background/50 p-2 rounded">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/survey/{campaign.token}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </Button>
                  <Button size="sm" asChild>
                    <a href={`/survey/${campaign.token}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir
                    </a>
                  </Button>
                </div>
              </div>
              
              {/* QR Code Section */}
              <div className="flex flex-col items-center gap-2 lg:border-l lg:pl-6 border-border/50">
                <p className="text-sm font-medium text-muted-foreground">QR Code</p>
                <QRCode
                  value={typeof window !== 'undefined' ? `${window.location.origin}/survey/${campaign.token}` : ''}
                  size={120}
                  downloadFileName={`qr-${campaign.name.replace(/\s+/g, '-').toLowerCase()}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* v4.3: Executive Summary Card - Replaces obsolete tabs */}
      {(campaign.status === 'CLOSED' || campaign.status === 'COMPLETED') && meetsThreshold && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Aperçu des résultats
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {campaign._count.responses} réponses analysées — Données calculées par le moteur BNQ Ultimate
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Résultats disponibles
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* 3 Key KPIs */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                {/* Global Score */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/60 border border-border/50">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Gauge className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score Global QVCT</p>
                    {analyticsSummary.loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : analyticsSummary.globalScore !== null ? (
                      <p className="text-2xl font-bold">
                        {analyticsSummary.globalScore}
                        <span className="text-lg text-muted-foreground">/100</span>
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                {/* Participation Rate */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/60 border border-border/50">
                  <div className="p-3 rounded-full bg-success/10">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de participation</p>
                    {analyticsSummary.loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : analyticsSummary.participationRate !== null ? (
                      <p className="text-2xl font-bold">
                        {analyticsSummary.participationRate}
                        <span className="text-lg text-muted-foreground">%</span>
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                {/* Presenteeism Cost */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/60 border border-border/50">
                  <div className="p-3 rounded-full bg-warning/10">
                    <Euro className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coût du présentéisme</p>
                    {analyticsSummary.loading ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                    ) : analyticsSummary.presenteeismCost !== null ? (
                      <p className="text-2xl font-bold">
                        {Math.round(analyticsSummary.presenteeismCost).toLocaleString('fr-FR')}
                        <span className="text-lg text-muted-foreground">€/an</span>
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Accédez au dashboard complet pour explorer les résultats par sphère, département, et visualiser la matrice des priorités.
                </p>
                <Link href={`/dashboard/diagnostic/campaigns/${campaign.id}/results`}>
                  <Button size="lg" className="bg-gradient-gold text-primary-foreground gap-2 whitespace-nowrap">
                    <BarChart3 className="h-5 w-5" />
                    Accéder au Dashboard complet
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
