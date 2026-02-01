'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  LayoutDashboard,
  ClipboardList,
  Calculator,
  ShieldCheck,
  Download,
  Settings,
  Users,
  Building2,
  ChevronRight,
  Mail,
  BookOpen,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import sidebarContent from '@/lib/help/sidebar-content.json';

type PageKey = keyof typeof sidebarContent;

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// FAQ data
const FAQ_ITEMS = [
  {
    question: "Comment interpréter le coût du présentéisme ?",
    answer: "Le coût du présentéisme représente la perte de productivité liée aux collaborateurs présents mais non performants. Il est calculé selon la Méthode B (audit financier) en utilisant le ratio présentéisme/absentéisme et le coefficient de perte de productivité."
  },
  {
    question: "Qu'est-ce que la conformité BNQ ?",
    answer: "La norme BNQ 9700-800 (Entreprise en Santé) est un standard québécois qui certifie la qualité des pratiques de gestion de la santé et du bien-être au travail. Elle couvre 4 sphères : environnement de travail, pratiques de gestion, conciliation vie pro/perso, et habitudes de vie."
  },
  {
    question: "Comment exporter un rapport ?",
    answer: "Allez dans 'Exports & Rapports', sélectionnez le format (PDF, Excel, CSV), la période et les données à inclure, puis cliquez sur 'Générer'. Les rapports PDF sont idéaux pour les dirigeants, Excel pour l'analyse détaillée."
  },
  {
    question: "Qui peut accéder à mes données ?",
    answer: "Seuls les utilisateurs autorisés peuvent accéder aux données. Les Super-Admin ont un accès complet, les Experts accèdent à leurs dossiers assignés, les Pilotes QVCT à leur entreprise, et les Observateurs en lecture seule."
  },
  {
    question: "Comment ajouter une nouvelle mission ?",
    answer: "Cliquez sur 'Nouveau dossier' dans la section Missions, remplissez les informations (nom, secteur, effectif, salaire moyen), puis cliquez sur 'Créer'. Les benchmarks sectoriels seront automatiquement appliqués."
  },
  {
    question: "Comment lancer une enquête ?",
    answer: "Allez dans 'Diagnostic Terrain' > 'Campagnes', cliquez sur 'Nouvelle campagne', choisissez le type d'enquête, configurez les paramètres (dates, objectif de réponses), puis lancez. Partagez le lien ou le QR code avec les participants."
  },
];

// Page context mapping
const PAGE_CONTEXT_MAP: Record<string, PageKey> = {
  '/dashboard': 'dashboard',
  '/dashboard/companies': 'companies',
  '/dashboard/calculator': 'calculator',
  '/dashboard/diagnostic/campaigns': 'campaigns',
  '/dashboard/diagnostic/types': 'campaigns',
  '/dashboard/bnq': 'bnq',
  '/dashboard/exports': 'exports',
  '/dashboard/settings': 'settings',
  '/dashboard/admin': 'admin',
  '/dashboard/my-mission': 'company_detail',
};

// Icon mapping for article categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  companies: Building2,
  calculator: Calculator,
  campaigns: ClipboardList,
  bnq: ShieldCheck,
  exports: Download,
  settings: Settings,
  admin: Users,
  company_detail: Building2,
  survey_creation: ClipboardList,
  survey_results: ClipboardList,
};

export function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Determine current page context
  const currentPageKey = useMemo((): PageKey => {
    // Check exact match first
    if (PAGE_CONTEXT_MAP[pathname]) {
      return PAGE_CONTEXT_MAP[pathname];
    }
    // Check prefix matches
    for (const [path, key] of Object.entries(PAGE_CONTEXT_MAP)) {
      if (pathname.startsWith(path)) {
        return key;
      }
    }
    // Check for company detail page pattern
    if (pathname.match(/\/dashboard\/companies\/[^/]+$/)) {
      return 'company_detail';
    }
    // Check for campaign detail or survey pages
    if (pathname.includes('/diagnostic/campaigns/')) {
      if (pathname.includes('/results')) return 'survey_results';
      return 'campaigns';
    }
    return 'dashboard';
  }, [pathname]);

  // Get contextual help content
  const contextualHelp = sidebarContent[currentPageKey] || sidebarContent.dashboard;
  const ContextIcon = CATEGORY_ICONS[currentPageKey] || LayoutDashboard;

  // Filter FAQ based on search
  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;
    const query = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get related pages based on current context
  const relatedPages = useMemo(() => {
    const allPages = Object.entries(sidebarContent) as [PageKey, typeof contextualHelp][];
    return allPages
      .filter(([key]) => key !== currentPageKey)
      .slice(0, 3)
      .map(([key, content]) => ({
        key,
        title: content.title,
        description: content.description,
        Icon: CATEGORY_ICONS[key] || LayoutDashboard,
      }));
  }, [currentPageKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[400px] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Aide & Support</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une aide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Section 1: Contextual Help */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ContextIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Sur cette page
                  </h3>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <h4 className="font-medium text-foreground">{contextualHelp.title}</h4>
                  <p className="text-sm text-muted-foreground">{contextualHelp.description}</p>
                  
                  <div className="space-y-1.5">
                    {contextualHelp.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <Lightbulb className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{contextualHelp.tip}</p>
                  </div>
                </div>
              </section>

              {/* Section 2: Related Articles */}
              {!searchQuery && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                    Articles liés
                  </h3>
                  <div className="space-y-2">
                    {relatedPages.map(({ key, title, description, Icon }) => (
                      <button
                        key={key}
                        onClick={() => {
                          // Navigate to that page context in help
                          // For now, just close drawer
                        }}
                        className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                      >
                        <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 3: FAQ */}
              <section>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                  Questions fréquentes
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredFaq.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`faq-${idx}`}
                      className="border border-border rounded-lg bg-card overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium text-left hover:no-underline hover:bg-accent">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFaq.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun résultat pour "{searchQuery}"
                  </p>
                )}
              </section>

              {/* Section 4: Contact */}
              <section>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                  Besoin d'aide ?
                </h3>
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Contactez-nous</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Notre équipe support est disponible pour vous accompagner.
                  </p>
                  <a
                    href="mailto:contact@altervalue.fr"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    contact@altervalue.fr
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-border p-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/help/docs"
                  onClick={onClose}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Voir toute la documentation
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-xs text-muted-foreground">v4.1</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
