'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, Info, FileX, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardContext } from '../../_components/dashboard-layout-client';
import Link from 'next/link';

interface Alert {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  dueDate?: string;
  isRead?: boolean;
  isResolved?: boolean;
  isDynamic: boolean;
}

interface AlertStats {
  critical: number;
  warning: number;
  info: number;
  resolved: number;
}

export function AlertsContent() {
  const { currentCompanyId } = useDashboardContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({ critical: 0, warning: 0, info: 0, resolved: 0 });
  const [totalMissingDocs, setTotalMissingDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const url = currentCompanyId 
          ? `/api/alerts?companyId=${currentCompanyId}`
          : '/api/alerts';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
          setStats(data.stats || { critical: 0, warning: 0, info: 0, resolved: 0 });
          setTotalMissingDocs(data.totalMissingDocuments || 0);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [currentCompanyId]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: AlertTriangle,
          bg: 'bg-error/5',
          border: 'border-error/20',
          iconColor: 'text-error',
          badge: <Badge variant="destructive">Critique</Badge>,
        };
      case 'WARNING':
        return {
          icon: Clock,
          bg: 'bg-warning/5',
          border: 'border-warning/20',
          iconColor: 'text-warning',
          badge: <Badge className="bg-warning text-warning-foreground">Attention</Badge>,
        };
      default:
        return {
          icon: Info,
          bg: 'bg-info/5',
          border: 'border-info/20',
          iconColor: 'text-info',
          badge: <Badge variant="secondary">Info</Badge>,
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-ui text-muted-foreground mb-2">
            AlterValue &gt; Alertes & Rappels
          </p>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Alertes & Rappels
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivez les échéances et les actions prioritaires de vos missions.
          </p>
        </div>
        <Link href="/dashboard/alerts/config">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-error/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-error/10">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Critiques</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <FileX className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.warning}</p>
                <p className="text-sm text-muted-foreground">Documents manquants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Info className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.info}</p>
                <p className="text-sm text-muted-foreground">Informations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Résolues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes actives ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune alerte active</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const config = getSeverityConfig(alert.severity);
                const Icon = config.icon;
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg ${config.bg} border ${config.border}`}
                  >
                    <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{alert.title}</p>
                        {config.badge}
                        {alert.companyName && (
                          <Badge variant="outline" className="text-xs">
                            {alert.companyName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
