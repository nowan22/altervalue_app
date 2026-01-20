'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Check,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  FileCheck,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CATEGORY_LABELS, STATUS_LABELS, BNQ_LEVEL_LABELS } from '@/lib/bnq-data';
import type { DocumentCategory, BnqLevel } from '@prisma/client';

interface DocumentVaultProps {
  companyId: string;
  documents: Array<{
    id: string;
    fileName: string;
    status: string;
    version: number;
    createdAt: string;
    validatedAt: string | null;
    notes?: string | null;
    documentType: {
      id: string;
      code: string;
      name: string;
      category: string;
      bnqArticle: string | null;
      requiredForLevel: string;
      isOptional: boolean;
      revisionFrequency: string | null;
    };
  }>;
  documentTypes: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    bnqArticle: string | null;
    requiredForLevel: string;
    isOptional: boolean;
    revisionFrequency: string | null;
    sortOrder: number;
  }>;
  onRefresh: () => void;
}

export function DocumentVault({ companyId, documents, documentTypes, onRefresh }: DocumentVaultProps) {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_LABELS))
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<typeof documents[0] | null>(null);
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [validationSignature, setValidationSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Group documents by category
  const docsByCategory = documentTypes.reduce((acc, docType) => {
    const category = docType.category as DocumentCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    const doc = documents.find(
      d => d.documentType.id === docType.id && d.status !== 'ARCHIVED'
    );
    acc[category].push({ docType, doc });
    return acc;
  }, {} as Record<DocumentCategory, Array<{ docType: typeof documentTypes[0]; doc?: typeof documents[0] }>>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddDocument = async () => {
    if (!selectedDocType || !fileName) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bnq/companies/${companyId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTypeId: selectedDocType,
          fileName,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout');

      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté avec succès',
      });

      setIsAddDialogOpen(false);
      setSelectedDocType('');
      setFileName('');
      setNotes('');
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateDocument = async (newStatus: 'PENDING_VALIDATION' | 'APPROVED') => {
    if (!selectedDoc) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bnq/companies/${companyId}/documents/${selectedDoc.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            validationSignature: newStatus === 'APPROVED' ? validationSignature : undefined,
          }),
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la validation');

      toast({
        title: newStatus === 'APPROVED' ? 'Document approuvé' : 'Document soumis',
        description: newStatus === 'APPROVED' 
          ? 'Le document a été approuvé avec succès'
          : 'Le document a été soumis pour validation',
      });

      setIsValidateDialogOpen(false);
      setSelectedDoc(null);
      setValidationSignature('');
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDoc) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bnq/companies/${companyId}/documents/${selectedDoc.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé avec succès',
      });

      setIsDeleteDialogOpen(false);
      setSelectedDoc(null);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_VALIDATION':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-600" />;
      case 'EXPIRED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Coffre-fort Documentaire
          </h2>
          <p className="text-sm text-muted-foreground">
            Gérez les preuves documentaires pour la certification BNQ
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Document Categories */}
      <div className="space-y-3">
        {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map(category => {
          const items = docsByCategory[category] || [];
          const uploadedCount = items.filter(i => i.doc).length;
          const requiredCount = items.filter(i => !i.docType.isOptional).length;
          const isExpanded = expandedCategories.has(category);

          return (
            <Card key={category}>
              <CardHeader
                className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">
                      {CATEGORY_LABELS[category]}
                    </CardTitle>
                  </div>
                  <Badge variant={uploadedCount >= requiredCount ? 'default' : 'secondary'}>
                    {uploadedCount}/{requiredCount} obligatoires
                  </Badge>
                </div>
              </CardHeader>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {items.map(({ docType, doc }) => (
                          <div
                            key={docType.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              doc
                                ? doc.status === 'APPROVED'
                                  ? 'bg-green-50 border-green-200'
                                  : doc.status === 'PENDING_VALIDATION'
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-gray-50 border-gray-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {doc ? (
                                getStatusIcon(doc.status)
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {docType.name}
                                  {docType.isOptional && (
                                    <span className="text-muted-foreground ml-2">(optionnel)</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {docType.bnqArticle && (
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                      {docType.bnqArticle}
                                    </span>
                                  )}
                                  {docType.revisionFrequency && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {docType.revisionFrequency}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-[10px]">
                                    {BNQ_LEVEL_LABELS[docType.requiredForLevel as BnqLevel]?.badge}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {doc ? (
                                <>
                                  <Badge className={STATUS_LABELS[doc.status]?.color || 'bg-gray-500'}>
                                    {STATUS_LABELS[doc.status]?.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    v{doc.version}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDoc(doc);
                                      setIsValidateDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDoc(doc);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocType(docType.id);
                                    setIsAddDialogOpen(true);
                                  }}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Ajouter
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau document au coffre-fort
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de document *</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(dt => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name} {dt.isOptional ? '(optionnel)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom du fichier *</Label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Ex: Note_intention_2024.pdf"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaires ou informations complémentaires..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddDocument} disabled={isLoading}>
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate Document Dialog */}
      <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du document</DialogTitle>
            <DialogDescription>
              {selectedDoc?.documentType.name}
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fichier</p>
                  <p className="font-medium">{selectedDoc.fileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">v{selectedDoc.version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <Badge className={STATUS_LABELS[selectedDoc.status]?.color}>
                    {STATUS_LABELS[selectedDoc.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Créé le</p>
                  <p className="font-medium">
                    {new Date(selectedDoc.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {selectedDoc.status === 'DRAFT' && (
                <div className="space-y-2">
                  <Label>Signature de validation</Label>
                  <Input
                    value={validationSignature}
                    onChange={(e) => setValidationSignature(e.target.value)}
                    placeholder="Entrez votre nom pour signer"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidateDialogOpen(false)}>
              Fermer
            </Button>
            {selectedDoc?.status === 'DRAFT' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleValidateDocument('PENDING_VALIDATION')}
                  disabled={isLoading}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Soumettre
                </Button>
                <Button
                  onClick={() => handleValidateDocument('APPROVED')}
                  disabled={isLoading || !validationSignature}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </>
            )}
            {selectedDoc?.status === 'PENDING_VALIDATION' && (
              <Button
                onClick={() => handleValidateDocument('APPROVED')}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Approuver
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document &quot;{selectedDoc?.fileName}&quot; sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
