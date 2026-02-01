'use client';

import { useEffect, useState } from 'react';
import { useDashboardContext } from '../../../_components/dashboard-layout-client';
import { Loader2, Building2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SurveyResults } from '../../../companies/[id]/_components/survey-results';

export function ResultsWrapper() {
  const { currentCompanyId, currentCompany } = useDashboardContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompanyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const companyRes = await fetch(`/api/companies/${currentCompanyId}`);
        if (companyRes.ok) {
          const company = await companyRes.json();
          setData({ company });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentCompanyId || !data?.company) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucune mission sélectionnée</h2>
            <p className="text-muted-foreground mb-4">
              Sélectionnez une mission pour voir les résultats.
            </p>
            <Link href="/dashboard/companies">
              <Button>Voir les missions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/presenteeism">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">Résultats des enquêtes</h1>
          <p className="text-muted-foreground">Visualisations pour {data.company.name}</p>
        </div>
      </div>

      <SurveyResults 
        companyId={currentCompanyId} 
        companyName={data.company.name}
        employeesCount={data.company.employeesCount}
      />
    </div>
  );
}
