import { NextResponse } from 'next/server';

// Documentation content embedded directly to avoid file system issues in production
const DOCUMENTATION_CONTENT = `# Documentation AlterValue - Aide Complète

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

---

## 2. Gestion des Dossiers Clients

### Créer un Dossier

1. Cliquez sur "Nouveau dossier"
2. Remplissez les informations obligatoires (nom, secteur, effectif, salaire moyen)
3. Complétez les informations optionnelles (taux cotisations, taux absentéisme)
4. Cliquez sur "Créer"

### Comprendre les Indicateurs

Chaque carte d'entreprise affiche :
- **Taux d'Absentéisme** : % de jours d'absence par rapport aux jours travaillés
- **Coût du Présentéisme** : Estimation annuelle en euros
- **Secteur** : Catégorie d'activité (utilisée pour les benchmarks)

---

## 3. Calculateur de Présentéisme

### Comment ça Marche

Le calculateur estime le coût annuel du présentéisme selon la **Méthode B** (audit financier). Il utilise :
- **Effectif** : Nombre de salariés
- **Salaire moyen** : Coût de la main-d'œuvre
- **Taux d'absentéisme** : Jours d'absence observés
- **Coefficient présentéisme/absentéisme** : Ratio entre présentéisme et absentéisme (défaut : 1.3)
- **Coefficient perte de productivité** : % de productivité perdue (défaut : 0.33)

### Interpréter les Résultats

- **Taux de Présentéisme** : % de jours travaillés en présentéisme
- **Coût du Présentéisme** : Montant total en euros
- **Coût par Salarié** : Coût moyen par personne
- **% de la Masse Salariale** : Impact relatif

---

## 4. Enquêtes et Diagnostics Terrain

### Lancer une Enquête

1. Allez dans "Diagnostic Terrain" → "Campagnes"
2. Cliquez sur "Nouvelle campagne"
3. Sélectionnez le type d'enquête
4. Configurez les paramètres (dates, objectif de réponses)
5. Cliquez sur "Lancer"

### Configurer les Paramètres

- **Titre** : Visible pour les répondants
- **Description** : Contexte et objectif
- **Date de début/fin** : Période de collecte
- **Objectif de réponses** : Minimum requis pour validité statistique

### Analyser les Résultats

Une fois l'enquête clôturée :
1. **Radar QVCT** : Vue synthétique des 4 sphères
2. **Graphiques détaillés** : Par question et par thématique
3. **Export** : Rapport PDF ou fichier Excel

---

## 5. Certification BNQ 9700-800

### Qu'est-ce que la Norme BNQ ?

La norme **BNQ 9700-800** (Entreprise en Santé) est un standard québécois de gestion de la santé et du bien-être en milieu de travail.

### Les 4 Sphères de la Norme

1. **Environnement de Travail** : Conditions physiques, ergonomie, sécurité
2. **Pratiques de Gestion** : Leadership, reconnaissance, équité
3. **Conciliation Vie Pro/Perso** : Horaires flexibles, télétravail
4. **Habitudes de Vie** : Nutrition, activité physique, gestion du stress

### Niveaux de Certification

- **Niveau ES** : Engagement de base
- **Niveau ESE** : Engagement avancé
- **Niveau ESE+** : Engagement complet avec certification

---

## 6. Administration

### Rôles et Permissions

- **Super-Admin** : Accès complet à la plateforme
- **Expert** : Gestion de plusieurs dossiers clients
- **Pilote QVCT** : Accès à son dossier uniquement
- **Observateur** : Lecture seule

---

## 7. Paramètres et Configuration

### Coefficients de Calcul

- **Coefficient Présentéisme/Absentéisme** : Défaut 1.3
- **Coefficient Perte de Productivité** : Défaut 0.33 (33%)
- **Jours Travaillés par An** : Défaut 220 jours

---

## 8. Exports et Rapports

### Formats Disponibles

- **PDF** : Format prêt à présenter
- **Excel** : Données brutes et calculées
- **CSV** : Format texte simple

---

## 9. Glossaire

- **Absentéisme** : Absence du travail pour raison de santé ou autres motifs
- **Présentéisme** : Présence physique malgré une baisse de productivité
- **QVCT** : Qualité de Vie et Conditions de Travail
- **BNQ** : Bureau de Normalisation du Québec
- **ROI** : Return on Investment

---

## Besoin d'Aide ?

1. Consultez cette documentation
2. Utilisez les tooltips (?) dans l'application
3. Contactez : contact@altervalue.fr

---

*Documentation AlterValue v4.1 - Janvier 2026*
`;

export async function GET() {
  return new NextResponse(DOCUMENTATION_CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
