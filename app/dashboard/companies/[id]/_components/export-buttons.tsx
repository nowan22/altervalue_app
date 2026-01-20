'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCompanyReportHtml, generateKpiHistoryReportHtml, ReportResult } from '@/lib/pdf-templates';

interface CompanyData {
  id: string;
  name: string;
  sector: string;
  employees: number;
  averageSalary: number;
  absenteeismRate: number;
}

interface KpiData {
  id: string;
  periodDate: Date | string;
  employees: number;
  absenteeismRate: number;
  presenteeismRate: number | null;
  presenteeismCost: number | null;
}

interface ExportButtonsProps {
  company: CompanyData;
  result?: ReportResult | null;
  kpis?: KpiData[];
  type: 'report' | 'history';
}

export function ExportButtons({ company, result, kpis, type }: ExportButtonsProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const { toast } = useToast();

  const handleExportPdf = async () => {
    setLoadingPdf(true);
    try {
      const now = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let html_content: string;
      let filename: string;

      if (type === 'report' && result) {
        html_content = generateCompanyReportHtml({
          company,
          result,
          generatedAt: now,
        });
        filename = `rapport-presenteisme-${company.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      } else if (type === 'history' && kpis) {
        const formattedKpis = kpis.map(k => ({
          period: new Date(k.periodDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
          employees: k.employees,
          absenteeismRate: k.absenteeismRate,
          presenteeismRate: k.presenteeismRate || 0,
          presenteeismCost: k.presenteeismCost || 0,
          signal: k.presenteeismRate && k.presenteeismRate > 6 ? 'red' : k.presenteeismRate && k.presenteeismRate > 4 ? 'orange' : 'green',
        }));
        html_content = generateKpiHistoryReportHtml({
          company: { name: company.name, sector: company.sector },
          kpis: formattedKpis,
          generatedAt: now,
        });
        filename = `historique-kpi-${company.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      } else {
        throw new Error('Données manquantes');
      }

      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html_content, filename }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: `Le fichier ${filename} a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export PDF',
        variant: 'destructive',
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setLoadingExcel(true);
    try {
      let data: Record<string, unknown>[];
      let columns: string[];
      let filename: string;

      if (type === 'report' && result) {
        data = [{
          'Entreprise': company.name,
          'Secteur': company.sector,
          'Effectif': company.employees,
          'Salaire Moyen': company.averageSalary,
          'Taux Absentéisme': company.absenteeismRate,
          'Taux Présentéisme': result.presenteeismRate,
          'Jours Présentéisme': result.presenteeismDays,
          'Perte Productivité': result.productivityLoss,
          'Coût Total': result.presenteeismCost,
          'Coût par Employé': result.costPerEmployee,
          '% Masse Salariale': result.percentOfPayroll,
          'Signal': result.signal,
        }];
        columns = Object.keys(data[0]);
        filename = `rapport-${company.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
      } else if (type === 'history' && kpis) {
        data = kpis.map(k => ({
          'Période': new Date(k.periodDate).toLocaleDateString('fr-FR'),
          'Effectif': k.employees,
          'Taux Absentéisme (%)': k.absenteeismRate,
          'Taux Présentéisme (%)': k.presenteeismRate || 0,
          'Coût Présentéisme (€)': k.presenteeismCost || 0,
        }));
        columns = Object.keys(data[0] || {});
        filename = `historique-kpi-${company.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
      } else {
        throw new Error('Données manquantes');
      }

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, columns, filename }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur export Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: `Le fichier ${filename} a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export Excel',
        variant: 'destructive',
      });
    } finally {
      setLoadingExcel(false);
    }
  };

  const isDisabled = type === 'report' ? !result : !kpis?.length;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={loadingPdf || isDisabled}
      >
        {loadingPdf ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={loadingExcel || isDisabled}
      >
        {loadingExcel ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        Excel
      </Button>
    </div>
  );
}
