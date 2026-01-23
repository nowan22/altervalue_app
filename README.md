# AlterValue - Application de Calcul du Présentéisme

> **v2.0** - Application d'évaluation et de suivi du coût du présentéisme avec Méthode A (Macro) + Méthode B (Micro - Enquête)

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Status](https://img.shields.io/badge/status-Production-green)
![Méthode](https://img.shields.io/badge/méthode-A%20%2B%20B-orange)
![BNQ](https://img.shields.io/badge/BNQ-9700--800-purple)

---

## 📋 Sommaire

1. [Présentation](#-présentation)
2. [Fonctionnalités v1.0](#-fonctionnalités-v10-mvp)
3. [Architecture Technique](#-architecture-technique)
4. [Méthode A - Ratios Sectoriels](#-méthode-a---ratios-sectoriels)
5. [Données de Démonstration](#-données-de-démonstration)
6. [Roadmap - Itérations Futures](#-roadmap---itérations-futures)
7. [Guide d'Utilisation](#-guide-dutilisation)
8. [Déploiement](#-déploiement)

---

## 🎯 Présentation

**AlterValue** est une application SaaS destinée aux consultants RH et dirigeants d'entreprise pour évaluer, suivre et optimiser le coût du présentéisme dans leurs organisations.

Le présentéisme désigne le fait d'être présent au travail mais avec une productivité réduite (maladie, stress, démotivation). Cette "présence improductive" coûte en moyenne **1.5 à 2 fois plus cher** que l'absentéisme.

### Objectifs de l'application

- **Quantifier** le coût caché du présentéisme
- **Visualiser** les tendances et signaux d'alerte
- **Comparer** avec les benchmarks sectoriels
- **Simuler** différents scénarios d'amélioration

---

## ✅ Fonctionnalités v1.0 (MVP)

### 1. Authentification
| Fonctionnalité | Statut |
|---------------|--------|
| Inscription avec email/mot de passe | ✅ |
| Connexion sécurisée (NextAuth) | ✅ |
| Gestion de session | ✅ |
| Déconnexion | ✅ |
| Redirection automatique selon état | ✅ |

### 2. Gestion des Dossiers Entreprises
| Fonctionnalité | Statut |
|---------------|--------|
| Création de dossiers | ✅ |
| Liste avec recherche et filtres | ✅ |
| Vue détaillée complète | ✅ |
| Édition des informations | ✅ |
| Suppression (avec confirmation) | ✅ |
| Sélection du secteur d'activité | ✅ |
| Auto-remplissage des taux par défaut | ✅ |

### 3. Import CSV des KPI Historiques
| Fonctionnalité | Statut |
|---------------|--------|
| Template CSV téléchargeable | ✅ |
| Upload et parsing de fichiers | ✅ |
| Validation des données | ✅ |
| Prévisualisation avant import | ✅ |
| Messages d'erreur détaillés | ✅ |
| Import par lot | ✅ |
| Calcul automatique des métriques | ✅ |

### 4. Dashboard Prédictif
| Fonctionnalité | Statut |
|---------------|--------|
| Vue d'ensemble des KPI | ✅ |
| Cartes métriques animées | ✅ |
| Signaux couleurs (🔴🟠🟢) | ✅ |
| Graphiques de tendances | ✅ |
| Liste des entreprises prioritaires | ✅ |
| Alertes basées sur les seuils | ✅ |

### 5. Calculateur de Présentéisme (Méthode A)
| Fonctionnalité | Statut |
|---------------|--------|
| Calcul automatique complet | ✅ |
| Affichage des résultats détaillés | ✅ |
| Calculs intermédiaires visibles | ✅ |
| Ajustement des coefficients | ✅ |
| Simulation de scénarios | ✅ |
| Comparaison benchmarks | ✅ |
| Calculateur standalone | ✅ |

### 6. Paramétrage
| Fonctionnalité | Statut |
|---------------|--------|
| Configuration des coefficients | ✅ |
| Seuils des signaux couleurs | ✅ |
| Benchmarks sectoriels | ✅ |
| Réinitialisation aux défauts | ✅ |

---

## ✅ Fonctionnalités v1.1 (Améliorations UX)

### 1. Export des Rapports
| Fonctionnalité | Statut |
|---------------|--------|
| Export PDF du rapport de présentéisme | ✅ |
| Export PDF de l'historique KPI | ✅ |
| Templates PDF stylisés et professionnels | ✅ |
| Export Excel/CSV des données | ✅ |
| Format CSV compatible Excel français | ✅ |

### 2. Mode Sombre (Dark Mode)
| Fonctionnalité | Statut |
|---------------|--------|
| Toggle mode clair/sombre | ✅ |
| Détection automatique du système | ✅ |
| Persistence de la préférence | ✅ |
| Styling adapté pour tous les composants | ✅ |

### 3. Tableaux Triables
| Fonctionnalité | Statut |
|---------------|--------|
| Tri par colonnes (période, effectif, taux, coût) | ✅ |
| Indicateurs de tri (ascendant/descendant) | ✅ |
| Tri persistant pendant la session | ✅ |

### 4. Notifications Email
| Fonctionnalité | Statut |
|---------------|--------|
| Alerte email pour présentéisme critique | ✅ |
| Templates email HTML professionnels | ✅ |
| Bouton d'envoi d'alerte dans le dashboard | ✅ |
| Intégration API Abacus.AI | ✅ |

---

## ✅ Fonctionnalités v1.2 (Module BNQ 9700-800)

### 1. Dashboard BNQ
| Fonctionnalité | Statut |
|---------------|--------|
| Vue d'ensemble de la progression | ✅ |
| Progression globale avec pourcentage | ✅ |
| Progression documents | ✅ |
| Progression workflow | ✅ |
| Indicateur de statut | ✅ |
| Alerte documents manquants | ✅ |
| Badge objectif certification (Es/EsE/EsE+) | ✅ |

### 2. Coffre-fort Documentaire
| Fonctionnalité | Statut |
|---------------|--------|
| Liste des documents par catégorie | ✅ |
| Catégories BNQ (6 catégories) | ✅ |
| Ajout de documents | ✅ |
| Validation des documents | ✅ |
| Gestion des versions | ✅ |
| Signature électronique | ✅ |
| Horodatage | ✅ |
| Archivage automatique | ✅ |
| Badge statut par document | ✅ |
| Article BNQ référencé | ✅ |

### 3. Workflow Validation Direction
| Fonctionnalité | Statut |
|---------------|--------|
| 5 étapes de validation | ✅ |
| Tâches par étape | ✅ |
| Complétion des tâches | ✅ |
| Signature direction | ✅ |
| Notes et commentaires | ✅ |
| Progression automatique | ✅ |
| Indicateurs visuels | ✅ |

### 4. API Routes BNQ
| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/bnq/document-types` | GET | Types de documents BNQ |
| `/api/bnq/companies/[id]/documents` | GET, POST | Gestion documents |
| `/api/bnq/companies/[id]/documents/[docId]` | GET, PUT, DELETE | Document spécifique |
| `/api/bnq/companies/[id]/workflow` | GET | Workflow de validation |
| `/api/bnq/companies/[id]/workflow/[stepId]` | PUT | Mise à jour étape |
| `/api/bnq/companies/[id]/workflow/tasks/[taskId]` | PUT | Complétion tâche |
| `/api/bnq/companies/[id]/progress` | GET, PUT | Progression BNQ |

### 5. Données BNQ
| Élément | Nombre |
|---------|--------|
| Types de documents | 24 |
| Catégories | 6 |
| Niveaux certification | 3 (Es, EsE, EsE+) |
| Étapes workflow | 5 |
| Articles BNQ référencés | 15+ |

---

## ✅ Fonctionnalités v2.0 (Méthode B - Enquête Interne)

### 1. Système d'Enquêtes Anonymes
| Fonctionnalité | Statut |
|---------------|--------|
| Création d'enquêtes par entreprise | ✅ |
| Lien public anonyme (token unique) | ✅ |
| Questionnaire 5 étapes avec progression | ✅ |
| Validation RGPD (aucun identifiant) | ✅ |
| Statuts : Brouillon / Active / Clôturée | ✅ |
| Lancement et clôture des enquêtes | ✅ |
| Copie du lien de partage | ✅ |

### 2. Questionnaire Présentéisme (5 questions)
| Question | Type |
|----------|------|
| Q1 - Prévalence (fréquence du présentéisme) | Choix unique |
| Q2 - Efficacité perçue (100% à 50%) | Choix unique |
| Q3 - Facteurs (fatigue, stress, douleurs...) | Multi-choix |
| Q4 - Impact (qualité, délais, erreurs...) | Multi-choix |
| Q5 - Temps de travail hebdomadaire | Choix unique |

### 3. Calcul Méthode B
| Formule | Description |
|---------|-------------|
| L = 1 - avg_efficiency_score | Perte de productivité moyenne |
| N_c = N × p | Nombre de salariés concernés |
| H_d = N_c × hours × L | Heures dégradées |
| V_h = salary / hours | Valeur par heure |
| pres_cost_B = H_d × V_h × c_e | Coût du présentéisme |

### 4. Agrégation & Indicateurs
| Indicateur | Description |
|------------|-------------|
| respondentsCount | Nombre de répondants |
| prevalence | % de salariés concernés |
| avgEfficiencyScore | Efficacité moyenne |
| qualityFlag | LOW / MEDIUM / HIGH |
| factorDistribution | Distribution des facteurs |
| impactDistribution | Distribution des impacts |

### 5. API Routes Enquêtes
| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/companies/[id]/surveys` | GET, POST | Liste et création |
| `/api/surveys/[surveyId]` | GET, PUT, DELETE | Gestion enquête |
| `/api/surveys/[surveyId]/respond` | POST | Soumission anonyme |
| `/survey/[token]` | Page publique | Questionnaire anonyme |

### 6. Contraintes RGPD
| Règle | Implémentation |
|-------|----------------|
| Anonymat total | Aucun identifiant collecté |
| Minimum 10 répondants | Validation avant calcul |
| Qualité "haute" si ≥30% participation | Indicateur qualityFlag |
| Pas de segmentation < 10 | Non implémenté (confidentialité) |

---

## 🏗 Architecture Technique

### Stack Technologique

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  Next.js 14 + React 18 + TypeScript         │
│  Tailwind CSS + Framer Motion               │
│  Recharts (graphiques)                      │
├─────────────────────────────────────────────┤
│                  Backend                     │
│  Next.js API Routes                         │
│  NextAuth.js (authentification)             │
│  Prisma ORM                                 │
├─────────────────────────────────────────────┤
│                 Database                     │
│  PostgreSQL                                 │
└─────────────────────────────────────────────┘
```

### Structure du Projet

```
altervalue/
└── nextjs_space/
    ├── app/
    │   ├── api/                    # API Routes
    │   │   ├── auth/               # Authentification
    │   │   ├── companies/          # CRUD Entreprises
    │   │   ├── settings/           # Paramètres
    │   │   └── benchmarks/         # Benchmarks
    │   ├── dashboard/              # Pages Dashboard
    │   │   ├── companies/          # Gestion entreprises
    │   │   ├── calculator/         # Calculateur standalone
    │   │   └── settings/           # Paramétrage
    │   ├── login/                  # Page connexion
    │   └── signup/                 # Page inscription
    ├── components/
    │   └── ui/                     # Composants UI réutilisables
    ├── lib/
    │   ├── auth-options.ts         # Config NextAuth
    │   ├── presenteeism-calculator.ts  # Logique métier
    │   ├── sectors.ts              # Données sectorielles
    │   └── db.ts                   # Client Prisma
    ├── prisma/
    │   └── schema.prisma           # Schéma BDD
    └── scripts/
        └── seed.ts                 # Données de démo
```

### Modèle de Données

```
┌──────────────┐       ┌──────────────────┐
│    User      │───1:N─│     Company      │
├──────────────┤       ├──────────────────┤
│ id           │       │ id               │
│ email        │       │ name             │
│ password     │       │ sector           │
│ role         │       │ employees        │
│ name         │       │ avgSalary        │
└──────────────┘       │ absenteeismRate  │
                       │ isDemo           │
                       └────────┬─────────┘
                                │
                               1:N
                                │
                       ┌────────▼─────────┐
                       │   KpiSnapshot    │
                       ├──────────────────┤
                       │ id               │
                       │ periodDate       │
                       │ employees        │
                       │ avgSalary        │
                       │ absenteeismRate  │
                       │ presenteeismRate │
                       │ presenteeismCost │
                       └──────────────────┘

┌──────────────────┐   ┌──────────────────┐
│    Settings      │   │ SectorBenchmark  │
├──────────────────┤   ├──────────────────┤
│ coefficients     │   │ sector           │
│ thresholds       │   │ avgAbsenteeism   │
│ workingDays      │   │ avgPresenteeism  │
└──────────────────┘   │ benchmarkCost    │
                       └──────────────────┘
```

---

## 📊 Méthode A - Ratios Sectoriels

### Principe

La **Méthode A (Macro)** estime le coût du présentéisme à partir de ratios sectoriels et de coefficients statistiques validés. C'est une approche rapide permettant d'obtenir une estimation immédiate.

### Formules Implémentées

#### 1. Taux de Présentéisme
```
Taux_présentéisme = Taux_absentéisme × Coeff_pres_abs
```
- **Coeff_pres_abs** par défaut : `1.3` (le présentéisme est ~30% plus élevé que l'absentéisme)

#### 2. Nombre de Jours de Présentéisme
```
Jours_présentéisme = Taux_présentéisme × Effectif × Jours_travaillés
```
- **Jours_travaillés** par défaut : `220 jours/an`

#### 3. Perte de Productivité
```
Perte_productivité = Jours_présentéisme × Coeff_perte
```
- **Coeff_perte** par défaut : `0.33` (33% de perte de productivité en moyenne)

#### 4. Coût du Présentéisme
```
Coût = Perte_productivité × Salaire_chargé / Jours_travaillés

où Salaire_chargé = Salaire_brut × (1 + Taux_charges)
```

### Exemple de Calcul

| Donnée | Valeur |
|--------|--------|
| Effectif | 100 salariés |
| Salaire brut moyen | 3 500 €/mois |
| Taux de charges | 45% |
| Taux d'absentéisme | 5% |

**Résultat :**
- Taux de présentéisme : 5% × 1.3 = **6.5%**
- Jours de présentéisme : 6.5% × 100 × 220 = **1 430 jours**
- Perte de productivité : 1 430 × 0.33 = **472 jours**
- Salaire chargé annuel : 3 500 × 12 × 1.45 = **60 900 €**
- Coût journalier : 60 900 / 220 = **277 €/jour**
- **Coût total du présentéisme : 472 × 277 = 130 744 €/an**

### Signaux Couleurs

| Signal | Seuil Absentéisme | Interprétation |
|--------|-------------------|----------------|
| 🟢 Vert | < 4% | Situation saine |
| 🟠 Orange | 4% - 6% | Vigilance requise |
| 🔴 Rouge | > 6% | Situation critique |

---

## 🎭 Données de Démonstration

### Entreprises Pré-chargées

L'application inclut 3 entreprises de démonstration avec des profils différents :

| Entreprise | Secteur | Effectif | Profil | Signal |
|------------|---------|----------|--------|--------|
| **TechVision SA** | Technologies | 450 | En amélioration | 🟢 |
| **Manufacture Durand** | Industrie | 280 | Stable | 🟠 |
| **Groupe Santé Plus** | Santé | 620 | Critique | 🔴 |

### Historique KPI

Chaque entreprise dispose d'un historique de **12 à 24 mois** de données KPI permettant de visualiser les tendances.

### Compte de Démonstration

```
Email: demo@altervalue.com
Mot de passe: demo123
```

---

## 🗺 Roadmap - Itérations Futures

### 📌 v1.1 - Améliorations UX (Prochaine itération)

| Fonctionnalité | Priorité | Effort |
|----------------|----------|--------|
| Export PDF des rapports | Haute | 2-3 jours |
| Export Excel des données | Haute | 1-2 jours |
| Notifications email (alertes) | Moyenne | 2-3 jours |
| Mode sombre | Basse | 1 jour |
| Tableaux triables | Moyenne | 1 jour |

---

### 📌 v1.2 - Module BNQ 9700-800 "Entreprise en Santé"

**Objectif :** Transformer AlterValue en outil d'accompagnement à la certification BNQ 9700-800 (norme québécoise "Entreprise en santé").

#### 🎯 Contexte de la Norme BNQ 9700-800

La norme BNQ 9700-800 est une norme canadienne qui spécifie les exigences pour une démarche de prévention, promotion et pratiques organisationnelles favorables à la **santé et mieux-être en milieu de travail**. Elle définit 3 niveaux d'engagement progressifs :

| Niveau | Désignation | Description |
|--------|-------------|-------------|
| **[Es]** | Entreprise en santé | Niveau de base - Exigences fondamentales |
| **[EsE]** | Entreprise en santé - Élite | Niveau intermédiaire - Exigences renforcées |
| **[EsE+]** | Entreprise en santé - Élite plus | Niveau avancé - Exigences maximales |

#### 📊 Alignement AlterValue ↔ BNQ 9700-800

| Exigence BNQ (Article) | Couverture AlterValue v1.0 | v1.2 |
|------------------------|---------------------------|------|
| 7.4.5 Données administratives (absentéisme, coûts) | ✅ Partiel | ✅ Complet |
| 7.4.3 Fréquence présentéisme | ✅ Calculateur Méthode A | ✅ |
| 7.3 Calendrier collecte (2-3 ans) | ❌ | ✅ Alertes |
| 7.4.5.e Taux d'absentéisme et coût | ✅ | ✅ |
| 7.4.5.f Taux de roulement | ❌ | ✅ |
| 7.4.5.a Cotisations accidents travail | ❌ | ✅ |
| 7.4.5.b Coût assurances collectives | ❌ | ✅ |
| 7.4.5.g PAE (Programme Aide Employés) | ❌ | ✅ |
| 8.x Plan d'action avec interventions | ❌ | ✅ |
| 9.x Évaluation et rapports | ❌ | ✅ |
| Checklist conformité par niveau | ❌ | ✅ |

#### 🚀 Fonctionnalités v1.2

| Module | Description | Effort |
|--------|-------------|--------|
| **1. Tableau de bord BNQ** | Vue dédiée conformité avec jauge de progression par niveau (Es/EsE/EsE+) | 2 jours |
| **2. Checklist interactive** | Liste des 80+ exigences de la norme avec statut (conforme/non-conforme/en cours) par chapitre (5-9) | 3 jours |
| **3. KPI étendus BNQ** | Nouveaux champs : cotisations CNESST, assurances collectives, PAE, taux de roulement, accidents travail | 2 jours |
| **4. Module Plan d'action** | Création d'interventions selon les 4 sphères d'activité (habitudes de vie, conciliation travail-vie, environnement travail, pratiques gestion) | 3 jours |
| **5. Suivi des interventions** | Objectifs mesurables, responsables, échéances, évaluation participation/satisfaction | 2 jours |
| **6. Alertes & Rappels** | Notifications pour : collecte données (2-3 ans), révision politique (3 ans), mise à jour données admin (annuel pour EsE+) | 1 jour |
| **7. Rapport de conformité BNQ** | Génération automatique du rapport synthèse (article 9.3.2) avec données dépersonnalisées | 2 jours |
| **8. Documentation générée** | Templates : politique santé mieux-être, mandat comité, mesures confidentialité | 2 jours |
| **9. Coffre-fort documentaire** | Gestion des preuves d'adhésion direction et documents réglementaires (voir détail ci-dessous) | 3 jours |
| **10. Workflow validation direction** | Circuit de validation avec signatures électroniques et horodatage | 2 jours |

**Effort total estimé : 3-4 semaines**

#### 📁 Module 9 : Coffre-fort Documentaire & Preuves d'Adhésion

Ce module permet de centraliser, suivre et valider tous les documents requis pour la démarche BNQ et la conformité réglementaire.

##### 🗂️ Liste des Documents Requis

| Catégorie | Document | Exigence BNQ | Obligatoire | Fréquence Révision |
|-----------|----------|--------------|-------------|-------------------|
| **ENGAGEMENT DIRECTION** | | | | |
| | Note d'intention / Lettre d'engagement | Art. 5.1 [Es] | ✅ | Initial + si changement |
| | PV approbation Conseil d'Administration | Art. 5.2 [Es] | ✅ | À chaque révision politique |
| | Nomination représentant direction | Art. 5.5.1 [Es] | ✅ | Si changement |
| | Nomination responsable démarche | Art. 5.5.1 [Es] | ⚪ Optionnel | Si changement |
| **POLITIQUE & GOUVERNANCE** | | | | |
| | Politique santé et mieux-être | Art. 5.2 [Es] | ✅ | 3 ans |
| | Mandat et objectifs du comité | Art. 6.2 [Es] | ✅ | 3 ans |
| | Liste des membres du comité | Art. 6.1 [Es] | ✅ | Annuel |
| | Comptes-rendus réunions comité (min 4/an) | Art. 6.2 [Es] | ✅ | Continu |
| **SST & RISQUES** | | | | |
| | **DUERP** (Document Unique d'Évaluation des Risques Professionnels) | Art. 5.3.1 [Es] | ✅ 🇫🇷 | Annuel |
| | Méthode identification/contrôle risques | Art. 5.3.1 [Es] | ✅ | Continu |
| | Programme de prévention SST | Art. 5.3 [Es] | ✅ | Annuel |
| | Registre accidents du travail | Art. 7.4.5.h [EsE+] | ✅ | Continu |
| **MESURES RH** | | | | |
| | Procédure retour au travail | Art. 5.4.a [Es] | ✅ | 3 ans |
| | Procédure maintien au travail | Art. 5.4.b [EsE+] | ⚪ EsE+ | 3 ans |
| | Description tâches gestionnaires (volet santé) | Art. 5.7 [EsE] | ⚪ EsE | Si modification |
| | Plan développement compétences gestionnaires | Art. 5.7 [EsE+] | ⚪ EsE+ | Annuel |
| **CONFIDENTIALITÉ** | | | | |
| | Mesures confidentialité (écrites) | Art. 7.2 [Es] | ✅ | 3 ans |
| | Consentement collecte données | Art. 7.2 [Es] | ✅ | Par collecte |
| | Politique protection données personnelles | Annexe B | ✅ | 3 ans |
| **COLLECTE & RAPPORTS** | | | | |
| | Rapport collecte données personnel | Art. 7.5.1 [Es] | ✅ | 2-3 ans |
| | Rapport données administratives | Art. 7.5.1 [Es] | ✅ | Annuel (EsE+) |
| | Plan d'action santé mieux-être | Art. 8.1 [Es] | ✅ | Annuel |
| | Rapport synthèse annuel | Art. 9.3.2 [Es] | ✅ | Annuel |
| | Synthèse revue annuelle démarche | Art. 9.4 [EsE] | ⚪ EsE | Annuel |

##### 📋 Fonctionnalités du Coffre-fort

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COFFRE-FORT DOCUMENTAIRE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📤 UPLOAD & STOCKAGE                                                   │
│  ├─ Upload documents (PDF, Word, images)                                │
│  ├─ Catégorisation automatique par type                                 │
│  ├─ Versioning (historique des versions)                                │
│  └─ Stockage sécurisé avec chiffrement                                  │
│                                                                         │
│  ✅ VALIDATION & SIGNATURES                                             │
│  ├─ Circuit de validation configurable                                  │
│  ├─ Signature électronique (représentant direction)                     │
│  ├─ Horodatage certifié                                                 │
│  └─ Statuts : Brouillon → En validation → Approuvé → Archivé            │
│                                                                         │
│  🔔 ALERTES & ÉCHÉANCES                                                 │
│  ├─ Rappel révision politique (3 ans)                                   │
│  ├─ Rappel mise à jour DUERP (annuel)                                   │
│  ├─ Alerte documents manquants par niveau BNQ                           │
│  └─ Notification expiration documents                                   │
│                                                                         │
│  📊 TABLEAU DE BORD PREUVES                                             │
│  ├─ Jauge complétude par catégorie                                      │
│  ├─ Liste documents manquants pour certification                        │
│  ├─ Historique des validations                                          │
│  └─ Export dossier audit BNQ                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 🔄 Workflow Validation Direction (Module 10)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PROCESSUS D'ADHÉSION DIRECTION                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ÉTAPE 1 : ENGAGEMENT INITIAL                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ □ Rédaction note d'intention                                        │ │
│  │ □ Identification représentant direction                             │ │
│  │ □ Communication engagement aux parties prenantes                    │ │
│  │ □ ✍️ Signature électronique direction générale                      │ │
│  │ └── Horodatage: ____/____/____                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                           │
│  ÉTAPE 2 : POLITIQUE SANTÉ MIEUX-ÊTRE                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ □ Rédaction politique (utiliser template AlterValue)                │ │
│  │ □ Validation comité santé mieux-être                                │ │
│  │ □ Approbation CA / Direction                                        │ │
│  │ □ ✍️ Signature électronique + PV approbation                        │ │
│  │ □ Communication au personnel                                        │ │
│  │ □ Affichage (EsE)                                                   │ │
│  │ └── Prochaine révision: ____/____/____ (max 3 ans)                  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                           │
│  ÉTAPE 3 : MISE EN PLACE COMITÉ                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ □ Constitution du comité (min 4 membres)                            │ │
│  │ □ Définition mandat et objectifs                                    │ │
│  │ □ Communication liste membres au personnel                          │ │
│  │ □ ✍️ Validation représentant direction                              │ │
│  │ └── Date constitution: ____/____/____                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                           │
│  ÉTAPE 4 : DOCUMENTS SST & RISQUES                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ □ DUERP à jour (obligatoire France)                                 │ │
│  │ □ Méthode identification risques documentée                         │ │
│  │ □ Procédures retour/maintien au travail                             │ │
│  │ □ ✍️ Validation responsable SST + direction                         │ │
│  │ └── Dernière mise à jour DUERP: ____/____/____                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                           │
│  ÉTAPE 5 : CONFIDENTIALITÉ & RGPD                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ □ Mesures confidentialité rédigées                                  │ │
│  │ □ Politique protection données                                      │ │
│  │ □ Formulaire consentement collecte                                  │ │
│  │ □ ✍️ Validation DPO / Direction                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                              ↓                                           │
│  ✅ ADHÉSION DIRECTION COMPLÈTE                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🎉 Tous les documents requis sont validés                           │ │
│  │ 📋 Dossier prêt pour audit BNQ niveau [Es]                          │ │
│  │ 📤 Export dossier certification disponible                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

##### 🇫🇷 Focus DUERP (Document Unique d'Évaluation des Risques Professionnels)

Le **DUERP** est obligatoire en France (Code du travail art. R4121-1) et s'intègre parfaitement avec les exigences BNQ :

| Élément DUERP | Correspondance BNQ | Intégration AlterValue |
|---------------|-------------------|------------------------|
| Identification des risques | Art. 5.3.1 | Formulaire structuré |
| Évaluation des risques | Art. 5.3.1 | Matrice gravité/fréquence |
| Plan d'actions préventives | Art. 8 Plan d'action | Lien automatique |
| Mise à jour annuelle | Art. 7.3 Calendrier | Alertes automatiques |
| Risques psychosociaux (RPS) | Art. 7.4.2.d Pratiques gestion | Questionnaire intégré |

**Effort total estimé : 3-4 semaines**

#### 📋 Détail des 4 Sphères d'Activité (Article 7.4.1)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPHÈRES D'ACTIVITÉ BNQ                       │
├─────────────────────┬───────────────────────────────────────────┤
│ 1. Habitudes de vie │ Nutrition, activité physique, tabagisme,  │
│                     │ gestion du stress, sommeil, alcool/drogues │
├─────────────────────┼───────────────────────────────────────────┤
│ 2. Conciliation     │ Horaires flexibles, télétravail, congés,  │
│    travail-vie      │ banques de temps, semaine réduite         │
├─────────────────────┼───────────────────────────────────────────┤
│ 3. Environnement    │ Ergonomie, éclairage, bruit, salubrité,   │
│    de travail       │ équipements, facteurs de risque SST       │
├─────────────────────┼───────────────────────────────────────────┤
│ 4. Pratiques de     │ 8 éléments : harcèlement, reconnaissance, │
│    gestion          │ autonomie, charge travail, soutien,       │
│                     │ justice/équité, compétences, information  │
└─────────────────────┴───────────────────────────────────────────┘
```

#### 📈 Nombre d'Interventions Requises par Niveau

| Niveau | Besoins prioritaires | Interventions | Dont Pratiques Gestion |
|--------|---------------------|---------------|------------------------|
| [Es]   | 1 minimum           | 2 minimum     | -                      |
| [EsE]  | 2 minimum           | 4 minimum     | 1 minimum              |
| [EsE+] | 3 minimum           | 6 minimum     | 2 minimum              |

#### 🔗 Références Normatives

- **CAN/BNQ 9700-800/2020 (R 2024)** - Prévention, promotion et pratiques organisationnelles favorables à la santé en milieu de travail
- **CAN/CSA-Z1003-13/BNQ 9700-803/2013** - Santé et sécurité psychologiques en milieu de travail
- Bureau de normalisation du Québec (BNQ)

---

### 📌 v2.0 - Méthode B (Enquête Interne)

**Objectif :** Ajouter la méthode de calcul basée sur les données déclaratives des salariés.

| Fonctionnalité | Description | Effort |
|----------------|-------------|--------|
| **Module Questionnaire** | Création et gestion de questionnaires anonymes | 1 semaine |
| **Portail Salarié** | Interface de réponse anonyme | 3-4 jours |
| **Agrégation des Données** | Traitement statistique des réponses | 2-3 jours |
| **Calcul Méthode B** | Implémentation des 7 formules | 2-3 jours |
| **Comparaison A vs B** | Dashboard comparatif des deux méthodes | 2-3 jours |
| **Conformité RGPD** | Anonymisation et consentement | 2-3 jours |

#### Formules Méthode B (à implémenter)

1. Heures déclarées de perte : `H_d = Σ(heures_répondants)`
2. Valeur horaire : `V_h = Salaire_chargé / (Jours × 7)`
3. Coefficient d'extrapolation : `c_e = Effectif / Nb_répondants`
4. Perte monétaire : `Perte = H_d × V_h × c_e`
5. Score d'efficacité : `SE = Moyenne(scores_répondants)`
6. Perte ajustée : `Perte_ajustée = Perte × (1 - SE/100)`
7. Prévalence : `Prévalence = Nb_affectés / Nb_répondants`

---

### 📌 v2.1 - Analyse Prédictive

| Fonctionnalité | Description |
|----------------|-------------|
| Prédiction des tendances | ML pour anticiper l'évolution des KPI |
| Alertes prédictives | Détection précoce des dégradations |
| Recommandations automatiques | Suggestions d'actions basées sur les données |
| Scoring de risque | Note de risque présentéisme par entreprise |

---

### 📌 v2.2 - Collaboration & Multi-tenant

| Fonctionnalité | Description |
|----------------|-------------|
| Gestion multi-utilisateurs | Équipes de consultants |
| Rôles et permissions | Admin, Consultant, Viewer |
| Partage de dossiers | Collaboration inter-consultants |
| Historique des modifications | Audit trail complet |
| Commentaires et notes | Documentation contextuelle |

---

### 📌 v3.0 - Écosystème Étendu

| Fonctionnalité | Description |
|----------------|-------------|
| API publique | Intégration avec SIRH externes |
| Connecteurs | SAP, Workday, ADP, etc. |
| Application mobile | Consultation des dashboards |
| White-label | Personnalisation pour cabinets conseil |
| Marketplace de benchmarks | Enrichissement des données sectorielles |

---

## 📖 Guide d'Utilisation

### Première Connexion

1. Accéder à l'application via l'URL de déploiement
2. Créer un compte ou utiliser le compte démo
3. Explorer les entreprises de démonstration

### Créer un Dossier Entreprise

1. Dashboard → "Entreprises" → "Nouvelle entreprise"
2. Remplir les informations (nom, secteur, effectif, salaires)
3. Le taux d'absentéisme est auto-rempli selon le secteur
4. Cliquer sur "Créer l'entreprise"

### Importer des KPI Historiques

1. Ouvrir le dossier entreprise
2. Onglet "Import CSV"
3. Télécharger le template CSV
4. Compléter avec vos données (format: période;effectif;salaire;charges;absentéisme)
5. Uploader et valider

### Utiliser le Calculateur

1. Ouvrir le dossier entreprise → Onglet "Calculateur"
2. Ajuster les paramètres si nécessaire
3. Observer les résultats en temps réel
4. Simuler différents scénarios

### Configurer les Paramètres

1. Menu → "Paramètres"
2. Onglet "Coefficients" : ajuster les ratios de calcul
3. Onglet "Seuils" : personnaliser les signaux couleurs
4. Onglet "Benchmarks" : consulter les références sectorielles

---

## 🚀 Déploiement

### URL de Production

```
https://altervalue-25c20u.abacusai.app
```

### Variables d'Environnement Requises

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://altervalue-25c20u.abacusai.app
```

### Commandes Utiles

```bash
# Installation des dépendances
yarn install

# Générer le client Prisma
yarn prisma generate

# Appliquer les migrations
yarn prisma migrate deploy

# Charger les données de démo
yarn prisma db seed

# Lancer en développement
yarn dev

# Build production
yarn build
```

---

## 📞 Support

Pour toute question ou suggestion concernant AlterValue :

- **Documentation** : Ce README
- **PRD complet** : `/home/ubuntu/Uploads/PRD_2.1.md`
- **Analyse des méthodes** : `/home/ubuntu/methodes_comparaison.md`

---

## 📄 Licence

© 2024 AlterValue - Tous droits réservés

---

*Dernière mise à jour : Janvier 2026*
