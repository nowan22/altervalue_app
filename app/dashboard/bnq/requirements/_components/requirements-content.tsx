'use client';

import { useEffect, useState } from 'react';
import { useBnqContext } from '../../_components/bnq-layout-client';
import { RequirementsChecklist } from '@/app/dashboard/companies/[id]/bnq/_components/requirements-checklist';
import { Skeleton } from '@/components/ui/skeleton';
import type { BnqLevel } from '@prisma/client';

interface RequirementsData {
  checklistItems: Array<{
    id: string;
    articleRef: string;
    requirement: string;
    isCompliant: boolean | null;
    evaluatedAt: string | null;
    evidence: string | null;
    notes: string | null;
  }>;
  linkedDocuments: Array<{
    id: string;
    documentType: { code: string; name: string };
    status: string;
  }>;
  targetLevel: BnqLevel;
}

export function RequirementsContent() {
  const { selectedCompanyId } = useBnqContext();
  const [data, setData] = useState<RequirementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchData();
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnq/requirements?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <RequirementsChecklist
      companyId={selectedCompanyId!}
      targetLevel={data.targetLevel}
      checklistItems={data.checklistItems}
      linkedDocuments={data.linkedDocuments}
    />
  );
}
