'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardContext } from '../../_components/dashboard-layout-client';
import { MyMissionContent } from './my-mission-content';
import { Loader2 } from 'lucide-react';

interface MyMissionWrapperProps {
  userId: string;
  userRole: string;
}

interface CompanyData {
  id: string;
  name: string;
  sector: string;
  employeesCount: number;
  avgGrossSalary: number;
  employerContributionRate: number;
  absenteeismRate: number;
  createdAt: string;
  bnqProgress: {
    targetLevel: string;
    currentProgress: number;
    documentsProgress: number;
    workflowProgress: number;
  } | null;
}

interface CalculationResult {
  presRate: number;
  presDays: number;
  productivityLoss: number;
  presCost: number;
  presCostPerEmployee: number;
  presCostPctPayroll: number;
  signalColor: string;
}

export function MyMissionWrapper({ userId, userRole }: MyMissionWrapperProps) {
  const { currentCompanyId } = useDashboardContext();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine which company ID to use based on role
  const isRestricted = userRole === 'PILOTE_QVCT' || userRole === 'OBSERVATEUR';

  useEffect(() => {
    const fetchMissionData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build the API URL based on role
        let url = '/api/companies/my-mission';
        if (!isRestricted && currentCompanyId) {
          // SUPER_ADMIN and EXPERT use the selected company
          url += `?companyId=${currentCompanyId}`;
        }
        // PILOTE_QVCT and OBSERVATEUR - API will use their assignment

        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) {
            setCompany(null);
            setCalculationResult(null);
          } else {
            throw new Error('Failed to fetch mission data');
          }
        } else {
          const data = await res.json();
          setCompany(data.company);
          setCalculationResult(data.calculationResult);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMissionData();
  }, [currentCompanyId, isRestricted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-error">Erreur</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Aucune mission assignée</h2>
          <p className="text-muted-foreground">
            {isRestricted 
              ? 'Veuillez contacter votre administrateur pour accéder à une mission.'
              : 'Sélectionnez une mission dans la barre latérale ou créez-en une nouvelle.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <MyMissionContent 
      company={company} 
      calculationResult={calculationResult}
      userRole={userRole}
    />
  );
}
