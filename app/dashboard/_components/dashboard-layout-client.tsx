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

const SELECTED_COMPANY_KEY = 'altervalue_selected_company';

export function DashboardLayoutClient({ children, companies }: DashboardLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State for current company ID - persisted across page navigations and page refresh
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string>(
    companies[0]?.id || ''
  );
  
  // Restore selected company from localStorage on mount
  useEffect(() => {
    try {
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
      if (storedCompanyId && companies.some(c => c.id === storedCompanyId)) {
        setCurrentCompanyIdState(storedCompanyId);
      }
    } catch {
      // localStorage not available
    }
  }, [companies]);
  
  const currentCompany = companies.find(c => c.id === currentCompanyId) || null;

  const handleCompanyChange = (companyId: string) => {
    setCurrentCompanyIdState(companyId);
    // Persist to localStorage
    try {
      localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
    } catch {
      // localStorage not available
    }
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
