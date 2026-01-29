import { Suspense } from 'react';
import { BnqOverviewContent } from './_components/bnq-overview-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function BnqOverviewPage() {
  return (
    <Suspense fallback={<BnqOverviewSkeleton />}>
      <BnqOverviewContent />
    </Suspense>
  );
}

function BnqOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
