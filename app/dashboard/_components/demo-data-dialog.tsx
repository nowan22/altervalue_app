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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dices, AlertTriangle, Loader2, Trash2, ChevronDown, Settings2, Flame, Target, Scale, Star } from 'lucide-react';

interface DemoDataDialogProps {
  campaignId: string;
  campaignName: string;
  companyIsDemo: boolean;
  userIsSuperAdmin: boolean;
  responseCount?: number;
  children?: React.ReactNode;
}

// Scénarios de démonstration
const SCENARIOS = {
  A: {
    icon: Flame,
    label: 'Entreprise en difficulté',
    shortLabel: '🔥 Dégradé',
    description: 'Burnout / RPS élevés / Management défaillant',
    color: 'text-red-500',
    spheres: { Management: '20-35%', Équilibre: '25-40%', Santé: '30-45%', Environnement: '50-65%' },
  },
  B: {
    icon: Target,
    label: 'Tech typique',
    shortLabel: '🎯 Tech',
    description: 'Bon environnement mais équilibre vie pro/perso dégradé',
    color: 'text-blue-500',
    spheres: { Management: '55-70%', Équilibre: '30-45%', Santé: '60-75%', Environnement: '70-85%' },
  },
  C: {
    icon: Scale,
    label: 'Entreprise neutre',
    shortLabel: '⚖️ Neutre',
    description: 'Scores moyens homogènes, pas de point critique',
    color: 'text-zinc-500',
    spheres: { Management: '45-60%', Équilibre: '45-60%', Santé: '45-60%', Environnement: '45-60%' },
  },
  D: {
    icon: Star,
    label: 'Entreprise excellente',
    shortLabel: '⭐ Excellent',
    description: 'BNQ mature, scores élevés partout',
    color: 'text-amber-500',
    spheres: { Management: '75-90%', Équilibre: '70-85%', Santé: '75-90%', Environnement: '80-95%' },
  },
};

export default function DemoDataDialog({
  campaignId,
  campaignName,
  companyIsDemo,
  userIsSuperAdmin,
  responseCount = 0,
  children,
}: DemoDataDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  
  // Form state
  const [count, setCount] = useState('250');
  const [scenario, setScenario] = useState('A');
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
          scenario,
          departmentDistribution,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Données générées',
          description: `${data.summary?.count || count} réponses créées (${SCENARIOS[scenario as keyof typeof SCENARIOS].shortLabel})`,
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

  const handleClearData = async () => {
    setClearLoading(true);
    try {
      const response = await fetch(`/api/diagnostic/campaigns/${campaignId}/clear-responses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syntheticOnly: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🗑️ Données supprimées',
          description: `${data.deletedCount} réponses synthétiques supprimées`,
        });
        setClearDialogOpen(false);
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
      setClearLoading(false);
    }
  };

  const selectedScenario = SCENARIOS[scenario as keyof typeof SCENARIOS];
  const ScenarioIcon = selectedScenario.icon;

  // Render as a dropdown menu for cleaner UI
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children || (
            <Button variant="outline" size="sm" className="text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Settings2 className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Démo</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
            <Dices className="h-4 w-4 mr-2 text-amber-500" />
            Générer des données
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setClearDialogOpen(true)} 
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            disabled={responseCount === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vider les données
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Generate Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-amber-500" />
              Génération de données de démo
            </DialogTitle>
            <DialogDescription className="text-xs">
              {campaignName}
            </DialogDescription>
          </DialogHeader>

          {/* Compact Form */}
          <div className="grid gap-4 py-2">
            {/* Scenario Selector - Full width with visual preview */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Scénario de démo</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      <span>A : Entreprise en difficulté (burnout)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="B">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>B : Tech typique (bon env., mauvais équilibre)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="C">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-zinc-500" />
                      <span>C : Neutre (scores moyens)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="D">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>D : Excellent (BNQ mature)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Scenario Preview */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ScenarioIcon className={`h-4 w-4 ${selectedScenario.color}`} />
                  <span className="text-sm font-medium">{selectedScenario.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{selectedScenario.description}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  {Object.entries(selectedScenario.spheres).map(([sphere, range]) => (
                    <div key={sphere} className="flex justify-between">
                      <span className="text-muted-foreground">{sphere}:</span>
                      <span className="font-mono">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Count */}
              <div className="space-y-1.5">
                <Label htmlFor="count" className="text-xs">Nombre de réponses</Label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger id="count" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 (test rapide)</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250 ⭐ recommandé</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Distribution */}
              <div className="space-y-1.5">
                <Label htmlFor="dept" className="text-xs">Répartition services</Label>
                <Select value={departmentDistribution} onValueChange={setDepartmentDistribution}>
                  <SelectTrigger id="dept" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportional">Proportionnelle</SelectItem>
                    <SelectItem value="uniform">Uniforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-700 dark:text-blue-300">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Corrélations logiques câblées :</p>
                <ul className="mt-1 text-[10px] space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>• Management &lt; 40% → Équilibre &lt; 35%</li>
                  <li>• Équilibre &lt; 40% → Santé &lt; 50%</li>
                  <li>• Biais par département (+/- 30%)</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              size="sm"
              className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 dark:text-zinc-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Dices className="h-3.5 w-3.5 mr-1.5" />
                  Générer {count} réponses
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Vider les données de démo ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les réponses synthétiques (isSynthetic=true) de la campagne <strong>{campaignName}</strong>.
              <br /><br />
              Les résultats calculés seront également supprimés. Vous pourrez régénérer de nouvelles données ensuite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              disabled={clearLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
