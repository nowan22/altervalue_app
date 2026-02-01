'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Upload,
  FileDown,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Building2,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  sector: string;
  isDemo: boolean;
}

interface DataImportContentProps {
  companies: Company[];
}

const CSV_TEMPLATE = `period_date;absenteeism_rate;turnover_rate;avg_seniority_years;employees_count;avg_gross_salary;employer_contribution_rate
2025-01;5.2;12.5;4.2;150;35000;45
2025-02;5.4;12.3;4.3;152;35000;45
2025-03;5.1;11.8;4.4;155;35500;45`;

export function DataImportContent({ companies }: DataImportContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_kpi_altervalue.csv';
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index] ?? '';
        
        switch (header) {
          case 'period_date':
            row.periodDate = value;
            break;
          case 'absenteeism_rate':
            row.absenteeismRate = value ? parseFloat(value) : null;
            break;
          case 'turnover_rate':
            row.turnoverRate = value ? parseFloat(value) : null;
            break;
          case 'avg_seniority_years':
            row.avgSeniorityYears = value ? parseFloat(value) : null;
            break;
          case 'employees_count':
            row.employeesCount = value ? parseInt(value) : null;
            break;
          case 'avg_gross_salary':
            row.avgGrossSalary = value ? parseFloat(value) : null;
            break;
          case 'employer_contribution_rate':
            row.employerContributionRate = value ? parseFloat(value) / 100 : null;
            break;
          case 'at_mp_gravity_rate':
            row.atMpGravityRate = value ? parseFloat(value) : null;
            break;
          case 'engagement_score':
            row.engagementScore = value ? parseFloat(value) : null;
            break;
        }
      });

      data.push(row);
    }

    return data;
  };

  const validateData = (data: any[]): string[] => {
    const errs: string[] = [];

    data.forEach((row, index) => {
      if (!row.periodDate) {
        errs.push(`Ligne ${index + 2}: Date de période manquante`);
      } else {
        const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
        if (!dateRegex.test(row.periodDate)) {
          errs.push(`Ligne ${index + 2}: Format de date invalide (attendu: YYYY-MM)`);
        }
      }

      if (row.absenteeismRate !== null && (row.absenteeismRate < 0 || row.absenteeismRate > 100)) {
        errs.push(`Ligne ${index + 2}: Taux d'absentéisme invalide (0-100%)`);
      }

      if (row.turnoverRate !== null && (row.turnoverRate < 0 || row.turnoverRate > 100)) {
        errs.push(`Ligne ${index + 2}: Taux de turnover invalide (0-100%)`);
      }
    });

    return errs;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setResult(null);
    setParsing(true);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      const validationErrors = validateData(data);

      setPreview(data);
      setErrors(validationErrors);
    } catch (error) {
      setErrors(['Erreur lors de la lecture du fichier']);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedCompanyId || !preview || preview.length === 0 || errors.length > 0) return;

    setUploading(true);

    try {
      const response = await fetch(`/api/companies/${selectedCompanyId}/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis: preview }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: data?.success ?? 0, errors: data?.errors ?? 0 });
        toast({
          title: 'Import réussi',
          description: `${data?.success ?? 0} période(s) importée(s) pour ${selectedCompany?.name}`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Erreur',
          description: data?.error ?? "Erreur lors de l'import",
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'import",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          <Database className="h-7 w-7 text-primary" />
          Import de données
        </h1>
        <p className="text-muted-foreground mt-1">
          Importez l'historique des KPI depuis un fichier CSV pour alimenter le dashboard d'une entreprise
        </p>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sélection de l'entreprise cible
          </CardTitle>
          <CardDescription>
            Choisissez l'entreprise pour laquelle vous souhaitez importer les données historiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="company-select">Entreprise *</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Sélectionnez une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <span>{company.name}</span>
                      {company.isDemo && (
                        <Badge variant="secondary" className="text-xs">Démo</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompany && (
              <p className="text-sm text-muted-foreground">
                Secteur : {selectedCompany.sector}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            Format du fichier CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Format du fichier CSV</p>
                <p className="mt-1">Le fichier doit utiliser le point-virgule (;) comme séparateur.</p>
                <p className="mt-1">Colonnes supportées :</p>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">period_date</code> (obligatoire) - Format YYYY-MM</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">absenteeism_rate</code> - Taux d'absentéisme (%)</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">turnover_rate</code> - Taux de turnover (%)</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">avg_seniority_years</code> - Ancienneté moyenne (années)</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">employees_count</code> - Effectif</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">avg_gross_salary</code> - Salaire brut moyen (€)</li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">employer_contribution_rate</code> - Taux de charges (%)</li>
                </ul>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate}>
            <FileDown className="h-4 w-4 mr-2" />
            Télécharger le template CSV
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      {selectedCompanyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-secondary" />
              Import du fichier
            </CardTitle>
            <CardDescription>
              Importation pour : <strong>{selectedCompany?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Glissez-déposez votre fichier CSV</p>
                <p className="text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {preview ? `${preview.length} ligne(s) détectée(s)` : 'Analyse en cours...'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {parsing && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-300">Erreurs de validation</p>
                        <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-400">
                          {errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {errors.length > 5 && (
                            <li>... et {errors.length - 5} autre(s) erreur(s)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {preview && preview.length > 0 && errors.length === 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300">
                        {preview.length} ligne(s) valide(s) prête(s) à être importées
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted">
                            <th className="px-3 py-2 text-left">Période</th>
                            <th className="px-3 py-2 text-left">Absent.</th>
                            <th className="px-3 py-2 text-left">Turnover</th>
                            <th className="px-3 py-2 text-left">Ancienneté</th>
                            <th className="px-3 py-2 text-left">Effectif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b">
                              <td className="px-3 py-2">{row?.periodDate ?? '-'}</td>
                              <td className="px-3 py-2">{row?.absenteeismRate != null ? `${row.absenteeismRate}%` : '-'}</td>
                              <td className="px-3 py-2">{row?.turnoverRate != null ? `${row.turnoverRate}%` : '-'}</td>
                              <td className="px-3 py-2">{row?.avgSeniorityYears != null ? `${row.avgSeniorityYears} ans` : '-'}</td>
                              <td className="px-3 py-2">{row?.employeesCount ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          ... et {preview.length - 5} autre(s) ligne(s)
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetImport}>
                        Annuler
                      </Button>
                      <Button
                        className="gradient-primary text-white"
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Import en cours...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Importer {preview.length} ligne(s)
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Import terminé : {result.success} succès, {result.errors} erreur(s)
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
