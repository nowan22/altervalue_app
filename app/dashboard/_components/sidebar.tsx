'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Wrench,
  Calculator,
  ClipboardList,
  ClipboardCheck,
  Settings2,
  Sparkles,
  ShieldCheck,
  ListChecks,
  Target,
  FileText,
  FileJson,
  Download,
  Settings,
  Users,
  SlidersHorizontal,
  History,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  Building2,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MENU_ITEMS,
  ROLE_LABELS,
  hasAccess,
  canChangeMission,
  getVisibleMenuItems,
  type MenuItem,
} from '@/lib/rbac';
import { Role } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Bell,
  Wrench,
  Calculator,
  ClipboardList,
  ClipboardCheck,
  Settings2,
  Sparkles,
  ShieldCheck,
  ListChecks,
  Target,
  FileText,
  FileJson,
  Download,
  Settings,
  Users,
  SlidersHorizontal,
  History,
  Briefcase,
};

interface SidebarProps {
  companies: Array<{ id: string; name: string }>;
  currentCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}

export function Sidebar({ companies, currentCompanyId, onCompanyChange }: SidebarProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get user role (default to PILOTE_QVCT if not set)
  const userRole = (session?.user as any)?.role as Role || 'PILOTE_QVCT';
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Utilisateur';
  const userEmail = session?.user?.email || '';

  // Get visible menu items based on role - memoize to prevent infinite loops
  const visibleMenuItems = useMemo(() => getVisibleMenuItems(userRole), [userRole]);
  
  // Track last pathname to avoid unnecessary re-expansions
  const lastPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-expand parent menus when pathname changes
  useEffect(() => {
    // Only run when pathname actually changes
    if (lastPathnameRef.current === pathname) return;
    lastPathnameRef.current = pathname;
    
    const parentsToExpand: string[] = [];
    
    for (const item of visibleMenuItems) {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child => {
          if (!child.href) return false;
          return pathname.startsWith(child.href);
        });
        
        if (hasActiveChild) {
          parentsToExpand.push(item.id);
        }
      }
    }

    if (parentsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newItems = parentsToExpand.filter(id => !prev.includes(id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visibleMenuItems]);

  // Toggle expanded state for menu items with children
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Render menu item icon
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={cn('h-5 w-5', className)} />;
  };

  // Check if a menu item is active based on current pathname
  const isItemActive = (item: MenuItem, isChild: boolean = false): boolean => {
    if (!item.href) return false;
    
    // For child items (sub-menu items), use exact match to avoid multiple highlights
    if (isChild) {
      // Exact match for items that could have sub-paths
      if (item.href === '/dashboard/bnq') {
        return pathname === '/dashboard/bnq';
      }
      // For other child items, exact match
      return pathname === item.href || pathname.startsWith(item.href + '/');
    }
    
    // Exact match for dashboard home
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // Prefix match for parent items
    return pathname.startsWith(item.href);
  };

  // Render single menu item with active state highlighting
  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const access = item.access[userRole];
    const isActive = isItemActive(item, isChild);
    
    // Check if any child is active (for parent highlighting)
    const hasActiveChild = item.children?.some(child => isItemActive(child, true)) || false;

    if (!hasAccess(access)) return null;

    const itemContent = (
      <>
        <div className="flex items-center gap-3">
          {renderIcon(
            item.icon, 
            cn(
              'transition-colors',
              isActive || hasActiveChild ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )
          )}
          <span className={cn(
            'text-sm font-medium transition-colors',
            isActive || hasActiveChild ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {item.label}
          </span>
        </div>
        {hasChildren && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </>
    );

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-sidebar-accent',
              hasActiveChild && 'bg-sidebar-accent/50'
            )}
          >
            {itemContent}
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pl-4"
              >
                {item.children?.map(child => renderMenuItem(child, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
          isChild && 'ml-4',
          isActive 
            ? 'bg-primary/10 border-l-2 border-primary' 
            : 'hover:bg-sidebar-accent'
        )}
      >
        {renderIcon(
          item.icon, 
          cn('transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')
        )}
        <span className={cn(
          'text-sm font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}>
          {item.label}
        </span>
      </Link>
    );
  };

  // Profile dropdown menu
  const ProfileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[userRole]}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
          <User className="mr-2 h-4 w-4" />
          Mon Profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          Support AlterValue
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mission selector (only for SUPER_ADMIN and EXPERT)
  const MissionSelector = () => {
    if (!canChangeMission(userRole)) {
      // Show static company name for PILOTE_QVCT and OBSERVATEUR
      const currentCompany = companies.find(c => c.id === currentCompanyId);
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground truncate">
              {currentCompany?.name || 'Mission'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <Select value={currentCompanyId} onValueChange={onCompanyChange}>
        <SelectTrigger className="w-full bg-card border-border">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Sélectionner une mission" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {companies.map(company => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <Image
          src="/logo-altervalue.png"
          alt="AlterValue"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-display text-xl font-bold text-foreground">AlterValue</span>
      </div>

      {/* Mission Selector */}
      {companies.length > 0 && (
        <div className="px-3 mb-4">
          <MissionSelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {visibleMenuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Theme Toggle */}
      {mounted && (
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start gap-3"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          </Button>
        </div>
      )}

      {/* Profile */}
      <div className="border-t border-border px-3 py-4">
        <ProfileMenu />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-card p-2 shadow-lg lg:hidden"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
