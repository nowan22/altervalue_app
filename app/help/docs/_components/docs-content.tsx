'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  LayoutDashboard,
  Building2,
  Calculator,
  ClipboardList,
  ShieldCheck,
  Settings,
  Download,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Table of contents structure
const TOC = [
  { id: 'tableau-de-bord', title: '1. Tableau de Bord', icon: LayoutDashboard },
  { id: 'gestion-des-dossiers-clients', title: '2. Gestion des Dossiers', icon: Building2 },
  { id: 'calculateur-de-presenteisme', title: '3. Calculateur', icon: Calculator },
  { id: 'enquetes-et-diagnostics-terrain', title: '4. Enquêtes', icon: ClipboardList },
  { id: 'certification-bnq-9700-800', title: '5. Certification BNQ', icon: ShieldCheck },
  { id: 'administration', title: '6. Administration', icon: Settings },
  { id: 'parametres-et-configuration', title: '7. Paramètres', icon: Settings },
  { id: 'exports-et-rapports', title: '8. Exports', icon: Download },
  { id: 'glossaire', title: '9. Glossaire', icon: BookOpen },
  { id: 'interpreter-les-resultats', title: '10. Interprétation', icon: BookOpen },
];

export function DocsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [docContent, setDocContent] = useState('');

  // Load markdown content
  useEffect(() => {
    fetch('/api/help/docs')
      .then(res => res.text())
      .then(setDocContent)
      .catch(() => setDocContent('Erreur de chargement de la documentation.'));
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    TOC.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [docContent]);

  // Parse markdown to HTML (simple implementation)
  const parseMarkdown = (md: string): string => {
    if (!md) return '';
    
    let html = md
      // Headers with IDs
      .replace(/^## (\d+)\. (.+)$/gm, (_, num, title) => {
        const id = title.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return `<h2 id="${num.toLowerCase()}-${id}" class="text-2xl font-bold text-foreground mt-12 mb-4 scroll-mt-24">${num}. ${title}</h2>`;
      })
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-foreground mt-8 mb-3">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-medium text-foreground mt-6 mb-2">$1</h4>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-muted-foreground">$2</li>')
      // Paragraphs
      .replace(/^(?!<[hlu]|<pre|<li)(.+)$/gm, '<p class="text-muted-foreground mb-3">$1</p>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-8 border-border" />')
      // Wrap consecutive list items
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 mb-4">$&</ul>');

    // Add IDs to main sections
    TOC.forEach(({ id, title }) => {
      const num = title.split('.')[0];
      const name = title.split('. ')[1];
      const regex = new RegExp(`<h2[^>]*>${num}\\. ${name}</h2>`, 'i');
      html = html.replace(regex, `<h2 id="${id}" class="text-2xl font-bold text-foreground mt-12 mb-4 scroll-mt-24">${num}. ${name}</h2>`);
    });

    return html;
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter TOC based on search
  const filteredToc = TOC.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Image
                src="/logo-altervalue.png"
                alt="AlterValue"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-display text-lg font-bold">Documentation</span>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              Table des matières
            </h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <nav className="space-y-1">
                {filteredToc.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      activeSection === id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{title}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Documentation AlterValue
              </h1>
              <p className="text-lg text-muted-foreground">
                Guide complet pour utiliser la plateforme de diagnostic QVCT et ROI
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
              {TOC.slice(0, 6).map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {title.split('. ')[1]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>

            {/* Documentation Content */}
            <article
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(docContent) }}
            />

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Documentation AlterValue v4.1 — Janvier 2026
                </p>
                <a
                  href="mailto:contact@altervalue.fr"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Besoin d'aide ?
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
