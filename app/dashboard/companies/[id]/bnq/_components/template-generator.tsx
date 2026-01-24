'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  Eye,
  FileCheck,
  Scroll,
  Users,
  Shield,
  ClipboardSignature,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_TEMPLATES } from '@/lib/bnq-templates';

interface TemplateGeneratorProps {
  companyId: string;
  companyName: string;
}

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  'NOTE_INTENTION': Scroll,
  'POLITIQUE_SME': FileCheck,
  'MANDAT_COMITE': Users,
  'MESURES_CONFIDENTIALITE': Shield,
  'CONSENTEMENT_COLLECTE': ClipboardSignature,
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  'NOTE_INTENTION': 'Document officiel d\'engagement de la direction envers la démarche santé mieux-être',
  'POLITIQUE_SME': 'Politique complète définissant les principes et engagements de l\'entreprise',
  'MANDAT_COMITE': 'Définition du rôle, composition et fonctionnement du comité SME',
  'MESURES_CONFIDENTIALITE': 'Document décrivant les mesures de protection des données personnelles',
  'CONSENTEMENT_COLLECTE': 'Formulaire de consentement pour la collecte de données',
};

export function TemplateGenerator({ companyId, companyName }: TemplateGeneratorProps) {
  const { toast } = useToast();
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  const handleGenerateTemplate = async (templateCode: string) => {
    setLoadingTemplate(templateCode);
    try {
      const url = `/api/bnq/templates/${templateCode}?companyId=${companyId}`;
      
      // Open in new window for printing/saving as PDF
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.focus();
      }
      
      toast({
        title: 'Template généré',
        description: 'Le document s\'est ouvert dans un nouvel onglet. Utilisez Ctrl+P pour imprimer ou sauvegarder en PDF.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le template',
        variant: 'destructive',
      });
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleGenerateComplianceReport = () => {
    const url = `/api/bnq/companies/${companyId}/compliance-report`;
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.focus();
    }
    toast({
      title: 'Rapport généré',
      description: 'Le rapport de conformité s\'est ouvert dans un nouvel onglet.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Compliance Report Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rapport de Conformité BNQ</CardTitle>
                  <CardDescription>
                    Générez un rapport complet de l'état d'avancement vers la certification
                  </CardDescription>
                </div>
              </div>
              <Button onClick={handleGenerateComplianceReport} className="gap-2">
                <Download className="h-4 w-4" />
                Générer le rapport
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Ce rapport inclut :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Progression globale et par catégorie</li>
                <li>État des documents (approuvés, en attente, manquants)</li>
                <li>Avancement du workflow d'adhésion</li>
                <li>Conformité aux exigences BNQ</li>
                <li>Synthèse du plan d'action</li>
                <li>Alertes actives</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scroll className="h-5 w-5 text-purple-600" />
            Modèles de documents BNQ
          </CardTitle>
          <CardDescription>
            Générez des documents pré-remplis conformes à la norme BNQ 9700-800.
            Les documents s'ouvrent dans un nouvel onglet pour impression ou export PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_TEMPLATES.map((template, index) => {
              const Icon = TEMPLATE_ICONS[template.code] || FileText;
              const description = TEMPLATE_DESCRIPTIONS[template.code];
              const isLoading = loadingTemplate === template.code;

              return (
                <motion.div
                  key={template.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg shrink-0">
                          <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight">
                            {template.name}
                          </h4>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {template.article}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleGenerateTemplate(template.code)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="animate-spin">\u2699</span>
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          Aperçu
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleGenerateTemplate(template.code)}
                          disabled={isLoading}
                        >
                          <Printer className="h-3 w-3" />
                          Générer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Comment exporter en PDF ?
            </h4>
            <ol className="mt-2 text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>1. Cliquez sur "Générer" pour ouvrir le document dans un nouvel onglet</li>
              <li>2. Appuyez sur <strong>Ctrl+P</strong> (ou Cmd+P sur Mac) pour ouvrir la boîte d'impression</li>
              <li>3. Sélectionnez <strong>"Enregistrer en PDF"</strong> comme destination</li>
              <li>4. Cliquez sur "Enregistrer" pour télécharger le fichier PDF</li>
            </ol>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
              Les champs entre [crochets] sont à compléter manuellement après génération.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
