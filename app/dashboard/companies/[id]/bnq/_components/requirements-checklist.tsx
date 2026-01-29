'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  Filter,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  BNQ_REQUIREMENTS,
  BNQ_CHAPTER_TITLES,
  getRequirementsByChapter,
  type BnqRequirementData,
} from '@/lib/bnq-requirements';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { BnqLevel } from '@prisma/client';

interface ChecklistItem {
  id: string;
  articleRef: string;
  requirement: string;
  isCompliant: boolean | null;
  evaluatedAt: string | null;
  evidence: string | null;
  notes: string | null;
}

interface RequirementsChecklistProps {
  companyId: string;
  targetLevel: BnqLevel;
  checklistItems: ChecklistItem[];
  linkedDocuments: Array<{
    id: string;
    documentType: { code: string; name: string };
    status: string;
  }>;
}

export function RequirementsChecklist({
  companyId,
  targetLevel,
  checklistItems,
  linkedDocuments,
}: RequirementsChecklistProps) {
  const { toast } = useToast();
  const [expandedChapters, setExpandedChapters] = useState<number[]>([5]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'compliant' | 'non-compliant' | 'not-evaluated'>('all');
  const [localChecklist, setLocalChecklist] = useState<Map<string, boolean | null>>(new Map());
  const [saving, setSaving] = useState<string | null>(null);

  // Initialize local checklist from props
  useEffect(() => {
    const map = new Map<string, boolean | null>();
    checklistItems.forEach(item => {
      map.set(item.articleRef, item.isCompliant);
    });
    setLocalChecklist(map);
  }, [checklistItems]);

  const chapters = [5, 6, 7, 8, 9];
  const levelOrder = { ES: 1, ESE: 2, ESE_PLUS: 3 };

  // Filter requirements by level
  const getFilteredRequirements = (chapter: number): BnqRequirementData[] => {
    let reqs = getRequirementsByChapter(chapter, targetLevel);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      reqs = reqs.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.section.toLowerCase().includes(term) ||
        r.requirement.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      reqs = reqs.filter(r => {
        const status = localChecklist.get(r.section);
        if (filterStatus === 'compliant') return status === true;
        if (filterStatus === 'non-compliant') return status === false;
        if (filterStatus === 'not-evaluated') return status === null || status === undefined;
        return true;
      });
    }
    
    return reqs;
  };

  // Calculate progress
  const calculateProgress = () => {
    const allReqs = BNQ_REQUIREMENTS.filter(r => 
      levelOrder[r.requiredForLevel] <= levelOrder[targetLevel]
    );
    const compliant = allReqs.filter(r => localChecklist.get(r.section) === true).length;
    const nonCompliant = allReqs.filter(r => localChecklist.get(r.section) === false).length;
    const notEvaluated = allReqs.length - compliant - nonCompliant;
    
    return {
      total: allReqs.length,
      compliant,
      nonCompliant,
      notEvaluated,
      percentage: allReqs.length > 0 ? Math.round((compliant / allReqs.length) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  // Toggle chapter expansion
  const toggleChapter = (chapter: number) => {
    setExpandedChapters(prev => 
      prev.includes(chapter) 
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  // Update compliance status
  const handleComplianceChange = async (section: string, isCompliant: boolean | null) => {
    setSaving(section);
    
    // Optimistic update
    const previousValue = localChecklist.get(section);
    setLocalChecklist(prev => new Map(prev).set(section, isCompliant));
    
    try {
      const response = await fetch('/api/bnq/requirements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          articleRef: section,
          isCompliant,
        }),
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      toast({
        title: isCompliant === true ? 'Conforme' : isCompliant === false ? 'Non conforme' : 'Non évalué',
        description: `Exigence ${section} mise à jour`,
      });
    } catch (error) {
      // Revert on error
      setLocalChecklist(prev => new Map(prev).set(section, previousValue ?? null));
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  // Get linked document for a requirement
  const getLinkedDocument = (documentCode?: string) => {
    if (!documentCode) return null;
    return linkedDocuments.find(d => d.documentType.code === documentCode);
  };

  // Render compliance badge
  const renderComplianceBadge = (section: string, isOptional: boolean) => {
    const status = localChecklist.get(section);
    
    if (status === true) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Conforme
        </Badge>
      );
    }
    if (status === false) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3 mr-1" />
          Non conforme
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <HelpCircle className="h-3 w-3 mr-1" />
        { isOptional ? 'Optionnel' : 'Non évalué'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Conformité aux exigences BNQ</span>
            <Badge className={BNQ_LEVEL_LABELS[targetLevel].color + ' text-white'}>
              Objectif : {BNQ_LEVEL_LABELS[targetLevel].badge}
            </Badge>
          </CardTitle>
          <CardDescription>
            {progress.total} exigences à satisfaire pour le niveau {BNQ_LEVEL_LABELS[targetLevel].name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={progress.percentage} className="flex-1" />
              <span className="text-2xl font-bold text-blue-600">{progress.percentage}%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600">{progress.compliant}</div>
                <div className="text-xs text-muted-foreground">Conformes</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-2xl font-bold text-red-600">{progress.nonCompliant}</div>
                <div className="text-xs text-muted-foreground">Non conformes</div>
              </div>
              <div className="p-3 rounded-lg bg-muted dark:bg-card">
                <div className="text-2xl font-bold text-muted-foreground">{progress.notEvaluated}</div>
                <div className="text-xs text-muted-foreground">Non évalués</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une exigence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="compliant">Conformes</SelectItem>
            <SelectItem value="non-compliant">Non conformes</SelectItem>
            <SelectItem value="not-evaluated">Non évaluées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {chapters.map(chapter => {
          const requirements = getFilteredRequirements(chapter);
          const chapterCompliant = requirements.filter(r => localChecklist.get(r.section) === true).length;
          const isExpanded = expandedChapters.includes(chapter);
          
          return (
            <Collapsible
              key={chapter}
              open={isExpanded}
              onOpenChange={() => toggleChapter(chapter)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base">
                            Chapitre {chapter} - {BNQ_CHAPTER_TITLES[chapter]}
                          </CardTitle>
                          <CardDescription>
                            {requirements.length} exigences • {chapterCompliant} conformes
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={requirements.length > 0 ? (chapterCompliant / requirements.length) * 100 : 0} 
                          className="w-24 h-2"
                        />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {requirements.length > 0 ? Math.round((chapterCompliant / requirements.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {requirements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune exigence trouvée
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {requirements.map((req) => {
                          const linkedDoc = getLinkedDocument(req.linkedDocumentCode);
                          const status = localChecklist.get(req.section);
                          
                          return (
                            <motion.div
                              key={req.section}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono">
                                      Art. {req.section}
                                    </Badge>
                                    {renderComplianceBadge(req.section, req.isOptional)}
                                    {req.requiredForLevel !== 'ES' && (
                                      <Badge variant="secondary" className="text-xs">
                                        {BNQ_LEVEL_LABELS[req.requiredForLevel].badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-medium">{req.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {req.requirement}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {req.frequency && (
                                      <span>📅 Fréquence: {req.frequency}</span>
                                    )}
                                    {req.verificationMethod && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                              <AlertCircle className="h-3 w-3" />
                                              Vérification
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{req.verificationMethod}</p>
                                            {req.evidence && <p className="text-muted-foreground">Preuve: {req.evidence}</p>}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {linkedDoc && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {linkedDoc.status === 'APPROVED' ? (
                                          <span className="text-green-600">{linkedDoc.documentType.name} ✓</span>
                                        ) : (
                                          <span>{linkedDoc.documentType.name}</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {saving === req.section ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <div className="flex gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant={status === true ? 'default' : 'ghost'}
                                              className={status === true ? 'bg-green-600 hover:bg-green-700' : ''}
                                              onClick={() => handleComplianceChange(req.section, status === true ? null : true)}
                                            >
                                              <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Marquer conforme</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant={status === false ? 'default' : 'ghost'}
                                              className={status === false ? 'bg-red-600 hover:bg-red-700' : ''}
                                              onClick={() => handleComplianceChange(req.section, status === false ? null : false)}
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Marquer non conforme</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
