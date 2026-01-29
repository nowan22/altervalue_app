'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Building2,
  History,
  Save,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/rbac';
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_COLORS,
} from '@/lib/activity-logger';
import { Role, ActivityType } from '@prisma/client';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  _count: {
    companies: number;
    activityLogs: number;
  };
}

interface ActivityLog {
  id: string;
  type: ActivityType;
  action: string;
  description: string | null;
  companyName: string | null;
  createdAt: string;
}

interface ProfileContentProps {
  user: UserProfile;
  recentActivity: ActivityLog[];
}

export function ProfileContent({ user, recentActivity }: ProfileContentProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast({ title: 'Succès', description: 'Profil mis à jour' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      toast({ title: 'Succès', description: 'Mot de passe modifié' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gradient-gold">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Profile Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-card md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-gold flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-foreground">
                  {(user.name || user.email)[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold">{user.name || 'Sans nom'}</h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {ROLE_LABELS[user.role]}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {ROLE_DESCRIPTIONS[user.role]}
              </p>
              
              <div className="w-full mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{user._count.companies}</p>
                    <p className="text-xs text-muted-foreground">Missions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{user._count.activityLogs}</p>
                    <p className="text-xs text-muted-foreground">Actions</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Membre depuis {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <Tabs defaultValue="profile" className="h-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Sécurité
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activité
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      L&apos;email ne peut pas être modifié. Contactez un administrateur si nécessaire.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={ROLE_LABELS[user.role]}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading || name === user.name}
                    className="w-full bg-gradient-gold hover:opacity-90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <CardDescription>
                    Changez votre mot de passe pour sécuriser votre compte.
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleChangePassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full bg-gradient-teal hover:opacity-90"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <CardDescription>
                  Vos 10 dernières actions sur la plateforme.
                </CardDescription>
                
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((log, index) => {
                      const IconComponent = ACTIVITY_TYPE_ICONS[log.type];
                      const colorClass = ACTIVITY_TYPE_COLORS[log.type];
                      
                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{log.action}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {log.companyName && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {log.companyName}
                                </span>
                              )}
                              <span>{formatDateTime(log.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
