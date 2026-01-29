'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Save, AlertTriangle, Clock, FileText, Target, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardContext } from '../../../_components/dashboard-layout-client';
import { useToast } from '@/components/ui/use-toast';

interface AlertTypeConfig {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reminderDays: number;
}

const DEFAULT_ALERT_TYPES: AlertTypeConfig[] = [
  {
    id: 'document_expiry',
    type: 'DOCUMENT_EXPIRY',
    label: 'Expiration de documents',
    description: 'Alerte lorsqu\'un document est sur le point d\'expirer',
    icon: <FileText className="h-5 w-5" />,
    enabled: true,
    severity: 'CRITICAL',
    reminderDays: 30,
  },
  {
    id: 'document_missing',
    type: 'DOCUMENT_MISSING',
    label: 'Documents manquants',
    description: 'Alerte pour les documents requis non soumis',
    icon: <FileText className="h-5 w-5" />,
    enabled: true,
    severity: 'WARNING',
    reminderDays: 0,
  },
  {
    id: 'document_revision',
    type: 'DOCUMENT_REVISION',
    label: 'Révision de documents',
    description: 'Alerte pour les documents nécessitant une révision (3 ans)',
    icon: <Clock className="h-5 w-5" />,
    enabled: true,
    severity: 'WARNING',
    reminderDays: 60,
  },
  {
    id: 'workflow_overdue',
    type: 'WORKFLOW_OVERDUE',
    label: 'Étapes en retard',
    description: 'Alerte lorsqu\'une étape du workflow est en retard',
    icon: <AlertTriangle className="h-5 w-5" />,
    enabled: true,
    severity: 'WARNING',
    reminderDays: 7,
  },
  {
    id: 'intervention_deadline',
    type: 'INTERVENTION_DEADLINE',
    label: 'Échéances interventions',
    description: 'Alerte pour les interventions avec échéance proche',
    icon: <Target className="h-5 w-5" />,
    enabled: true,
    severity: 'INFO',
    reminderDays: 14,
  },
];

export function AlertConfigContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentCompanyId, currentCompany } = useDashboardContext();
  const [alertTypes, setAlertTypes] = useState<AlertTypeConfig[]>(DEFAULT_ALERT_TYPES);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentCompanyId) {
      fetchConfig();
    }
  }, [currentCompanyId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/config?companyId=${currentCompanyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config && data.config.length > 0) {
          // Merge with defaults
          const merged = DEFAULT_ALERT_TYPES.map(defaultType => {
            const saved = data.config.find((c: any) => c.type === defaultType.type);
            return saved ? { ...defaultType, ...saved } : defaultType;
          });
          setAlertTypes(merged);
        }
      }
    } catch (error) {
      console.error('Error fetching alert config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setAlertTypes(prev =>
      prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSeverityChange = (id: string, severity: 'CRITICAL' | 'WARNING' | 'INFO') => {
    setAlertTypes(prev =>
      prev.map(t => (t.id === id ? { ...t, severity } : t))
    );
  };

  const handleReminderChange = (id: string, days: number) => {
    setAlertTypes(prev =>
      prev.map(t => (t.id === id ? { ...t, reminderDays: days } : t))
    );
  };

  const handleSave = async () => {
    if (!currentCompanyId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une mission',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: currentCompanyId,
          config: alertTypes.map(t => ({
            type: t.type,
            enabled: t.enabled,
            severity: t.severity,
            reminderDays: t.reminderDays,
          })),
        }),
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Configuration des alertes enregistrée',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-error';
      case 'WARNING': return 'text-warning';
      default: return 'text-info';
    }
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/alerts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm font-ui text-muted-foreground mb-1">
              AlterValue &gt; Alertes &gt; Configuration
            </p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Configuration des alertes
            </h1>
            {currentCompany && (
              <p className="text-muted-foreground mt-1">
                Mission : {currentCompany.name}
              </p>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      {!currentCompanyId ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez une mission dans la barre latérale pour configurer ses alertes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alertTypes.map(alertType => (
            <Card key={alertType.id} className={!alertType.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${getSeverityColor(alertType.severity)}`}>
                      {alertType.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{alertType.label}</CardTitle>
                      <CardDescription>{alertType.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={alertType.enabled}
                    onCheckedChange={() => handleToggle(alertType.id)}
                  />
                </div>
              </CardHeader>
              {alertType.enabled && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Niveau de criticité</Label>
                      <Select
                        value={alertType.severity}
                        onValueChange={(v) => handleSeverityChange(alertType.id, v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRITICAL">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-error" />
                              Critique
                            </span>
                          </SelectItem>
                          <SelectItem value="WARNING">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-warning" />
                              Attention
                            </span>
                          </SelectItem>
                          <SelectItem value="INFO">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-info" />
                              Information
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {alertType.type !== 'DOCUMENT_MISSING' && (
                      <div className="space-y-2">
                        <Label>Rappel (jours avant)</Label>
                        <Select
                          value={String(alertType.reminderDays)}
                          onValueChange={(v) => handleReminderChange(alertType.id, parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 jours</SelectItem>
                            <SelectItem value="14">14 jours</SelectItem>
                            <SelectItem value="30">30 jours</SelectItem>
                            <SelectItem value="60">60 jours</SelectItem>
                            <SelectItem value="90">90 jours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
