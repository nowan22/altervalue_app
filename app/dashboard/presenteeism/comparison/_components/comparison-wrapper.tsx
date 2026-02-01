'use client';

import { useEffect, useState } from 'react';
import { useDashboardContext } from '../../../_components/dashboard-layout-client';
import { Loader2, Building2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MethodComparison } from '../../../companies/[id]/_components/method-comparison';
import { calculatePresenteeism } from '@/lib/presenteeism-calculator';

export function ComparisonWrapper() {
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
        const [companyRes, settingsRes] = await Promise.all([
          fetch(`/api/companies/${currentCompanyId}`),
          fetch('/api/settings'),
        ]);

        if (companyRes.ok && settingsRes.ok) {
          const company = await companyRes.json();
          const settings = await settingsRes.json();
          setData({ company, settings });
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
              Sélectionnez une mission pour voir la comparaison A vs B.
            </p>
            <Link href="/dashboard/companies">
              <Button>Voir les missions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const methodAResult = calculatePresenteeism({
    employeesCount: data.company?.employeesCount ?? 0,
    avgGrossSalary: data.company?.avgGrossSalary ?? 0,
    employerContributionRate: data.company?.employerContributionRate ?? 0,
    absenteeismRate: data.company?.absenteeismRate ?? 0,
    presAbsCoefficient: data.settings?.presAbsCoefficient ?? 1.3,
    productivityLossCoeff: data.settings?.productivityLossCoeff ?? 0.33,
    workingDaysPerYear: data.settings?.workingDaysPerYear ?? 220,
  });

  const payroll = (data.company?.employeesCount ?? 0) * (data.company?.avgGrossSalary ?? 0) * (1 + (data.company?.employerContributionRate ?? 0));

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
          <h1 className="text-2xl font-display font-bold">Comparaison A vs B</h1>
          <p className="text-muted-foreground">Analyse comparative pour {data.company.name}</p>
        </div>
      </div>

      <MethodComparison
        companyId={currentCompanyId}
        companyName={data.company.name}
        employeesCount={data.company.employeesCount}
        methodAResult={methodAResult}
        payroll={payroll}
      />
    </div>
  );
}
