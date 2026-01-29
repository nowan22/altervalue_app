import { Suspense } from 'react';
import { WorkflowContent } from './_components/workflow-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkflowPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <WorkflowContent />
    </Suspense>
  );
}
