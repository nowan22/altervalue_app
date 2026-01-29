'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Trash2,
  Calendar,
  User,
  Building2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_COLORS,
} from '@/lib/activity-logger';
import { ActivityType } from '@prisma/client';

interface ActivityLog {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  userRole: string;
  type: ActivityType;
  action: string;
  description: string | null;
  companyId: string | null;
  companyName: string | null;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ActivityLogsContentProps {
  initialLogs: ActivityLog[];
  users: UserOption[];
  companies: CompanyOption[];
}

export function ActivityLogsContent({
  initialLogs,
  users,
  companies,
}: ActivityLogsContentProps) {
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      const matchesSearch =
        search === '' ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.companyName?.toLowerCase().includes(search.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || log.type === typeFilter;

      // User filter
      const matchesUser = userFilter === 'all' || log.userId === userFilter;

      // Company filter
      const matchesCompany = companyFilter === 'all' || log.companyId === companyFilter;

      // Date filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        switch (dateRange) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesType && matchesUser && matchesCompany && matchesDate;
    });
  }, [logs, search, typeFilter, userFilter, companyFilter, dateRange]);

  // Stats by type
  const stats = useMemo(() => {
    const typeStats: Record<string, number> = {};
    logs.forEach((log) => {
      typeStats[log.type] = (typeStats[log.type] || 0) + 1;
    });
    return typeStats;
  }, [logs]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity-logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        toast({ title: 'Actualisé', description: 'Journal rafraîchi' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Échec du rafraîchissement', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThanMonths: 12 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Purge effectuée',
          description: `${data.deleted} enregistrements supprimés`,
        });
        handleRefresh();
      }
    } catch {
      toast({ title: 'Erreur', description: 'Échec de la purge', variant: 'destructive' });
    } finally {
      setLoading(false);
      setIsPurgeOpen(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group activity types for filter
  const activityTypes = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Journal d&apos;activité</h1>
          <p className="text-muted-foreground">
            {filteredLogs.length} enregistrement{filteredLogs.length !== 1 ? 's' : ''} affiché{filteredLogs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setIsPurgeOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Purger (&gt;12 mois)
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les actions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border"
            >
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Type d&apos;action</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACTIVITY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Utilisateur</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les utilisateurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Mission</label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les missions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les missions</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Période</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([type, count]) => (
            <Badge
              key={type}
              variant="outline"
              className={`${ACTIVITY_TYPE_COLORS[type as ActivityType]} cursor-pointer`}
              onClick={() => setTypeFilter(type)}
            >
              {ACTIVITY_TYPE_LABELS[type as ActivityType]}: {count}
            </Badge>
          ))}
      </div>

      {/* Logs List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique des actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune activité trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log, index) => {
                const IconComponent = ACTIVITY_TYPE_ICONS[log.type];
                const colorClass = ACTIVITY_TYPE_COLORS[log.type];
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_TYPE_LABELS[log.type]}
                          </Badge>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.userName}
                          </span>
                          {log.companyName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {log.companyName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purge Confirmation */}
      <AlertDialog open={isPurgeOpen} onOpenChange={setIsPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la purge</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer tous les logs plus vieux que 12 mois.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Purge en cours...' : 'Confirmer la purge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
