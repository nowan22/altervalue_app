import { Suspense } from 'react';
import { AlertsContent } from './_components/alerts-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <AlertsContent />
    </Suspense>
  );
}
