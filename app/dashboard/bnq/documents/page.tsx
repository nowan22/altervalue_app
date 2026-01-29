import { Suspense } from 'react';
import { DocumentsContent } from './_components/documents-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <DocumentsContent />
    </Suspense>
  );
}
