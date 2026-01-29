'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Building2, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import { useDashboardContext } from '../../_components/dashboard-layout-client';
import type { BnqLevel, Role } from '@prisma/client';

interface Company {
  id: string;
  name: string;
  bnqProgress: {
    targetLevel: string;
    currentProgress: number;
  } | null;
}

interface BnqContextType {
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: string) => void;
}

const BnqContext = createContext<BnqContextType | null>(null);

export function useBnqContext() {
  const context = useContext(BnqContext);
  if (!context) {
    throw new Error('useBnqContext must be used within BnqLayoutClient');
  }
  return context;
}

export function BnqLayoutClient({
  children,
  companies,
  userRole,
}: {
  children: React.ReactNode;
  companies: Company[];
  userRole: Role;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Use dashboard context to get the current company from sidebar
  const dashboardContext = useDashboardContext();
  
  // Use the company ID from the sidebar context
  const selectedCompanyId = dashboardContext.currentCompanyId && 
    companies.some(c => c.id === dashboardContext.currentCompanyId) 
      ? dashboardContext.currentCompanyId 
      : companies.length > 0 ? companies[0].id : null;

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;
  const targetLevel = selectedCompany?.bnqProgress?.targetLevel as BnqLevel || 'ES';
  const levelInfo = BNQ_LEVEL_LABELS[targetLevel];
  
  // Wrapper for setSelectedCompanyId to sync with dashboard context
  const setSelectedCompanyId = (id: string) => {
    dashboardContext.setCurrentCompanyId(id);
  };

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', href: '/dashboard/bnq' },
    { id: 'requirements', label: 'Exigences', href: '/dashboard/bnq/requirements' },
    { id: 'documents', label: 'Documents', href: '/dashboard/bnq/documents' },
    { id: 'actions', label: 'Plan d\'actions', href: '/dashboard/bnq/actions' },
    { id: 'workflow', label: 'Workflow', href: '/dashboard/bnq/workflow' },
    { id: 'alerts', label: 'Alertes', href: '/dashboard/bnq/alerts' },
  ];

  const isActiveTab = (href: string) => {
    if (href === '/dashboard/bnq') {
      return pathname === '/dashboard/bnq';
    }
    return pathname.startsWith(href);
  };

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Aucune mission disponible</h2>
          <p className="text-muted-foreground">
            Créez une mission pour accéder au module BNQ.
          </p>
          <Button onClick={() => router.push('/dashboard/companies/new')}>
            Créer une mission
          </Button>
        </div>
      </div>
    );
  }

  return (
    <BnqContext.Provider value={{ selectedCompanyId, selectedCompany, setSelectedCompanyId }}>
      <div className="space-y-6">
        {/* Header with company selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Conformité BNQ 9700-800</h1>
              <p className="text-sm text-muted-foreground">Gestion de la certification Entreprise en Santé</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Display current company from sidebar - no combobox, use sidebar to change */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedCompany?.name || 'Mission'}</span>
            </div>

            {/* Target level badge */}
            {selectedCompany && (
              <Badge className={`${levelInfo.color} text-white`}>
                {levelInfo.badge} {levelInfo.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActiveTab(tab.href)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </BnqContext.Provider>
  );
}
