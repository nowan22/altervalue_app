'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBnqContext } from '../../_components/bnq-layout-client';
import { WorkflowValidation } from '@/app/dashboard/companies/[id]/bnq/_components/workflow-validation';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkflowData {
  workflowSteps: Array<{
    id: string;
    stepNumber: number;
    stepCode: string;
    stepName: string;
    description: string | null;
    status: string;
    completedAt: string | null;
    signature: string | null;
    tasks: Array<{
      id: string;
      taskCode: string;
      taskName: string;
      isRequired: boolean;
      isCompleted: boolean;
    }>;
  }>;
}

export function WorkflowContent() {
  const router = useRouter();
  const { selectedCompanyId } = useBnqContext();
  const [data, setData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchData();
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnq/workflow?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <WorkflowValidation
      companyId={selectedCompanyId!}
      workflowSteps={data.workflowSteps}
      onRefresh={fetchData}
    />
  );
}
