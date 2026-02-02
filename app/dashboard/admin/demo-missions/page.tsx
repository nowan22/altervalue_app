'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Dices,
  Building2,
  ArrowLeft,
  Loader2,
  PlayCircle,
  AlertTriangle,
  Users,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DemoDataDialog from '@/app/dashboard/_components/demo-data-dialog';
import Link from 'next/link';

interface DemoCompany {
  id: string;
  name: string;
  sector: string;
  employeesCount: number;
  campaigns: {
    id: string;
    name: string;
    status: string;
    _count: { responses: number };
    launchedAt: string | null;
  }[];
}

export default function DemoMissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<DemoCompany[]>([]);

  const userIsSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!userIsSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchDemoCompanies();
  }, [sessionStatus, userIsSuperAdmin]);

  const fetchDemoCompanies = async () => {
    try {
      const res = await fetch('/api/admin/demo-missions');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les missions démo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
          <p className="text-muted-foreground">Chargement des missions démo...</p>
        </div>
      </div>
    );
  }

  if (!userIsSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Dices className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Missions Démo</h1>
              <p className="text-muted-foreground">Génération de données de test</p>
            </div>
          </div>
        </div>
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
          {companies.length} mission{companies.length > 1 ? 's' : ''} démo
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium">Fonctionnalité réservée aux Super-Administrateurs</p>
          <p className="mt-1 text-amber-600 dark:text-amber-400">
            Cette page liste toutes les missions de démonstration et permet de générer des données
            de test pour chaque campagne. Les données générées sont marquées comme synthétiques
            et n'affectent pas les statistiques globales.
          </p>
        </div>
      </div>

      {/* Companies List */}
      {companies.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Dices className="h-16 w-16 mx-auto text-amber-500/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucune mission démo</h3>
            <p className="text-muted-foreground mb-6">
              Créez une mission avec l'option "Démonstration" cochée pour la voir apparaître ici.
            </p>
            <Link href="/dashboard/companies/new">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Building2 className="h-4 w-4 mr-2" />
                Créer une mission démo
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => (
            <Card key={company.id} className="border-amber-200 dark:border-amber-800/50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {company.name}
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs">
                          🎲 DÉMO
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {company.sector} • {company.employeesCount} salariés
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/dashboard/companies/${company.id}`}>
                    <Button variant="outline" size="sm">
                      Voir la mission <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Campagnes de cette mission :</h4>
                  {company.campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Aucune campagne créée</p>
                  ) : (
                    <div className="grid gap-3">
                      {company.campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-foreground">{campaign.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {campaign._count.responses} réponses
                                </span>
                                {campaign.launchedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Lancée le {new Date(campaign.launchedAt).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                campaign.status === 'ACTIVE'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : campaign.status === 'CLOSED'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-warning/10 text-warning border-warning/20'
                              }
                            >
                              {campaign.status === 'ACTIVE' ? 'Active' : campaign.status === 'CLOSED' ? 'Clôturée' : 'Brouillon'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {campaign.status === 'ACTIVE' && (
                              <DemoDataDialog
                                campaignId={campaign.id}
                                campaignName={campaign.name}
                                companyIsDemo={true}
                                userIsSuperAdmin={userIsSuperAdmin}
                              >
                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                                  <Dices className="h-4 w-4 mr-2" />
                                  Générer
                                </Button>
                              </DemoDataDialog>
                            )}
                            <Link href={`/dashboard/diagnostic/campaigns/${campaign.id}/results`}>
                              <Button variant="outline" size="sm">
                                Résultats
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
