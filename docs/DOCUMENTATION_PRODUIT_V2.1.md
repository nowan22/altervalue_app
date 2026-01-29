# AlterValue - Documentation Produit v2.1

**Version:** 2.1  
**Date de mise à jour:** 25 janvier 2026  
**Module concerné:** Méthode B - Analyse du Présentéisme par Enquête

---

## Table des matières

1. [Calcul Indicatif du Présentéisme (Enquête en cours)](#1-calcul-indicatif-du-présentéisme-enquête-en-cours)
2. [Dashboard Comparatif A vs B](#2-dashboard-comparatif-a-vs-b)
3. [Visualisations Graphiques des Résultats d'Enquête](#3-visualisations-graphiques-des-résultats-denquête)
4. [Export PDF du Rapport Méthode B](#4-export-pdf-du-rapport-méthode-b)

---

## 1. Calcul Indicatif du Présentéisme (Enquête en cours)

### Description

Cette fonctionnalité permet d'obtenir une **estimation préliminaire** du coût du présentéisme avant la clôture officielle de l'enquête Méthode B. L'objectif est d'offrir aux gestionnaires une visibilité anticipée sur les tendances émergentes.

### Accès

**Chemin:** Entreprise > Onglet "Enquête" > Section enquêtes actives

### Prérequis

- Une enquête Méthode B doit être **active** (statut "En cours")
- L'enquête doit avoir reçu **minimum 10 réponses** pour garantir une significativité statistique minimale

### Fonctionnement

1. Accédez à la fiche de l'entreprise concernée
2. Cliquez sur l'onglet **"Enquête"**
3. Dans la liste des enquêtes, repérez une enquête active avec ≥10 réponses
4. Cliquez sur le bouton **"Calculer (indicatif)"** (icône calculatrice)

### Résultats affichés

Les résultats indicatifs sont affichés dans un **encadré de couleur ambre** (pour les différencier des résultats définitifs en rouge) et comprennent :

| Indicateur | Description |
|------------|-------------|
| **Prévalence** | Pourcentage d'employés ayant déclaré du présentéisme |
| **Coût estimé** | Coût annuel estimé du présentéisme (€) |
| **% Masse salariale** | Proportion du coût par rapport à la masse salariale |
| **Nombre de répondants** | Taille de l'échantillon utilisé pour le calcul |
| **Date/heure du calcul** | Horodatage de l'estimation |

### Avertissements

⚠️ Un **bandeau d'avertissement** rappelle que :
- Les résultats sont **provisoires** et basés sur un échantillon partiel
- Les chiffres définitifs seront disponibles après clôture de l'enquête
- L'intervalle de confiance n'est pas encore calculable

### Spécifications techniques

- **API Endpoint:** `POST /api/surveys/[surveyId]/calculate-preview`
- **Champ distinctif:** `isIndicative: true` dans la réponse
- **Formule utilisée:** Identique à Méthode B (Stanford Presenteeism Scale modifiée)

---

## 2. Dashboard Comparatif A vs B

### Description

Ce tableau de bord offre une **analyse comparative côte à côte** entre la Méthode A (estimation macro par ratios sectoriels) et la Méthode B (mesure micro par enquête). Il permet d'évaluer l'écart entre les deux approches et de valider/affiner les hypothèses de calcul.

### Accès

**Chemin:** Entreprise > Onglet **"A vs B"**

### Prérequis

- L'entreprise doit avoir des **données de base** saisies (effectifs, masse salariale, taux d'absentéisme)
- Idéalement, une **enquête Méthode B clôturée** pour une comparaison complète

### Composants du Dashboard

#### 2.1 Cartes de synthèse

| Carte | Méthode A | Méthode B |
|-------|-----------|----------|
| **Coût annuel** | Estimé via ratios sectoriels | Calculé via enquête |
| **% Masse salariale** | Benchmark sectoriel | Mesuré réel |
| **Écart** | - | Différence absolue et relative |

#### 2.2 Graphique comparatif (Barres)

Un **diagramme à barres** compare visuellement :
- Coût annuel Méthode A (bleu)
- Coût annuel Méthode B (vert)
- Écart mis en évidence

#### 2.3 Graphique Radar

Un **diagramme radar** à 3 axes permet de comparer :

| Axe | Description |
|-----|-------------|
| **Coût/MS** | Coût en pourcentage de la masse salariale |
| **Prévalence** | Taux de présentéisme (A = estimé, B = mesuré) |
| **Fiabilité** | Score de qualité de la méthode (fixe pour A, variable pour B selon le taux de participation) |

#### 2.4 Section Interprétation

Une **analyse contextuelle automatique** incluant :

- **Convergence/Divergence** : Évaluation si les deux méthodes donnent des résultats similaires
- **Recommandations** : Suggestions d'actions selon l'écart constaté
- **Qualité des données** : Évaluation automatique basée sur le taux de réponse

### Indicateurs de qualité

| Taux de participation | Qualité | Couleur |
|----------------------|---------|--------|
| ≥ 70% | Excellente | Vert |
| 50-69% | Bonne | Bleu |
| 30-49% | Moyenne | Orange |
| < 30% | Faible | Rouge |

### Spécifications techniques

- **Composant:** `method-comparison.tsx`
- **Bibliothèque graphique:** Recharts
- **Données sources:** `calculatePresenteeism()` (A) + `survey.aggregate` (B)

---

## 3. Visualisations Graphiques des Résultats d'Enquête

### Description

Cet onglet présente une **analyse visuelle approfondie** des résultats de l'enquête Méthode B à travers des indicateurs clés et des graphiques interactifs.

### Accès

**Chemin:** Entreprise > Onglet **"Résultats"**

### Prérequis

- Au moins une enquête Méthode B doit avoir été réalisée
- Idéalement, l'enquête doit être **clôturée** pour des résultats définitifs

### Composants de visualisation

#### 3.1 Cartes KPI de synthèse

Quatre **indicateurs clés** en haut de page :

| KPI | Description | Icône |
|-----|-------------|-------|
| **Répondants** | Nombre total de participants à l'enquête | Users |
| **Prévalence** | % d'employés ayant déclaré du présentéisme | TrendingUp |
| **Score efficacité moyen** | Score moyen sur l'échelle 0-100% | Gauge |
| **Perte de productivité** | Jours équivalents perdus (estimé) | TrendingDown |

#### 3.2 Graphique des Facteurs Contributifs (Barres horizontales)

Diagramme à barres montrant la **répartition des causes** du présentéisme :

| Facteur | Description |
|---------|-------------|
| **Fatigue** | Épuisement physique ou mental |
| **Stress** | Pression professionnelle |
| **Douleur** | Problèmes physiques/musculaires |
| **Concentration** | Difficultés cognitives |
| **Autre** | Facteurs non catégorisés |

*Les barres sont colorées par catégorie avec pourcentages affichés.*

#### 3.3 Graphique des Impacts sur le Travail (Camembert)

Diagramme circulaire montrant la **nature des impacts** :

| Impact | Description |
|--------|-------------|
| **Qualité** | Baisse de qualité du travail produit |
| **Retards** | Délais non respectés |
| **Collègues** | Impact sur la charge de travail des collègues |
| **Erreurs** | Augmentation du taux d'erreurs |

#### 3.4 Jauge d'Efficacité Moyenne (Radial)

Une **jauge radiale** affichant le score d'efficacité moyen déclaré :

- **100%** = Pleine efficacité
- **Zone verte** : > 80%
- **Zone orange** : 60-80%
- **Zone rouge** : < 60%

#### 3.5 Indicateurs de Qualité de l'Enquête

| Indicateur | Calcul |
|------------|--------|
| **Taux de participation** | Répondants / Effectifs × 100 |
| **Niveau de confiance** | Basé sur le nombre de réponses et l'écart-type |

### Spécifications techniques

- **Composant:** `survey-results.tsx`
- **Bibliothèque graphique:** Recharts (BarChart, PieChart, RadialBarChart)
- **Données sources:** `survey.aggregate` + calculs dérivés

---

## 4. Export PDF du Rapport Méthode B

### Description

Cette fonctionnalité génère un **rapport PDF professionnel** contenant l'ensemble des résultats de l'enquête Méthode B, prêt à être partagé avec la direction ou archivé.

### Accès

**Chemin:** Entreprise > Onglet "Enquête" > Enquête clôturée > Bouton **"Export PDF"**

### Prérequis

- L'enquête doit être au statut **"CLOSED"** (clôturée)
- Des résultats agrégés doivent être disponibles

### Contenu du rapport

#### Page de titre
- Logo AlterValue
- Titre : "Rapport d'Analyse du Présentéisme - Méthode B"
- Nom de l'entreprise
- Date de génération

#### Section 1 : Informations Entreprise

| Champ | Valeur |
|-------|--------|
| Nom | Nom de l'entreprise |
| Secteur | Secteur d'activité |
| Effectifs | Nombre d'employés |
| Période d'enquête | Date début - Date fin |

#### Section 2 : Résultats Principaux (Mise en évidence)

Trois **indicateurs clés** encadrés et mis en valeur :

| Indicateur | Présentation |
|------------|-------------|
| **Coût annuel** | XX XXX € (grande police, encadré coloré) |
| **% Masse salariale** | X.X% (badge de couleur selon seuils) |
| **Coût par employé** | XXX €/an/employé |

#### Section 3 : Métriques de l'Enquête

| Métrique | Valeur |
|----------|--------|
| Répondants | N |
| Prévalence | X% |
| Score efficacité moyen | X% |
| Qualité des données | Excellente/Bonne/Moyenne |

#### Section 4 : Répartition des Facteurs

Barres horizontales montrant la distribution des causes :
- Fatigue : XX%
- Stress : XX%
- Douleur : XX%
- Concentration : XX%
- Autre : XX%

#### Section 5 : Répartition des Impacts

Barres horizontales montrant la distribution des impacts :
- Qualité : XX%
- Retards : XX%
- Collègues : XX%
- Erreurs : XX%

#### Section 6 : Méthodologie

Explication de la méthode de calcul :

```
Coût Présentéisme = Σ (Score_efficacité × Salaire_moyen × Jours_travaillés)
```

- Référence : Stanford Presenteeism Scale (SPS-6) adaptée
- Période de référence : 4 semaines glissantes

### Génération du PDF

1. Cliquez sur le bouton **"Export PDF"** (icône FileDown)
2. Une nouvelle fenêtre/onglet s'ouvre avec le rapport formaté
3. La boîte de dialogue d'impression s'ouvre automatiquement
4. Sélectionnez **"Enregistrer en PDF"** comme destination
5. Cliquez sur **Enregistrer**

### Caractéristiques du rapport

- **Format:** A4 Portrait
- **Style:** Professionnel avec dégradés et couleurs de marque
- **Optimisation impression:** CSS @media print intégré
- **En-tête/Pied de page:** Logo + pagination

### Spécifications techniques

- **API Endpoint:** `GET /api/surveys/[surveyId]/export-pdf`
- **Format de sortie:** HTML optimisé pour impression/PDF
- **Méthode de génération:** Rendu côté serveur avec ouverture dans nouvel onglet

---

## Annexe : Schéma d'Architecture v2.1

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTREPRISE - Fiche détaillée                  │
├─────────────────────────────────────────────────────────────────┤
│  [Vue d'ensemble] [Calculateur] [Enquête] [A vs B] [Résultats]  │
│  [Import CSV] [Historique]                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Onglet ENQUÊTE                                                  │
│  ├── Liste des enquêtes                                          │
│  │   ├── Enquête ACTIVE                                          │
│  │   │   ├── Bouton [Calculer (indicatif)] ← Feature v2.1 #1    │
│  │   │   └── Affichage résultats provisoires (ambre)             │
│  │   └── Enquête CLOSED                                          │
│  │       ├── Résultats définitifs (rouge)                        │
│  │       └── Bouton [Export PDF] ← Feature v2.1 #4              │
│  │                                                               │
│  Onglet A vs B  ← Feature v2.1 #2                                │
│  ├── Cartes comparatives                                         │
│  ├── Graphique barres                                            │
│  ├── Graphique radar                                             │
│  └── Section interprétation                                      │
│                                                                  │
│  Onglet RÉSULTATS  ← Feature v2.1 #3                             │
│  ├── KPI Cards (4)                                               │
│  ├── Graphique facteurs (barres)                                 │
│  ├── Graphique impacts (camembert)                               │
│  └── Jauge efficacité                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Changelog v2.1

| Feature | Description | Fichiers impactés |
|---------|-------------|-------------------|
| #1 | Calcul indicatif présentéisme | `survey-management.tsx`, `/api/surveys/[surveyId]/calculate-preview/route.ts` |
| #2 | Dashboard A vs B | `method-comparison.tsx`, `company-detail.tsx` |
| #3 | Visualisations résultats | `survey-results.tsx`, `company-detail.tsx` |
| #4 | Export PDF | `/api/surveys/[surveyId]/export-pdf/route.ts`, `survey-management.tsx` |

---

*Documentation générée automatiquement - AlterValue v2.1*
