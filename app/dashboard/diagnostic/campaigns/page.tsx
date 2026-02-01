'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  Play,
  CheckCircle,
  Clock,
  Archive,
  Users,
  Calendar,
  ExternalLink,
  MoreVertical,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useDashboardContext } from '../../_components/dashboard-layout-client';
import { useSession } from 'next-auth/react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  token: string;
  targetPopulation: number | null;
  minRespondents: number;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  launchedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  company: { id: string; name: string };
  surveyType: { id: string; typeId: string; name: string; category: string; estimatedDuration: number };
  _count: { responses: number };
  result: { responseCount: number; participationRate: number | null; calculatedAt: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', icon: ClipboardList },
  SCHEDULED: { label: 'Planifiée', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Calendar },
  ACTIVE: { label: 'En cours', color: 'bg-success/10 text-success border-success/20', icon: Play },
  CLOSED: { label: 'Clôturée', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  COMPLETED: { label: 'Terminée', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle },
  ARCHIVED: { label: 'Archivée', color: 'bg-muted text-muted-foreground', icon: Archive },
};

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentCompanyId } = useDashboardContext();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await fetch(`/api/diagnostic/campaigns?${params}`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les campagnes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentCompanyId, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/diagnostic/campaigns/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      toast({ title: 'Succès', description: 'Campagne supprimée' });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.surveyType.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreateCampaign = userRole !== 'OBSERVATEUR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Campagnes</h1>
          <p className="text-muted-foreground mt-1">Gérez vos enquêtes et diagnostics terrain</p>
        </div>
        {canCreateCampaign && (
          <Button asChild className="bg-gradient-gold text-primary-foreground">
            <Link href="/dashboard/diagnostic/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle campagne
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-input border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-input border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="ACTIVE">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
                <SelectItem value="ARCHIVED">Archivée</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchCampaigns()}
              disabled={loading}
              className="border-border"
              title="Rafraîchir la liste"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune campagne</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Aucune campagne ne correspond à vos critères'
                : 'Commencez par créer votre première campagne d\'enquête'}
            </p>
            {canCreateCampaign && !search && statusFilter === 'all' && (
              <Button asChild className="bg-gradient-gold text-primary-foreground">
                <Link href="/dashboard/diagnostic/campaigns/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign, index) => {
            const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusConfig.icon;
            const progress = campaign.targetPopulation
              ? Math.round((campaign._count.responses / campaign.targetPopulation) * 100)
              : null;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/dashboard/diagnostic/campaigns/${campaign.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                          {campaign.name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {campaign.surveyType.name}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/diagnostic/campaigns/${campaign.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {campaign.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/survey/${campaign.token}`);
                              toast({ title: 'Lien copié !' });
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Copier le lien
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'DRAFT' && canCreateCampaign && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(campaign.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge className={`${statusConfig.color} border mt-2 w-fit`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Réponses
                        </span>
                        <span className="font-medium">
                          {campaign._count.responses}
                          {campaign.targetPopulation && ` / ${campaign.targetPopulation}`}
                        </span>
                      </div>
                      {progress !== null && (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{campaign.company.name}</span>
                        <span className="text-muted-foreground">
                          {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La campagne et toutes ses données seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
