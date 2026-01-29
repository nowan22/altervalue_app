// v4.0: Role-Based Access Control utilities
import { Role } from '@prisma/client';

// Menu item visibility configuration
export type MenuAccess = 'full' | 'readonly' | 'hidden' | 'config';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  access: Record<Role, MenuAccess>;
  children?: MenuItem[];
}

// Role labels for display
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super-Admin',
  EXPERT: 'Expert',
  PILOTE_QVCT: 'Pilote QVCT',
  OBSERVATEUR: 'Observateur',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: 'Accès complet à la plateforme',
  EXPERT: 'Gestion de portefeuille clients',
  PILOTE_QVCT: 'Pilotage de la démarche QVCT',
  OBSERVATEUR: 'Consultation des rapports',
};

// Menu structure with RBAC
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'hidden',
      OBSERVATEUR: 'hidden',
    },
  },
  {
    id: 'my-mission',
    label: 'Ma Mission',
    icon: 'Briefcase',
    href: '/dashboard/my-mission',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'readonly',
    },
  },
  {
    id: 'alerts',
    label: 'Alertes & Rappels',
    icon: 'Bell',
    href: '/dashboard/alerts',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'readonly',
    },
  },
  {
    id: 'diagnostic-terrain',
    label: 'Diagnostic Terrain',
    icon: 'ClipboardCheck',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'readonly',
    },
    children: [
      {
        id: 'campaigns',
        label: 'Campagnes',
        icon: 'ClipboardList',
        href: '/dashboard/diagnostic/campaigns',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'survey-types',
        label: 'Types d\'enquêtes',
        icon: 'FileJson',
        href: '/dashboard/diagnostic/types',
        access: {
          SUPER_ADMIN: 'full',  // Seul SUPER_ADMIN peut créer des types
          EXPERT: 'readonly',
          PILOTE_QVCT: 'hidden',
          OBSERVATEUR: 'hidden',
        },
      },
    ],
  },
  {
    id: 'tools',
    label: 'Outils',
    icon: 'Wrench',
    access: {
      SUPER_ADMIN: 'config',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'hidden',
    },
    children: [
      {
        id: 'calculator',
        label: 'Calculateur ROI',
        icon: 'Calculator',
        href: '/dashboard/calculator',
        access: {
          SUPER_ADMIN: 'config',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
    ],
  },
  {
    id: 'bnq',
    label: 'Module BNQ',
    icon: 'ShieldCheck',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'readonly',
    },
    children: [
      {
        id: 'bnq-overview',
        label: 'Vue d\'ensemble',
        icon: 'ShieldCheck',
        href: '/dashboard/bnq',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'bnq-requirements',
        label: 'Exigences',
        icon: 'ListChecks',
        href: '/dashboard/bnq/requirements',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'bnq-documents',
        label: 'Documents',
        icon: 'FileText',
        href: '/dashboard/bnq/documents',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'bnq-actions',
        label: 'Plan d\'actions',
        icon: 'Target',
        href: '/dashboard/bnq/actions',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'bnq-workflow',
        label: 'Workflow',
        icon: 'ClipboardCheck',
        href: '/dashboard/bnq/workflow',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
      {
        id: 'bnq-alerts',
        label: 'Alertes BNQ',
        icon: 'Bell',
        href: '/dashboard/bnq/alerts',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'full',
          PILOTE_QVCT: 'full',
          OBSERVATEUR: 'readonly',
        },
      },
    ],
  },
  {
    id: 'exports',
    label: 'Exports & Rapports',
    icon: 'Download',
    href: '/dashboard/exports',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'full',
      PILOTE_QVCT: 'full',
      OBSERVATEUR: 'full',
    },
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: 'Settings',
    access: {
      SUPER_ADMIN: 'full',
      EXPERT: 'hidden',
      PILOTE_QVCT: 'hidden',
      OBSERVATEUR: 'hidden',
    },
    children: [
      {
        id: 'experts',
        label: 'Gestion des Experts',
        icon: 'Users',
        href: '/dashboard/admin/experts',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'hidden',
          PILOTE_QVCT: 'hidden',
          OBSERVATEUR: 'hidden',
        },
      },
      {
        id: 'coefficients',
        label: 'Coefficients & Benchmarks',
        icon: 'SlidersHorizontal',
        href: '/dashboard/settings',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'config',
          PILOTE_QVCT: 'hidden',
          OBSERVATEUR: 'hidden',
        },
      },
      {
        id: 'activity-logs',
        label: 'Journal d\'activité',
        icon: 'History',
        href: '/dashboard/admin/activity-logs',
        access: {
          SUPER_ADMIN: 'full',
          EXPERT: 'hidden',
          PILOTE_QVCT: 'hidden',
          OBSERVATEUR: 'hidden',
        },
      },
    ],
  },
];

// Check if user has access to a menu item
export function hasAccess(access: MenuAccess): boolean {
  return access !== 'hidden';
}

// Check if user has full access (can edit)
export function canEdit(access: MenuAccess): boolean {
  return access === 'full' || access === 'config';
}

// Check if user can only read
export function isReadonly(access: MenuAccess): boolean {
  return access === 'readonly';
}

// Check if user can change mission/company
export function canChangeMission(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'EXPERT';
}

// Filter menu items by role
export function getVisibleMenuItems(role: Role): MenuItem[] {
  return MENU_ITEMS.filter(item => hasAccess(item.access[role])).map(item => ({
    ...item,
    children: item.children?.filter(child => hasAccess(child.access[role])),
  }));
}
