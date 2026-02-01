'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileCheck, 
  ClipboardCheck, 
  Shield, 
  Award,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Target,
  Bell,
  FileOutput,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DocumentVault } from './document-vault';
import { WorkflowValidation } from './workflow-validation';
import { RequirementsChecklist } from './requirements-checklist';
import { ActionPlanManager } from './action-plan-manager';
import { AlertsManager } from './alerts-manager';
import { TemplateGenerator } from './template-generator';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { BnqLevel } from '@prisma/client';

interface BnqContentProps {
  company: {
    id: string;
    name: string;
    employeesCount: number;
    documents: Array<{
      id: string;
      fileName: string;
      fileUrl: string | null;
      status: string;
      version: number;
      createdAt: string;
      validatedAt: string | null;
      notes?: string | null;
      documentType: {
        id: string;
        code: string;
        name: string;
        category: string;
        bnqArticle: string | null;
        requiredForLevel: string;
        isOptional: boolean;
        revisionFrequency: string | null;
      };
    }>;
    workflowSteps: Array<{
      id: string;
      stepNumber: number;
      stepCode: string;
      stepName: string;
      description: string | null;
      status: string;
      completedAt: string | null;
      signature: string | null;
      tasks: Array<{
        id: string;
        taskCode: string;
        taskName: string;
        isRequired: boolean;
        isCompleted: boolean;
      }>;
    }>;
    checklistItems: Array<{
      id: string;
      articleRef: string;
      requirement: string;
      isCompliant: boolean | null;
      evaluatedAt: string | null;
      evidence: string | null;
      notes: string | null;
    }>;
    bnqProgress: {
      targetLevel: string;
      currentProgress: number;
      documentsProgress: number;
      checklistProgress: number;
      workflowProgress: number;
      actionsProgress: number;
    } | null;
  };
  documentTypes: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    bnqArticle: string | null;
    requiredForLevel: string;
    isOptional: boolean;
    revisionFrequency: string | null;
    sortOrder: number;
  }>;
}

export function BnqContent({ company, documentTypes }: BnqContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  const progress = company.bnqProgress || {
    targetLevel: 'ES',
    currentProgress: 0,
    documentsProgress: 0,
    workflowProgress: 0,
  };

  const targetLevel = progress.targetLevel as BnqLevel;
  const levelInfo = BNQ_LEVEL_LABELS[targetLevel];

  // Calculate document stats
  const requiredDocs = documentTypes.filter(dt => !dt.isOptional && dt.requiredForLevel === 'ES');
  const uploadedDocs = company.documents.filter(d => d.status !== 'ARCHIVED');
  const approvedDocs = uploadedDocs.filter(d => d.status === 'APPROVED');
  const pendingDocs = uploadedDocs.filter(d => d.status === 'PENDING_VALIDATION');
  const missingDocs = requiredDocs.filter(
    dt => !uploadedDocs.some(d => d.documentType.id === dt.id)
  );

  // Calculate workflow stats
  const completedSteps = company.workflowSteps.filter(s => s.status === 'COMPLETED');
  const inProgressSteps = company.workflowSteps.filter(s => s.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/companies/${company.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              <Shield className="h-7 w-7 text-secondary" />
              Conformité BNQ 9700-800
            </h1>
            <p className="text-muted-foreground">{company.name}</p>
          </div>
        </div>
        <Badge className={`${levelInfo.color} text-white px-3 py-1`}>
          Objectif : {levelInfo.badge} {levelInfo.name}
        </Badge>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card border-secondary/20 bg-gradient-to-r from-secondary/10 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Progression vers la certification {levelInfo.badge}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progression globale</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(progress.currentProgress)}%
                  </span>
                </div>
                <Progress value={progress.currentProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Documents Progress */}
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/20 rounded-lg">
                        <FileText className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Documents</p>
                        <p className="text-lg font-bold">
                          {approvedDocs.length + pendingDocs.length}/{requiredDocs.length}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={progress.documentsProgress} 
                      className="h-2 mt-3" 
                    />
                  </CardContent>
                </Card>

                {/* Workflow Progress */}
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/20 rounded-lg">
                        <ClipboardCheck className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Workflow</p>
                        <p className="text-lg font-bold">
                          {completedSteps.length}/{company.workflowSteps.length} étapes
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={progress.workflowProgress} 
                      className="h-2 mt-3" 
                    />
                  </CardContent>
                </Card>

                {/* Status */}
                <Card className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        progress.currentProgress >= 100 
                          ? 'bg-success/20' 
                          : progress.currentProgress >= 50 
                            ? 'bg-warning/20' 
                            : 'bg-error/20'
                      }`}>
                        {progress.currentProgress >= 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : progress.currentProgress >= 50 ? (
                          <Clock className="h-5 w-5 text-warning" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-error" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Statut</p>
                        <p className="text-lg font-bold">
                          {progress.currentProgress >= 100 
                            ? 'Prêt' 
                            : progress.currentProgress >= 50 
                              ? 'En cours' 
                              : 'À démarrer'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Missing Documents Alert */}
              {missingDocs.length > 0 && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {missingDocs.length} document(s) obligatoire(s) manquant(s)
                      </p>
                      <ul className="mt-2 space-y-1">
                        {missingDocs.slice(0, 3).map(doc => (
                          <li key={doc.id} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ChevronRight className="h-3 w-3" />
                            {doc.name} ({doc.bnqArticle})
                          </li>
                        ))}
                        {missingDocs.length > 3 && (
                          <li className="text-sm text-muted-foreground">
                            ... et {missingDocs.length - 3} autre(s)
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Exigences</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Plan d'action</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertes</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileOutput className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-6">
          <RequirementsChecklist
            companyId={company.id}
            targetLevel={targetLevel}
            checklistItems={company.checklistItems || []}
            linkedDocuments={company.documents.map(d => ({
              id: d.id,
              documentType: { code: d.documentType.code, name: d.documentType.name },
              status: d.status,
            }))}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentVault
            companyId={company.id}
            documents={company.documents}
            documentTypes={documentTypes}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <WorkflowValidation
            companyId={company.id}
            workflowSteps={company.workflowSteps}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <ActionPlanManager
            companyId={company.id}
            companyName={company.name}
            targetLevel={targetLevel}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertsManager companyId={company.id} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateGenerator
            companyId={company.id}
            companyName={company.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
