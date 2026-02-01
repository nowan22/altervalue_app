'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBnqContext } from '../../_components/bnq-layout-client';
import { DocumentVault } from '@/app/dashboard/companies/[id]/bnq/_components/document-vault';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentsData {
  documents: Array<{
    id: string;
    fileName: string;
    fileUrl: string | null;
    status: string;
    version: number;
    createdAt: string;
    validatedAt: string | null;
    notes?: string | null;
    documentType: {
      id: string;
      code: string;
      name: string;
      category: string;
      bnqArticle: string | null;
      requiredForLevel: string;
      isOptional: boolean;
      revisionFrequency: string | null;
    };
  }>;
  documentTypes: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    bnqArticle: string | null;
    requiredForLevel: string;
    isOptional: boolean;
    revisionFrequency: string | null;
    sortOrder: number;
  }>;
}

export function DocumentsContent() {
  const router = useRouter();
  const { selectedCompanyId } = useBnqContext();
  const [data, setData] = useState<DocumentsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchData();
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnq/documents?companyId=${selectedCompanyId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <DocumentVault
      companyId={selectedCompanyId!}
      documents={data.documents}
      documentTypes={data.documentTypes}
      onRefresh={fetchData}
    />
  );
}
