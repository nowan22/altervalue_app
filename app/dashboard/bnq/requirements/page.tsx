import { Suspense } from 'react';
import { RequirementsContent } from './_components/requirements-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequirementsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <RequirementsContent />
    </Suspense>
  );
}
