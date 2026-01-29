'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, FileSpreadsheet, FileImage, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function ExportsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingBnq, setLoadingBnq] = useState(false);

  const handleExportPdf = async () => {
    setLoadingPdf(true);
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'summary' }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rapport_QVCT_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'PDF généré avec succès', description: 'Le téléchargement a démarré.' });
      } else {
        toast({ title: 'Erreur', description: 'Échec de la génération du PDF', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setLoadingExcel(true);
    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'full' }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Export_KPI_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Excel généré avec succès', description: 'Le téléchargement a démarré.' });
      } else {
        toast({ title: 'Erreur', description: 'Échec de l\'export Excel', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleExportBnq = async () => {
    setLoadingBnq(true);
    try {
      // Redirect to companies page to select a company for BNQ report
      toast({ 
        title: 'Rapport BNQ', 
        description: 'Sélectionnez une mission pour générer le rapport de conformité BNQ.' 
      });
      router.push('/dashboard/companies');
    } finally {
      setLoadingBnq(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-ui text-muted-foreground mb-2">
          AlterValue &gt; Exports & Rapports
        </p>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Exports & Rapports
        </h1>
        <p className="text-muted-foreground mt-2">
          Générez et téléchargez vos rapports de performance QVCT.
        </p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Rapport PDF</CardTitle>
                <CardDescription>Rapport complet formaté</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Générez un rapport PDF professionnel avec les KPIs, graphiques et recommandations.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleExportPdf}
              disabled={loadingPdf}
            >
              {loadingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Générer PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <FileSpreadsheet className="h-6 w-6 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">Export Excel</CardTitle>
                <CardDescription>Données brutes analysables</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportez toutes les données KPI au format Excel pour vos analyses personnalisées.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={loadingExcel}
            >
              {loadingExcel ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exporter Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-info/10">
                <FileImage className="h-6 w-6 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">Rapport BNQ</CardTitle>
                <CardDescription>Conformité certification</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Générez le rapport de conformité BNQ 9700-800 pour la certification.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleExportBnq}
              disabled={loadingBnq}
            >
              {loadingBnq ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Générer Rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Exports récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Rapport_TechVision_Jan2026.pdf</p>
                  <p className="text-sm text-muted-foreground">Généré le 25/01/2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">KPIs_Historique_2025.xlsx</p>
                  <p className="text-sm text-muted-foreground">Généré le 15/01/2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-card-hover">
              <div className="flex items-center gap-3">
                <FileImage className="h-5 w-5 text-info" />
                <div>
                  <p className="font-medium text-foreground">BNQ_Conformite_SantePlus.pdf</p>
                  <p className="text-sm text-muted-foreground">Généré le 10/01/2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
