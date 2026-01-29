'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Briefcase,
  Eye,
  UserCog,
  Building2,
  Mail,
  Calendar,
  Link2,
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/rbac';
import { Role } from '@prisma/client';

interface Assignment {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    sector: string;
    employeesCount?: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  _count: {
    companies: number;
    missionAssignments: number;
  };
}

interface Company {
  id: string;
  name: string;
  sector: string;
}

interface ExpertsContentProps {
  initialUsers: User[];
  allCompanies: Company[];
}

const ROLE_ICONS: Record<Role, React.ElementType> = {
  SUPER_ADMIN: ShieldCheck,
  EXPERT: Briefcase,
  PILOTE_QVCT: UserCog,
  OBSERVATEUR: Eye,
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-primary/20 text-primary border-primary/30',
  EXPERT: 'bg-secondary/20 text-secondary border-secondary/30',
  PILOTE_QVCT: 'bg-success/20 text-success border-success/30',
  OBSERVATEUR: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

export function ExpertsContent({ initialUsers, allCompanies }: ExpertsContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedCompanyToAssign, setSelectedCompanyToAssign] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EXPERT' as Role,
    password: '',
  });

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    superAdmin: users.filter((u) => u.role === 'SUPER_ADMIN').length,
    experts: users.filter((u) => u.role === 'EXPERT').length,
    pilotes: users.filter((u) => u.role === 'PILOTE_QVCT').length,
    observateurs: users.filter((u) => u.role === 'OBSERVATEUR').length,
  };

  // Load assignments when dialog opens
  useEffect(() => {
    if (isAssignOpen && selectedUser) {
      loadAssignments(selectedUser.id);
    }
  }, [isAssignOpen, selectedUser]);

  const loadAssignments = async (userId: string) => {
    setAssignmentsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/assignments`);
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedCompanyToAssign) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompanyToAssign }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur assignation');
      }

      toast({ title: 'Succès', description: 'Mission assignée avec succès' });
      setSelectedCompanyToAssign('');
      loadAssignments(selectedUser.id);
      
      // Refresh users to update counts
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (companyId: string) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression');
      }

      toast({ title: 'Succès', description: 'Assignation retirée' });
      loadAssignments(selectedUser.id);
      
      // Refresh users to update counts
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: 'Erreur', description: 'Email et mot de passe requis', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur création');
      }

      toast({ title: 'Succès', description: 'Utilisateur créé avec succès' });
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', role: 'EXPERT', password: '' });
      router.refresh();
      
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur modification');
      }

      toast({ title: 'Succès', description: 'Utilisateur modifié avec succès' });
      setIsEditOpen(false);
      setSelectedUser(null);
      router.refresh();
      
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur suppression');
      }

      toast({ title: 'Succès', description: 'Utilisateur supprimé' });
      setIsDeleteOpen(false);
      setSelectedUser(null);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsEditOpen(true);
  };

  const openAssign = (user: User) => {
    setSelectedUser(user);
    setSelectedCompanyToAssign('');
    setIsAssignOpen(true);
  };

  // Get companies not yet assigned to this user
  const getAvailableCompanies = () => {
    const assignedIds = new Set(assignments.map((a) => a.companyId));
    return allCompanies.filter((c) => !assignedIds.has(c.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les experts, pilotes et leurs accès aux missions</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', email: '', role: 'EXPERT', password: '' });
            setIsCreateOpen(true);
          }}
          className="bg-gradient-gold hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-foreground' },
          { label: 'Super-Admin', value: stats.superAdmin, icon: ShieldCheck, color: 'text-primary' },
          { label: 'Experts', value: stats.experts, icon: Briefcase, color: 'text-secondary' },
          { label: 'Pilotes', value: stats.pilotes, icon: UserCog, color: 'text-success' },
          { label: 'Observateurs', value: stats.observateurs, icon: Eye, color: 'text-muted-foreground' },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user, index) => {
            const RoleIcon = ROLE_ICONS[user.role];
            const showAssignButton = ['PILOTE_QVCT', 'OBSERVATEUR'].includes(user.role);
            const missionCount = user.role === 'EXPERT' 
              ? user._count.companies 
              : user._count.missionAssignments;
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card card-hover">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${ROLE_COLORS[user.role]}`}>
                          <RoleIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.name || 'Sans nom'}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <Badge className={ROLE_COLORS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {missionCount} mission{missionCount !== 1 ? 's' : ''}
                          {missionCount === 0 && showAssignButton && (
                            <span className="text-warning text-xs">(non assigné)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex gap-2">
                          {showAssignButton && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openAssign(user)}
                              title="Assigner une mission"
                              className="text-primary hover:bg-primary/10"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[key as Role]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-gradient-gold">
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Laisser vide pour conserver"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={loading} className="bg-gradient-gold">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Missions assignées
            </DialogTitle>
            <DialogDescription>
              Gérez les missions assignées à {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Assigned missions */}
            <div>
              <Label className="mb-2 block">Missions actuelles</Label>
              {assignmentsLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Chargement...
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-lg">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune mission assignée</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{assignment.company.name}</p>
                          <p className="text-xs text-muted-foreground">{assignment.company.sector}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveAssignment(assignment.companyId)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new assignment */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Ajouter une mission</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCompanyToAssign}
                  onValueChange={setSelectedCompanyToAssign}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner une mission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCompanies().length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        Toutes les missions sont déjà assignées
                      </div>
                    ) : (
                      getAvailableCompanies().map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.sector})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={loading || !selectedCompanyToAssign}
                  className="bg-gradient-gold"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              <strong>{selectedUser?.name || selectedUser?.email}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
