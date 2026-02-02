'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Dices, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';

interface DemoDataDialogProps {
  campaignId: string;
  campaignName: string;
  companyIsDemo: boolean;
  userIsSuperAdmin: boolean;
  children?: React.ReactNode;
}

export default function DemoDataDialog({
  campaignId,
  campaignName,
  companyIsDemo,
  userIsSuperAdmin,
  children,
}: DemoDataDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [count, setCount] = useState('100');
  const [distributionProfile, setDistributionProfile] = useState('uniform');
  const [departmentDistribution, setDepartmentDistribution] = useState('proportional');

  // Don't render if not eligible
  if (!companyIsDemo || !userIsSuperAdmin) {
    return null;
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/diagnostic/campaigns/${campaignId}/generate-demo-responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(count),
          distributionProfile,
          departmentDistribution,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Données générées avec succès',
          description: `${data.summary?.count || count} réponses de démo créées (profil: ${data.summary?.profileLabel || distributionProfile}, répartition: ${data.summary?.departmentDistributionLabel || departmentDistribution})`,
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion au serveur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const profileDescriptions: Record<string, string> = {
    uniform: 'Réponses réparties uniformément avec une distribution large centrée autour de 5/10.',
    positive: 'Simule une entreprise en bonne santé avec des scores élevés (moyennes 7-8/10).',
    degraded: 'Simule une entreprise en difficulté avec des scores bas (moyennes 3-4/10).',
  };

  const distributionDescriptions: Record<string, string> = {
    proportional: 'Nombre de réponses proportionnel aux effectifs déclarés par service.',
    uniform: 'Même nombre de réponses pour chaque service.',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            <Dices className="h-4 w-4 mr-2" />
            Générer des données de démo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Dices className="h-5 w-5" />
            Génération de données de démonstration
          </DialogTitle>
          <DialogDescription>
            Campagne : <strong>{campaignName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-medium">Attention</p>
            <p className="mt-1 text-amber-600 dark:text-amber-400">
              Cette opération va créer des réponses artificielles pour cette campagne.
              À n'utiliser que pour test/démo. <strong>Action irréversible.</strong>
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 py-4">
          {/* Count */}
          <div className="space-y-2">
            <Label htmlFor="count">Nombre de réponses à générer</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger id="count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 réponses</SelectItem>
                <SelectItem value="50">50 réponses</SelectItem>
                <SelectItem value="100">100 réponses (recommandé)</SelectItem>
                <SelectItem value="250">250 réponses</SelectItem>
                <SelectItem value="500">500 réponses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distribution Profile */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="profile">Profil de distribution</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Détermine la tendance générale des réponses aux questions échelles (0-10).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={distributionProfile} onValueChange={setDistributionProfile}>
              <SelectTrigger id="profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uniform">
                  <div className="flex flex-col">
                    <span>🎲 Uniforme (neutre)</span>
                  </div>
                </SelectItem>
                <SelectItem value="positive">
                  <div className="flex flex-col">
                    <span>😊 Plutôt positive (bonne santé)</span>
                  </div>
                </SelectItem>
                <SelectItem value="degraded">
                  <div className="flex flex-col">
                    <span>😟 Plutôt dégradée (difficultés)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {profileDescriptions[distributionProfile]}
            </p>
          </div>

          {/* Department Distribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="dept">Répartition par services</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Définit comment les réponses sont réparties entre les différents services de l'entreprise.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={departmentDistribution} onValueChange={setDepartmentDistribution}>
              <SelectTrigger id="dept">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proportional">Proportionnelle aux effectifs</SelectItem>
                <SelectItem value="uniform">Égale entre services</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {distributionDescriptions[departmentDistribution]}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Dices className="h-4 w-4 mr-2" />
                Générer les données
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
