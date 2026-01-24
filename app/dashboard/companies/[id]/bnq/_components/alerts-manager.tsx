'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  Plus,
  X,
  Eye,
  EyeOff,
  Loader2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ALERT_TYPE_LABELS, ALERT_SEVERITY_LABELS } from '@/lib/bnq-requirements';
import type { AlertType, AlertSeverity } from '@prisma/client';

interface BnqAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggerDate: string;
  dueDate: string | null;
  isRead: boolean;
  isDismissed: boolean;
  isResolved: boolean;
  isRecurring: boolean;
  recurrencePattern: string | null;
}

interface AlertsManagerProps {
  companyId: string;
}

const SEVERITY_ICONS = {
  INFO: Info,
  WARNING: AlertTriangle,
  URGENT: AlertCircle,
  CRITICAL: XCircle,
};

export function AlertsManager({ companyId }: AlertsManagerProps) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<BnqAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newAlert, setNewAlert] = useState({
    type: 'CUSTOM' as AlertType,
    severity: 'WARNING' as AlertSeverity,
    title: '',
    message: '',
    triggerDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    isRecurring: false,
    recurrencePattern: '',
  });

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
  }, [companyId, showResolved]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (showResolved) params.append('includeResolved', 'true');
      
      const response = await fetch(`/api/bnq/companies/${companyId}/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create alert
  const handleCreateAlert = async () => {
    if (!newAlert.title || !newAlert.message) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/bnq/companies/${companyId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAlert,
          triggerDate: new Date(newAlert.triggerDate).toISOString(),
          dueDate: newAlert.dueDate ? new Date(newAlert.dueDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        toast({ title: 'Alerte créée' });
        setIsCreateOpen(false);
        setNewAlert({
          type: 'CUSTOM',
          severity: 'WARNING',
          title: '',
          message: '',
          triggerDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          isRecurring: false,
          recurrencePattern: '',
        });
        fetchAlerts();
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Update alert status
  const handleUpdateAlert = async (alertId: string, updates: Partial<BnqAlert>) => {
    try {
      const response = await fetch(`/api/bnq/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast({ title: 'Alerte mise à jour' });
        fetchAlerts();
      }
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  // Delete alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/bnq/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Alerte supprimée' });
        fetchAlerts();
      }
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  // Scan and generate automatic alerts
  const [scanning, setScanning] = useState(false);
  
  const generateAutomaticAlerts = async () => {
    setScanning(true);
    try {
      const response = await fetch(`/api/bnq/companies/${companyId}/alerts/scan`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.alertsCreated > 0) {
          toast({
            title: `${data.alertsCreated} alerte(s) générée(s)`,
            description: `Documents: ${data.summary.documentExpiry + data.summary.missingDocuments}, Workflow: ${data.summary.workflowOverdue}, Interventions: ${data.summary.interventionDeadline}`,
          });
        } else {
          toast({
            title: 'Scan terminé',
            description: 'Aucune nouvelle alerte détectée.',
          });
        }
        fetchAlerts();
      } else {
        throw new Error('Erreur lors du scan');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de scanner les alertes',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.type !== filterType) return false;
    return true;
  });

  // Group alerts by severity
  const criticalAlerts = filteredAlerts.filter(a => a.severity === 'CRITICAL' && !a.isResolved);
  const urgentAlerts = filteredAlerts.filter(a => a.severity === 'URGENT' && !a.isResolved);
  const warningAlerts = filteredAlerts.filter(a => a.severity === 'WARNING' && !a.isResolved);
  const infoAlerts = filteredAlerts.filter(a => a.severity === 'INFO' && !a.isResolved);
  const resolvedAlerts = filteredAlerts.filter(a => a.isResolved);

  const activeAlertsCount = criticalAlerts.length + urgentAlerts.length + warningAlerts.length + infoAlerts.length;

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
            <Bell className="h-5 w-5 text-amber-600" />
            Alertes et Rappels BNQ
            {activeAlertsCount > 0 && (
              <Badge variant="destructive">{activeAlertsCount}</Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Suivez les échéances et les actions requises
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAutomaticAlerts} disabled={scanning}>
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {scanning ? 'Scan...' : 'Scanner'}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rappel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={criticalAlerts.length > 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <XCircle className={`h-8 w-8 ${criticalAlerts.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={urgentAlerts.length > 0 ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold text-orange-600">{urgentAlerts.length}</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${urgentAlerts.length > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={warningAlerts.length > 0 ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attention</p>
                <p className="text-2xl font-bold text-amber-600">{warningAlerts.length}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${warningAlerts.length > 0 ? 'text-amber-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Infos</p>
                <p className="text-2xl font-bold text-blue-600">{infoAlerts.length}</p>
              </div>
              <Info className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(ALERT_TYPE_LABELS).map(([key, info]) => (
              <SelectItem key={key} value={key}>{info.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            checked={showResolved}
            onCheckedChange={setShowResolved}
            id="show-resolved"
          />
          <Label htmlFor="show-resolved" className="text-sm">
            Afficher les alertes résolues
          </Label>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Aucune alerte active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Toutes les alertes ont été traitées ou vous n'avez pas encore d'alertes configurées.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAlerts.map(alert => {
              const severityInfo = ALERT_SEVERITY_LABELS[alert.severity];
              const typeInfo = ALERT_TYPE_LABELS[alert.type];
              const SeverityIcon = SEVERITY_ICONS[alert.severity];
              const isOverdue = alert.dueDate && new Date(alert.dueDate) < new Date() && !alert.isResolved;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={`${alert.isResolved ? 'opacity-60' : ''} ${isOverdue ? 'border-red-400' : ''}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${severityInfo.color}`}>
                          <SeverityIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant="outline">{typeInfo.name}</Badge>
                            {alert.isRecurring && (
                              <Badge variant="secondary">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {alert.recurrencePattern}
                              </Badge>
                            )}
                            {alert.isResolved && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Résolu
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge variant="destructive">
                                <Clock className="h-3 w-3 mr-1" />
                                En retard
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Créée: {new Date(alert.triggerDate).toLocaleDateString('fr-FR')}
                            </span>
                            {alert.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" />
                                Échéance: {new Date(alert.dueDate).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!alert.isResolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateAlert(alert.id, { isResolved: true })}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Résoudre
                            </Button>
                          )}
                          {!alert.isRead && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateAlert(alert.id, { isRead: true })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Alert Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau rappel</DialogTitle>
            <DialogDescription>
              Créez un rappel personnalisé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={newAlert.title}
                onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du rappel"
              />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={newAlert.message}
                onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Description du rappel..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={newAlert.type}
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, type: v as AlertType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALERT_TYPE_LABELS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sévérité</Label>
                <Select
                  value={newAlert.severity}
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, severity: v as AlertSeverity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALERT_SEVERITY_LABELS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date déclenchement</Label>
                <Input
                  type="date"
                  value={newAlert.triggerDate}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, triggerDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Échéance (optionnel)</Label>
                <Input
                  type="date"
                  value={newAlert.dueDate}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={newAlert.isRecurring}
                onCheckedChange={(checked) => setNewAlert(prev => ({ ...prev, isRecurring: checked }))}
                id="is-recurring"
              />
              <Label htmlFor="is-recurring">Récurrent</Label>
              {newAlert.isRecurring && (
                <Select
                  value={newAlert.recurrencePattern}
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, recurrencePattern: v }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensuel</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestriel</SelectItem>
                    <SelectItem value="ANNUAL">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAlert} disabled={saving || !newAlert.title || !newAlert.message}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
