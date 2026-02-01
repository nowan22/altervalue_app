# Documentation AlterValue - Aide Complète

---

## 1. Tableau de Bord

### Vue d'ensemble
Le tableau de bord est votre point d'entrée dans AlterValue. Il affiche une synthèse de tous vos dossiers clients et des indicateurs clés pour une prise de décision rapide.

### Comprendre les KPI

#### Missions Suivies
Nombre total de dossiers clients en suivi actif. Cliquez sur cette carte pour voir la liste complète.

#### Coût du Présentéisme
Estimation du coût annuel du présentéisme pour l'ensemble de vos dossiers. Ce chiffre est calculé selon la Méthode B (audit financier) et représente la perte de productivité liée à l'absentéisme et au présentéisme.

#### Alertes Actives
Nombre de signaux critiques nécessitant une action immédiate. Les alertes sont générées automatiquement lorsqu'un indicateur dépasse un seuil défini.

#### Conformité BNQ
Progression globale vers la certification BNQ 9700-800. Cette barre indique le pourcentage de conformité atteint.

### Interpréter les Signaux

Les "Signaux Prioritaires" affichent les problèmes identifiés dans vos dossiers :
- **Signal Vert** : Situation saine, pas d'action requise
- **Signal Orange** : Attention requise, à surveiller
- **Signal Rouge** : Critique, action immédiate recommandée

### Actions Recommandées

1. Consultez les signaux rouges en priorité
2. Cliquez sur une mission pour approfondir
3. Lancez une enquête si vous avez besoin de données terrain
4. Exportez un rapport pour présenter aux dirigeants

---

## 2. Gestion des Dossiers Clients

### Créer un Dossier

1. Cliquez sur "Nouveau dossier"
2. Remplissez les informations obligatoires :
   - **Nom de l'entreprise** : Nom officiel
   - **Secteur d'activité** : Choisissez dans la liste (détermine les benchmarks)
   - **Nombre de salariés** : Effectif total
   - **Salaire moyen annuel** : Salaire brut moyen

3. Complétez les informations optionnelles :
   - Taux de cotisations patronales (défaut : 45%)
   - Taux d'absentéisme actuel
   - Description et contact

4. Cliquez sur "Créer"

### Éditer les Informations

Cliquez sur "Éditer" sur la carte d'une entreprise pour modifier ses données. Les modifications s'appliquent immédiatement aux calculs.

### Comprendre les Indicateurs

Chaque carte d'entreprise affiche :

- **Taux d'Absentéisme** : % de jours d'absence par rapport aux jours travaillés
- **Coût du Présentéisme** : Estimation annuelle en euros
- **Secteur** : Catégorie d'activité (utilisée pour les benchmarks)

### Bonnes Pratiques

- Mettez à jour régulièrement le taux d'absentéisme pour des calculs précis
- Utilisez les noms officiels pour faciliter l'identification
- Groupez les dossiers par secteur pour comparer les performances

---

## 3. Calculateur de Présentéisme

### Comment ça Marche

Le calculateur estime le coût annuel du présentéisme selon la **Méthode B** (audit financier). Il utilise :

- **Effectif** : Nombre de salariés
- **Salaire moyen** : Coût de la main-d'œuvre
- **Taux d'absentéisme** : Jours d'absence observés
- **Coefficient présentéisme/absentéisme** : Ratio entre présentéisme et absentéisme (défaut : 1.3)
- **Coefficient perte de productivité** : % de productivité perdue (défaut : 0.33)

**Formule simplifiée :**
```
Coût = (Effectif × Salaire × Taux Absentéisme × Coefficient Présentéisme × Coefficient Productivité) / Jours Travaillés
```

### Interpréter les Résultats

- **Taux de Présentéisme** : % de jours travaillés en présentéisme
- **Jours de Présentéisme** : Nombre de jours estimés
- **Perte de Productivité** : Jours équivalents perdus
- **Coût du Présentéisme** : Montant total en euros
- **Coût par Salarié** : Coût moyen par personne
- **% de la Masse Salariale** : Impact relatif

### Utiliser les Benchmarks

Les benchmarks sectoriels sont des valeurs de référence pour votre industrie. Vous pouvez :
- Comparer votre situation aux autres entreprises du secteur
- Identifier les écarts significatifs
- Justifier les investissements en prévention

