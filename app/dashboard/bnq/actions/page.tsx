import { Suspense } from 'react';
import { ActionsContent } from './_components/actions-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <ActionsContent />
    </Suspense>
  );
}
