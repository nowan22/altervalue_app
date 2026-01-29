'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileJson,
  Clock,
  Users,
  Shield,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface SurveyType {
  id: string;
  typeId: string;
  name: string;
  description: string | null;
  version: string;
  category: string;
  isSystem: boolean;
  estimatedDuration: number;
  anonymityThreshold: number;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  PRESENTEEISM: { label: 'Présentéisme', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  QVCT: { label: 'QVCT', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  RPS: { label: 'RPS', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  CLIMATE: { label: 'Climat', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  CUSTOM: { label: 'Personnalisé', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

export default function SurveyTypesPage() {
  const { toast } = useToast();
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role || 'PILOTE_QVCT';
  
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/diagnostic/types');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        setSurveyTypes(data);
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger les types', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const canCreate = userRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Types d'enquêtes</h1>
          <p className="text-muted-foreground mt-1">Bibliothèque des questionnaires disponibles</p>
        </div>
        {/* TODO: Add create button for SUPER_ADMIN */}
      </div>

      {/* Info card for non-admins */}
      {!canCreate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Seuls les Super-Admins peuvent créer de nouveaux types d'enquêtes.
              Contactez votre administrateur pour ajouter un type personnalisé.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Types List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : surveyTypes.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-12 text-center">
            <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun type d'enquête</h3>
            <p className="text-muted-foreground">
              Les types d'enquêtes seront bientôt disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveyTypes.map((type, index) => {
            const categoryConfig = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.CUSTOM;

            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border bg-card h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold">{type.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${categoryConfig.color} border`}>
                            {categoryConfig.label}
                          </Badge>
                          {type.isSystem && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Système
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {type.description && (
                      <CardDescription className="mt-2">{type.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{type.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Min. {type.anonymityThreshold}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>v{type.version}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      ID: {type.typeId}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