### Cas d'Usage

**Cas 1 : Diagnostic rapide**
- Utilisez le calculateur avec les données actuelles
- Présentez le coût du présentéisme aux dirigeants
- Justifiez le besoin d'une enquête approfondie

**Cas 2 : Scénario "avant/après"**
- Calculez le coût actuel
- Modifiez les paramètres (ex: réduire l'absentéisme de 2%)
- Montrez l'impact financier des actions

---

## 4. Enquêtes et Diagnostics Terrain

### Lancer une Enquête

1. Allez dans "Diagnostic Terrain" → "Campagnes"
2. Cliquez sur "Nouvelle campagne"
3. Sélectionnez le type d'enquête :
   - **Enquête Présentéisme** : Diagnostic rapide (5 min)
   - **Radar QVCT** : Diagnostic complet (10-15 min)
   - **Enquête RPS** : Risques psychosociaux (8 min)

4. Configurez les paramètres (voir section suivante)
5. Cliquez sur "Lancer"

### Configurer les Paramètres

#### Titre et Description
- **Titre** : Visible pour les répondants (ex: "Diagnostic Performance Humaine 2026")
- **Description** : Contexte et objectif (ex: "Nous cherchons à comprendre votre ressenti sur les conditions de travail")

#### Dates
- **Date de début** : Quand l'enquête devient accessible
- **Date de fin** : Deadline pour répondre
- **Rappels** : Automatiques à J-7, J-3, J-1

#### Objectif de Réponses
- **Population cible** : Nombre total de personnes visées
- **Nombre minimum de répondants** : Seuil de validité statistique
  - Recommandation : minimum 10-15 répondants
  - Pour une représentativité : 30% de la population cible

#### Distribution
- **Lien unique** : Chaque répondant reçoit un lien personnel
- **Lien partageable** : Un seul lien pour tous
- **Code QR** : À afficher en interne

### Suivre la Progression

Le tableau de bord de suivi affiche :
- Nombre de réponses reçues vs objectif
- Taux de complétion (%)
- Temps moyen de réponse
- Alertes si l'objectif n'est pas atteint

### Analyser les Résultats

Une fois l'enquête clôturée :

1. **Radar QVCT** : Vue synthétique des 4 sphères
   - Environnement de travail
   - Pratiques de gestion
   - Conciliation vie pro/perso
   - Habitudes de vie

2. **Graphiques détaillés** : Par question et par thématique

3. **Verbatims** : Réponses textuelles des répondants

4. **Export** : Rapport PDF ou fichier Excel pour présentation

---

## 5. Certification BNQ 9700-800

### Qu'est-ce que la Norme BNQ ?

La norme **BNQ 9700-800** (Entreprise en Santé) est un standard québécois de gestion de la santé et du bien-être en milieu de travail. Elle s'applique à toutes les organisations, quel que soit le secteur.

**Objectif** : Mettre en place des pratiques organisationnelles qui favorisent la santé physique et mentale des collaborateurs.

### Les 4 Sphères de la Norme

#### 1. Environnement de Travail
- Conditions physiques (bruit, lumière, température)
- Ergonomie et sécurité
- Accès aux ressources

#### 2. Pratiques de Gestion
- Leadership et communication
- Reconnaissance et équité
- Participation aux décisions

#### 3. Conciliation Vie Professionnelle / Personnelle
- Horaires flexibles
- Télétravail
- Congés et repos

#### 4. Habitudes de Vie
- Nutrition et activité physique
- Gestion du stress
- Prévention des addictions

### Étapes de Mise en Place

**Phase 1 : Diagnostic**
- Audit de l'existant
- Enquête auprès des collaborateurs
- Identification des écarts

**Phase 2 : Plan d'Actions**
- Priorisation des actions
- Définition des responsables
- Calendrier de mise en place

**Phase 3 : Mise en Œuvre**
- Exécution des actions
- Suivi et ajustements
- Communication interne

**Phase 4 : Évaluation**
- Mesure de l'impact
- Audit de conformité
- Certification (si applicable)

### Exigences par Niveau

La norme BNQ propose 3 niveaux d'engagement :

- **Niveau 1 (Es)** : Engagement de base
- **Niveau 2 (EsE)** : Engagement avancé
- **Niveau 3 (EsE+)** : Engagement complet avec certification

---

## 6. Administration

### Gestion des Utilisateurs

#### Ajouter un Expert

1. Allez dans "Administration" → "Gestion des Experts"
2. Cliquez sur "Ajouter un expert"
3. Remplissez :
   - Email
   - Nom complet
   - Rôle (Expert, Pilote QVCT, Observateur)
   - Dossiers assignés

4. Cliquez sur "Créer"

#### Modifier un Rôle

1. Trouvez l'utilisateur dans le tableau
2. Cliquez sur "Modifier"
3. Changez le rôle ou les dossiers assignés
4. Enregistrez

### Rôles et Permissions

#### Super-Admin
- Accès complet à la plateforme
- Gestion des utilisateurs
- Configuration globale
- Audit et traçabilité

#### Expert (Consultant)
- Accès à plusieurs dossiers clients
- Création et gestion d'enquêtes
- Accès aux résultats et analyses
- Pas d'accès à l'administration

#### Pilote QVCT (Client)
- Accès à son dossier uniquement
- Lancement d'enquêtes
- Consultation des résultats
- Pas de modification des paramètres

#### Observateur (Client)
- Accès en lecture seule
- Consultation des rapports
- Pas de création d'enquêtes
- Pas de modification

### Audit et Traçabilité

Le journal d'activité enregistre :
- Qui a fait quoi
- Quand (timestamp)
- Sur quelle ressource
- Quel changement

Utilisez-le pour :
- Vérifier les modifications
- Identifier les erreurs
- Assurer la conformité RGPD

---

## 7. Paramètres et Configuration

### Coefficients de Calcul

#### Coefficient Présentéisme/Absentéisme
- **Défaut** : 1.3
- **Signification** : Pour 1 jour d'absence, 1.3 jour de présentéisme
- **Ajustement** : Augmentez si le présentéisme est très élevé dans votre secteur

#### Coefficient Perte de Productivité
- **Défaut** : 0.33 (33%)
- **Signification** : Un salarié en présentéisme perd 33% de sa productivité
- **Ajustement** : Augmentez pour les métiers critiques (pilotes, chirurgiens, etc.)

#### Jours Travaillés par An
- **Défaut** : 220 jours
- **Calcul** : 365 jours - 52 weekends - 11 jours fériés - 25 jours congés

### Benchmarks Sectoriels

Les benchmarks sont des valeurs de référence par secteur. Vous pouvez :
- Consulter les valeurs actuelles
- Modifier les benchmarks pour votre contexte
- Ajouter de nouveaux secteurs

### Seuils d'Alerte

Définissez les seuils qui déclenchent les alertes :
- **Vert** : Situation saine (ex: < 5% d'absentéisme)
- **Orange** : Attention requise (ex: 5-10%)
- **Rouge** : Critique (ex: > 10%)

### Valeurs par Défaut

Vous pouvez réinitialiser tous les paramètres aux valeurs par défaut à tout moment. Cette action est irréversible.

---

## 8. Exports et Rapports

### Formats Disponibles

#### PDF
- Format prêt à présenter
- Mise en page professionnelle
- Graphiques intégrés
- Idéal pour les dirigeants

#### Excel
- Données brutes et calculées
- Graphiques modifiables
- Idéal pour l'analyse approfondie

#### CSV
- Format texte simple
- Compatible avec tous les outils
- Idéal pour l'intégration système

### Générer un Rapport

1. Allez dans "Exports & Rapports"
2. Sélectionnez :
   - **Format** : PDF, Excel ou CSV
   - **Période** : Dernier mois, trimestre, année ou personnalisée
   - **Données** : Cochez les sections à inclure

3. Cliquez sur "Générer le rapport"
4. Téléchargez le fichier

### Personnaliser l'Export

Vous pouvez inclure ou exclure :
- KPI et indicateurs clés
- Résultats d'enquêtes
- Conformité BNQ
- Historique des actions
- Benchmarks sectoriels

### Utiliser les Données

**Pour les dirigeants** :
- Exportez en PDF avec les KPI principaux
- Mettez l'accent sur le ROI et les coûts

**Pour les RH** :
- Exportez en Excel pour l'analyse détaillée
- Utilisez les données pour le plan d'actions

**Pour l'audit** :
- Exportez en CSV pour la traçabilité
- Conservez les fichiers pour la conformité

---

## 9. Glossaire

### Termes Métier

#### Absentéisme
Absence du travail pour raison de santé, congés ou autres motifs. Mesuré en jours ou en pourcentage.

#### Présentéisme
Présence physique au travail malgré une baisse de productivité due à des problèmes de santé ou personnels. C'est le coût caché majeur.

#### QVCT (Qualité de Vie et Conditions de Travail)
Ensemble des facteurs qui influencent le bien-être et la performance au travail.

#### Radar QVCT
Outil propriétaire AlterValue qui synthétise les 4 sphères de la norme BNQ en une visualisation unique.

#### Diagnostic Terrain
Enquête auprès des collaborateurs pour identifier les irritants et les leviers d'amélioration.

#### Méthode B
Audit financier du coût du présentéisme basé sur les données de l'entreprise.

#### Seuil d'Anonymisation
Nombre minimum de répondants pour garantir l'anonymat. Recommandation : 5-15 personnes selon le contexte.

#### Conformité BNQ
Respect des exigences de la norme BNQ 9700-800.

### Indicateurs Clés

#### Taux d'Absentéisme
Pourcentage de jours d'absence par rapport aux jours travaillés.
```
Taux = (Jours d'absence / Jours travaillés) × 100
```

#### Coût du Présentéisme
Estimation du coût annuel en euros.
```
Coût = Effectif × Salaire × Taux Absentéisme × Coefficient Présentéisme × Coefficient Productivité
```

#### Coût par Salarié
Coût moyen par personne.
```
Coût/Salarié = Coût Total / Effectif
```

#### % de la Masse Salariale
Impact relatif du présentéisme.
```
% = (Coût du Présentéisme / Masse Salariale) × 100
```

### Acronymes

- **BNQ** : Bureau de Normalisation du Québec
- **QVCT** : Qualité de Vie et Conditions de Travail
- **RPS** : Risques Psychosociaux
- **ROI** : Return on Investment (Retour sur Investissement)
- **RGPD** : Règlement Général sur la Protection des Données
- **KPI** : Key Performance Indicator (Indicateur Clé de Performance)
- **CSV** : Comma-Separated Values
- **PDF** : Portable Document Format

---

## 10. Interpréter les Résultats

### Lire le Radar QVCT

Le Radar QVCT affiche 4 axes correspondant aux sphères de la norme BNQ :

**Interprétation** :
- **Proche du centre** : Problème identifié, action requise
- **Proche de la périphérie** : Situation saine
- **Forme irrégulière** : Écarts importants entre sphères

### Identifier les Leviers

Les leviers sont les actions qui auront le plus d'impact sur la performance.

**Priorité 1 : Leviers critiques**
- Problèmes affectant la majorité des collaborateurs
- Impact financier élevé
- Faisabilité rapide

**Priorité 2 : Leviers importants**
- Problèmes affectant un groupe significatif
- Impact financier moyen
- Faisabilité moyenne

**Priorité 3 : Leviers secondaires**
- Problèmes affectant un petit groupe
- Impact financier faible
- Faisabilité variable

### Prioriser les Actions

Utilisez la matrice Impact/Effort pour prioriser vos actions.

### Mesurer l'Impact

Après la mise en place des actions :

1. **Relancez une enquête** (3-6 mois après)
2. **Comparez les résultats** avec le diagnostic initial
3. **Calculez le ROI** : (Gain - Investissement) / Investissement
4. **Ajustez les actions** selon les résultats

**Exemple** :
- Coût initial du présentéisme : 150 000€
- Investissement en actions : 20 000€
- Coût après 6 mois : 120 000€
- Gain : 30 000€
- ROI : (30 000 - 20 000) / 20 000 = 50%

---

## Besoin d'Aide ?

Si vous avez des questions :
1. Consultez cette documentation
2. Utilisez les tooltips (?) dans l'application
3. Contactez votre consultant AlterValue
4. Écrivez à contact@altervalue.fr

---

*Documentation AlterValue v4.1 - Mise à jour janvier 2026*
