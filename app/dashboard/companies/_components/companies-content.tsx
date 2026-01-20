"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Users,
  Euro,
  Percent,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SECTORS, getSectorLabel } from "@/lib/sectors";
import { calculatePresenteeism, getSignalColor } from "@/lib/presenteeism-calculator";
import { useToast } from "@/hooks/use-toast";

interface CompaniesContentProps {
  companies: any[];
  settings: any;
}

export default function CompaniesContent({ companies, settings }: CompaniesContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showDemo, setShowDemo] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const safeCompanies = companies ?? [];
  const safeSettings = settings ?? {};

  const filteredCompanies = safeCompanies.filter((company) => {
    const matchesSearch = (company?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === "all" || company?.sector === sectorFilter;
    const matchesDemo = showDemo || !company?.isDemo;
    return matchesSearch && matchesSector && matchesDemo;
  });

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Succès", description: "Dossier supprimé avec succès" });
        router.refresh();
      } else {
        const data = await response.json();
        toast({ title: "Erreur", description: data?.error ?? "Erreur de suppression", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dossiers Entreprises</h1>
          <p className="text-gray-600 mt-1">Gérez et analysez vos dossiers clients</p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button className="gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les secteurs</SelectItem>
                {SECTORS.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showDemo ? "secondary" : "outline"}
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? "Masquer démo" : "Afficher démo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun dossier trouvé</h3>
            <p className="text-gray-500 mb-6">
              {search || sectorFilter !== "all"
                ? "Aucun dossier ne correspond à vos critères de recherche"
                : "Commencez par créer votre premier dossier entreprise"}
            </p>
            {!search && sectorFilter === "all" && (
              <Link href="/dashboard/companies/new">
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un dossier
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company, index) => {
            const result = calculatePresenteeism({
              employeesCount: company?.employeesCount ?? 0,
              avgGrossSalary: company?.avgGrossSalary ?? 0,
              employerContributionRate: company?.employerContributionRate ?? 0,
              absenteeismRate: company?.absenteeismRate ?? 0,
              presAbsCoefficient: safeSettings?.presAbsCoefficient ?? 1.3,
              productivityLossCoeff: safeSettings?.productivityLossCoeff ?? 0.33,
            });

            const signal = getSignalColor(
              company?.absenteeismRate ?? 0,
              safeSettings?.absenteeismGreenMax ?? 4,
              safeSettings?.absenteeismOrangeMax ?? 6
            );

            return (
              <motion.div
                key={company?.id ?? index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          signal === 'green' ? 'bg-green-100' :
                          signal === 'orange' ? 'bg-orange-100' : 'bg-red-100'
                        }`}>
                          <Building2 className={`h-6 w-6 ${
                            signal === 'green' ? 'text-green-600' :
                            signal === 'orange' ? 'text-orange-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{company?.name ?? 'Entreprise'}</CardTitle>
                          <p className="text-sm text-gray-500">{getSectorLabel(company?.sector ?? '')}</p>
                        </div>
                      </div>
                      {company?.isDemo && (
                        <Badge variant="secondary">Démo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{company?.employeesCount ?? 0} salariés</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{(company?.absenteeismRate ?? 0).toFixed(1)}% absent.</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Coût présent.: <strong className="text-gray-900">{(result?.presCost ?? 0).toLocaleString('fr-FR')} €</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Link href={`/dashboard/companies/${company?.id ?? ''}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Link href={`/dashboard/companies/${company?.id ?? ''}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {!company?.isDemo && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Toutes les données associées seront définitivement supprimées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(company?.id ?? '')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
