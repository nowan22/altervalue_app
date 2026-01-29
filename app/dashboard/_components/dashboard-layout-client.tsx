'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

// Context for sharing current company across dashboard
interface DashboardContextType {
  currentCompanyId: string | null;
  currentCompany: { id: string; name: string } | null;
  setCurrentCompanyId: (id: string) => void;
  companies: Array<{ id: string; name: string }>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardLayoutClient');
  }
  return context;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  companies: Array<{ id: string; name: string }>;
}

export function DashboardLayoutClient({ children, companies }: DashboardLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State for current company ID - persisted across page navigations
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string>(
    companies[0]?.id || ''
  );
  
  const currentCompany = companies.find(c => c.id === currentCompanyId) || null;

  const handleCompanyChange = (companyId: string) => {
    setCurrentCompanyIdState(companyId);
    // Navigate to "Ma Mission" page when changing company
    router.push('/dashboard/my-mission');
  };

  return (
    <DashboardContext.Provider value={{
      currentCompanyId,
      currentCompany,
      setCurrentCompanyId: handleCompanyChange,
      companies,
    }}>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar
          companies={companies}
          currentCompanyId={currentCompanyId}
          onCompanyChange={handleCompanyChange}
        />

        {/* Main Content */}
        <main className={cn(
          'min-h-screen transition-all duration-300',
          'lg:ml-64', // Offset for sidebar on desktop
          'pt-16 lg:pt-0', // Offset for mobile header
        )}>
          <div className="container-custom py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </DashboardContext.Provider>
  );
}
