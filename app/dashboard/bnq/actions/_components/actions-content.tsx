'use client';

import { useEffect, useState } from 'react';
import { useBnqContext } from '../../_components/bnq-layout-client';
import { ActionPlanManager } from '@/app/dashboard/companies/[id]/bnq/_components/action-plan-manager';
import { Skeleton } from '@/components/ui/skeleton';
import type { BnqLevel } from '@prisma/client';

export function ActionsContent() {
  const { selectedCompanyId, selectedCompany } = useBnqContext();
  const [targetLevel, setTargetLevel] = useState<BnqLevel>('ES');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchData();
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnq/overview?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const result = await res.json();
        setTargetLevel(result.progress.targetLevel as BnqLevel);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <ActionPlanManager
      companyId={selectedCompanyId!}
      companyName={selectedCompany?.name || ''}
      targetLevel={targetLevel}
    />
  );
}
