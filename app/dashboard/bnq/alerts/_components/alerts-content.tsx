'use client';

import { useBnqContext } from '../../_components/bnq-layout-client';
import { AlertsManager } from '@/app/dashboard/companies/[id]/bnq/_components/alerts-manager';

export function AlertsContent() {
  const { selectedCompanyId } = useBnqContext();

  if (!selectedCompanyId) {
    return null;
  }

  return <AlertsManager companyId={selectedCompanyId} />;
}
