'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  ListChecks,
  Target,
  Bell,
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileOutput,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBnqContext } from './bnq-layout-client';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { BnqLevel } from '@prisma/client';

interface BnqData {
  progress: {
    currentProgress: number;
    documentsProgress: number;
    workflowProgress: number;
    checklistProgress: number;
    actionsProgress: number;
    targetLevel: string;
  };
  stats: {
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    missingDocuments: number;
    totalSteps: number;
    completedSteps: number;
    totalChecklist: number;
    compliantItems: number;
    activeAlerts: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export function BnqOverviewContent() {
  const router = useRouter();
  const { selectedCompanyId, selectedCompany } = useBnqContext();
  const [data, setData] = useState<BnqData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchBnqData();
    }
  }, [selectedCompanyId]);

  const fetchBnqData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnq/overview?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching BNQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = data?.progress || {
    currentProgress: 0,
    documentsProgress: 0,
    workflowProgress: 0,
    checklistProgress: 0,
    actionsProgress: 0,
    targetLevel: 'ES',
  };

  const stats = data?.stats || {
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
    missingDocuments: 0,
    totalSteps: 0,
    completedSteps: 0,
    totalChecklist: 0,
    compliantItems: 0,
    activeAlerts: 0,
  };

  const targetLevel = progress.targetLevel as BnqLevel;
  const levelInfo = BNQ_LEVEL_LABELS[targetLevel];

  const quickAccess = [
    {
      id: 'requirements',
      label: 'Exigences',
      icon: ListChecks,
      href: '/dashboard/bnq/requirements',
      value: `${stats.compliantItems}/${stats.totalChecklist}`,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      href: '/dashboard/bnq/documents',
      value: `${stats.approvedDocuments + stats.pendingDocuments}/${stats.totalDocuments}`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      id: 'actions',
      label: 'Plan d\'actions',
      icon: Target,
      href: '/dashboard/bnq/actions',
      value: 'Voir',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: ClipboardCheck,
      href: '/dashboard/bnq/workflow',
      value: `${stats.completedSteps}/${stats.totalSteps}`,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      id: 'alerts',
      label: 'Alertes',
      icon: Bell,
      href: '/dashboard/bnq/alerts',
      value: stats.activeAlerts > 0 ? String(stats.activeAlerts) : '0',
      color: stats.activeAlerts > 0 ? 'text-warning' : 'text-muted-foreground',
      bgColor: stats.activeAlerts > 0 ? 'bg-warning/10' : 'bg-muted/50',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Main Progress */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression globale</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(progress.currentProgress)}%
                  </span>
                </div>
                <Progress value={progress.currentProgress} className="h-3" />
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-4 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {stats.approvedDocuments + stats.pendingDocuments}
                  </div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {stats.completedSteps}/{stats.totalSteps}
                  </div>
                  <div className="text-xs text-muted-foreground">Étapes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {stats.compliantItems}
                  </div>
                  <div className="text-xs text-muted-foreground">Conformes</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${stats.activeAlerts > 0 ? 'text-warning' : 'text-foreground'}`}>
                    {stats.activeAlerts}
                  </div>
                  <div className="text-xs text-muted-foreground">Alertes</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Access Grid */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Accès rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickAccess.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="glass-card hover:border-primary/30 cursor-pointer transition-all group"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Statut de certification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Documents */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress.documentsProgress} className="w-24 h-2" />
                <span className="text-sm font-medium w-10 text-right">
                  {Math.round(progress.documentsProgress)}%
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Exigences</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress.checklistProgress} className="w-24 h-2" />
                <span className="text-sm font-medium w-10 text-right">
                  {Math.round(progress.checklistProgress)}%
                </span>
              </div>
            </div>

            {/* Workflow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress.workflowProgress} className="w-24 h-2" />
                <span className="text-sm font-medium w-10 text-right">
                  {Math.round(progress.workflowProgress)}%
                </span>
              </div>
            </div>

            {/* Missing docs alert */}
            {stats.missingDocuments > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg mt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">
                    {stats.missingDocuments} document(s) manquant(s)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 5).map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="p-1 bg-muted rounded mt-0.5">
                      {activity.type === 'document' ? (
                        <FileText className="h-3 w-3 text-muted-foreground" />
                      ) : activity.type === 'checklist' ? (
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString('fr-CA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
