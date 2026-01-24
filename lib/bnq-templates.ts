// BNQ Document Templates for generation

export interface BnqCompanyData {
  name: string;
  address?: string;
  siret?: string;
  sector: string;
  employeesCount: number;
  directorName?: string;
  directorTitle?: string;
  representativeName?: string;
  representativeEmail?: string;
  committeeMemberCount?: number;
  committeeMembers?: Array<{ name: string; role: string; department?: string }>;
}

const baseDocStyles = `
  <style>
    @page { margin: 2cm; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1f2937; 
      line-height: 1.6;
      padding: 40px;
      font-size: 12pt;
    }
    .doc-header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .doc-header h1 {
      font-size: 24pt;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .doc-header .subtitle {
      font-size: 14pt;
      color: #6b7280;
    }
    .doc-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 10pt;
      color: #6b7280;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      font-size: 14pt;
      color: #1e40af;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
      margin-bottom: 15px;
    }
    .section h3 {
      font-size: 12pt;
      color: #374151;
      margin-bottom: 10px;
      margin-top: 15px;
    }
    .section p, .section ul, .section ol {
      margin-bottom: 10px;
    }
    .section ul, .section ol {
      margin-left: 25px;
    }
    .section li {
      margin-bottom: 5px;
    }
    .highlight-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .signature-block {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-line {
      display: inline-block;
      width: 45%;
      margin-right: 5%;
      margin-top: 30px;
    }
    .signature-line p {
      border-top: 1px solid #374151;
      padding-top: 8px;
      margin-top: 60px;
    }
    .bnq-badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10pt;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .placeholder {
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 4px;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #9ca3af;
      text-align: center;
    }
  </style>
`;

function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Template 1: Note d'intention / Lettre d'engagement
export function generateNoteIntention(company: BnqCompanyData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Note d'intention - ${company.name}</title>
      ${baseDocStyles}
    </head>
    <body>
      <div class="doc-header">
        <span class="bnq-badge">BNQ 9700-800 • Art. 5.1</span>
        <h1>Note d'intention</h1>
        <p class="subtitle">Engagement de la direction envers la démarche santé et mieux-être</p>
      </div>

      <div class="doc-meta">
        <div><strong>Entreprise :</strong> ${company.name}</div>
        <div><strong>Date :</strong> ${formatDate()}</div>
      </div>

      <div class="section">
        <h2>1. Préambule</h2>
        <p>La direction de <strong>${company.name}</strong>, consciente de l'importance du capital humain et de son impact sur la performance organisationnelle, s'engage officiellement dans une démarche structurée de santé et mieux-être au travail conforme à la norme BNQ 9700-800.</p>
      </div>

      <div class="section">
        <h2>2. Engagement de la direction</h2>
        <p>Par la présente, la direction s'engage à :</p>
        <ul>
          <li>Faire de la santé et du mieux-être au travail une priorité stratégique de l'organisation</li>
          <li>Allouer les ressources humaines, financières et matérielles nécessaires à la mise en œuvre de la démarche</li>
          <li>Nommer un représentant de la direction responsable de la démarche</li>
          <li>Mettre en place un comité santé et mieux-être représentatif</li>
          <li>Communiquer régulièrement sur les avancées et résultats de la démarche</li>
          <li>Viser l'obtention de la certification BNQ 9700-800 niveau <span class="placeholder">[Es / EsE / EsE+]</span></li>
        </ul>
      </div>

      <div class="section">
        <h2>3. Objectifs visés</h2>
        <div class="highlight-box">
          <p>Les principaux objectifs de notre démarche sont :</p>
          <ol>
            <li>Réduire le taux d'absentéisme de <span class="placeholder">[X]</span>% sur <span class="placeholder">[X]</span> ans</li>
            <li>Diminuer les coûts liés au présentéisme estimés à <span class="placeholder">[X]</span> €</li>
            <li>Améliorer l'engagement et la satisfaction des employés</li>
            <li>Créer un environnement de travail favorable à la santé globale</li>
            <li>Renforcer l'attractivité de l'entreprise en tant qu'employeur</li>
          </ol>
        </div>
      </div>

      <div class="section">
        <h2>4. Moyens alloués</h2>
        <p>Pour atteindre ces objectifs, l'organisation s'engage à :</p>
        <ul>
          <li>Dédier un budget annuel de <span class="placeholder">[X]</span> € aux initiatives de santé et mieux-être</li>
          <li>Libérer <span class="placeholder">[X]</span> heures/an pour les activités du comité</li>
          <li>Former les gestionnaires aux pratiques de gestion favorables à la santé</li>
          <li>Faire appel à des ressources externes spécialisées si nécessaire</li>
        </ul>
      </div>

      <div class="section">
        <h2>5. Représentant de la direction</h2>
        <p>Est désigné comme représentant de la direction pour la démarche santé et mieux-être :</p>
        <div class="highlight-box">
          <p><strong>Nom :</strong> ${company.representativeName || '<span class="placeholder">[À compléter]</span>'}</p>
          <p><strong>Fonction :</strong> <span class="placeholder">[À compléter]</span></p>
          <p><strong>Courriel :</strong> ${company.representativeEmail || '<span class="placeholder">[À compléter]</span>'}</p>
        </div>
      </div>

      <div class="signature-block">
        <h2>6. Signatures</h2>
        <p>La présente note d'intention est signée ce jour pour engagement.</p>
        <div class="signature-line">
          <p><strong>${company.directorName || '<span class="placeholder">[Nom du dirigeant]</span>'}</strong><br/>
          ${company.directorTitle || 'Directeur général'}<br/>
          ${company.name}</p>
        </div>
        <div class="signature-line">
          <p><strong>${company.representativeName || '<span class="placeholder">[Nom du représentant]</span>'}</strong><br/>
          Représentant de la direction<br/>
          Démarche santé et mieux-être</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré via AlterValue • Modèle conforme BNQ 9700-800 • ${formatDate()}</p>
      </div>
    </body>
    </html>
  `;
}

// Template 2: Politique santé mieux-être
export function generatePolitiqueSME(company: BnqCompanyData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Politique Santé et Mieux-Être - ${company.name}</title>
      ${baseDocStyles}
    </head>
    <body>
      <div class="doc-header">
        <span class="bnq-badge">BNQ 9700-800 • Art. 5.2</span>
        <h1>Politique santé et mieux-être</h1>
        <p class="subtitle">${company.name}</p>
      </div>

      <div class="doc-meta">
        <div><strong>Version :</strong> 1.0</div>
        <div><strong>Date d'approbation :</strong> ${formatDate()}</div>
        <div><strong>Prochaine révision :</strong> <span class="placeholder">[Date + 3 ans]</span></div>
      </div>

      <div class="section">
        <h2>1. Objet et champ d'application</h2>
        <p>La présente politique définit les principes directeurs et les engagements de <strong>${company.name}</strong> en matière de santé et de mieux-être au travail. Elle s'applique à l'ensemble des ${company.employeesCount} employés de l'organisation, quel que soit leur statut ou leur lieu de travail.</p>
      </div>

      <div class="section">
        <h2>2. Déclaration d'engagement</h2>
        <div class="highlight-box">
          <p><strong>${company.name}</strong> reconnaît que la santé et le mieux-être de ses employés constituent un facteur clé de réussite et s'engage à créer et maintenir un milieu de travail favorable à la santé globale, en agissant sur les quatre sphères d'activité suivantes :</p>
          <ul>
            <li><strong>Habitudes de vie</strong> - Activité physique, alimentation, sommeil, gestion du stress</li>
            <li><strong>Équilibre travail-vie personnelle</strong> - Flexibilité, soutien familial, déconnexion</li>
            <li><strong>Environnement de travail</strong> - Ergonomie, sécurité, qualité de l'air, espaces</li>
            <li><strong>Pratiques de gestion</strong> - Leadership, reconnaissance, communication, développement</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>3. Principes directeurs</h2>
        <h3>3.1 Respect et confidentialité</h3>
        <p>Toute information personnelle relative à la santé des employés est traitée de manière strictement confidentielle, dans le respect du RGPD et des droits individuels.</p>
        
        <h3>3.2 Participation volontaire</h3>
        <p>La participation aux programmes et activités de santé et mieux-être est volontaire. Aucune discrimination ne sera exercée envers les employés qui choisissent de ne pas y participer.</p>
        
        <h3>3.3 Approche intégrée</h3>
        <p>La santé et le mieux-être sont intégrés dans l'ensemble des pratiques de gestion et des processus organisationnels.</p>
        
        <h3>3.4 Amélioration continue</h3>
        <p>La démarche fait l'objet d'une évaluation régulière et d'ajustements basés sur les données probantes et les meilleures pratiques.</p>
      </div>

      <div class="section">
        <h2>4. Responsabilités</h2>
        <table>
          <tr>
            <th>Acteur</th>
            <th>Responsabilités</th>
          </tr>
          <tr>
            <td><strong>Direction</strong></td>
            <td>Approuver la politique, allouer les ressources, promouvoir la démarche</td>
          </tr>
          <tr>
            <td><strong>Comité SME</strong></td>
            <td>Planifier, coordonner et évaluer les activités, faire des recommandations</td>
          </tr>
          <tr>
            <td><strong>Gestionnaires</strong></td>
            <td>Appliquer les pratiques de gestion favorables, soutenir les employés</td>
          </tr>
          <tr>
            <td><strong>Employés</strong></td>
            <td>Participer aux activités, adopter des comportements favorables à la santé</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>5. Mise en œuvre</h2>
        <p>La mise en œuvre de cette politique s'appuie sur :</p>
        <ul>
          <li>Un plan d'action annuel avec des objectifs mesurables</li>
          <li>Un budget dédié aux initiatives de santé et mieux-être</li>
          <li>Une collecte régulière de données pour évaluer les besoins et mesurer les progrès</li>
          <li>Une communication continue auprès de l'ensemble du personnel</li>
        </ul>
      </div>

      <div class="section">
        <h2>6. Révision</h2>
        <p>Cette politique sera révisée au minimum tous les trois (3) ans ou plus fréquemment si des changements significatifs l'exigent.</p>
      </div>

      <div class="signature-block">
        <h2>7. Approbation</h2>
        <div class="signature-line">
          <p><strong>${company.directorName || '<span class="placeholder">[Nom du dirigeant]</span>'}</strong><br/>
          ${company.directorTitle || 'Directeur général'}</p>
        </div>
        <div class="signature-line">
          <p><strong>Comité santé et mieux-être</strong><br/>
          Représenté par : <span class="placeholder">[Nom]</span></p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré via AlterValue • Modèle conforme BNQ 9700-800 • ${formatDate()}</p>
      </div>
    </body>
    </html>
  `;
}

// Template 3: Mandat du comité
export function generateMandatComite(company: BnqCompanyData): string {
  const members = company.committeeMembers || [
    { name: '<span class="placeholder">[Membre 1]</span>', role: 'Président(e)', department: '<span class="placeholder">[Service]</span>' },
    { name: '<span class="placeholder">[Membre 2]</span>', role: 'Secrétaire', department: '<span class="placeholder">[Service]</span>' },
    { name: '<span class="placeholder">[Membre 3]</span>', role: 'Membre', department: '<span class="placeholder">[Service]</span>' },
    { name: '<span class="placeholder">[Membre 4]</span>', role: 'Membre', department: '<span class="placeholder">[Service]</span>' },
  ];

  const membersRows = members.map(m => `
    <tr>
      <td>${m.name}</td>
      <td>${m.role}</td>
      <td>${m.department || '-'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Mandat du Comité SME - ${company.name}</title>
      ${baseDocStyles}
    </head>
    <body>
      <div class="doc-header">
        <span class="bnq-badge">BNQ 9700-800 • Art. 6.2</span>
        <h1>Mandat du comité santé et mieux-être</h1>
        <p class="subtitle">${company.name}</p>
      </div>

      <div class="doc-meta">
        <div><strong>Date de création :</strong> ${formatDate()}</div>
        <div><strong>Prochaine révision :</strong> <span class="placeholder">[Date + 3 ans]</span></div>
      </div>

      <div class="section">
        <h2>1. Mission</h2>
        <p>Le comité santé et mieux-être (CSME) a pour mission de planifier, coordonner et évaluer les activités visant à promouvoir et améliorer la santé et le mieux-être de l'ensemble du personnel de <strong>${company.name}</strong>.</p>
      </div>

      <div class="section">
        <h2>2. Composition</h2>
        <p>Le comité est composé d'au minimum quatre (4) membres représentant différents niveaux hiérarchiques et services de l'organisation :</p>
        <table>
          <tr>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Département</th>
          </tr>
          ${membersRows}
        </table>
        <p style="margin-top: 10px;"><em>Le représentant de la direction désigné participe aux réunions du comité.</em></p>
      </div>

      <div class="section">
        <h2>3. Responsabilités du comité</h2>
        <ul>
          <li>Élaborer le plan d'action annuel en santé et mieux-être</li>
          <li>Identifier les besoins du personnel via des collectes de données</li>
          <li>Proposer des interventions dans les quatre sphères d'activité</li>
          <li>Coordonner la mise en œuvre des activités et programmes</li>
          <li>Évaluer l'efficacité des interventions et ajuster au besoin</li>
          <li>Assurer la communication avec l'ensemble du personnel</li>
          <li>Préparer le rapport annuel de la démarche</li>
          <li>Conseiller la direction sur les enjeux de santé et mieux-être</li>
        </ul>
      </div>

      <div class="section">
        <h2>4. Fonctionnement</h2>
        <h3>4.1 Réunions</h3>
        <ul>
          <li>Fréquence : minimum <strong>4 réunions par année</strong> (trimestrielles)</li>
          <li>Durée : environ 1h30 à 2h</li>
          <li>Quorum : majorité des membres (50% + 1)</li>
        </ul>
        
        <h3>4.2 Procès-verbaux</h3>
        <p>Un compte-rendu est rédigé après chaque réunion et conservé pour documentation.</p>
        
        <h3>4.3 Prise de décision</h3>
        <p>Les décisions sont prises par consensus ou, à défaut, par vote à la majorité simple.</p>
      </div>

      <div class="section">
        <h2>5. Ressources</h2>
        <div class="highlight-box">
          <p>L'organisation s'engage à :</p>
          <ul>
            <li>Libérer les membres pour les réunions et activités du comité</li>
            <li>Mettre à disposition un budget de <span class="placeholder">[X]</span> € pour les initiatives</li>
            <li>Fournir l'accès aux données nécessaires (dans le respect de la confidentialité)</li>
            <li>Offrir la formation requise aux membres du comité</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <h2>6. Indicateurs de suivi</h2>
        <ul>
          <li>Nombre de réunions tenues par année</li>
          <li>Nombre d'activités organisées</li>
          <li>Taux de participation aux activités</li>
          <li>Taux de satisfaction des employés</li>
          <li>Évolution des indicateurs de santé (absentéisme, présentéisme)</li>
        </ul>
      </div>

      <div class="signature-block">
        <h2>7. Approbation</h2>
        <div class="signature-line">
          <p><strong>${company.directorName || '<span class="placeholder">[Direction]</span>'}</strong><br/>
          Pour la direction</p>
        </div>
        <div class="signature-line">
          <p><strong><span class="placeholder">[Président(e) du comité]</span></strong><br/>
          Pour le comité SME</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré via AlterValue • Modèle conforme BNQ 9700-800 • ${formatDate()}</p>
      </div>
    </body>
    </html>
  `;
}

// Template 4: Mesures de confidentialité
export function generateMesuresConfidentialite(company: BnqCompanyData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Mesures de Confidentialité - ${company.name}</title>
      ${baseDocStyles}
    </head>
    <body>
      <div class="doc-header">
        <span class="bnq-badge">BNQ 9700-800 • Art. 7.2</span>
        <h1>Mesures de confidentialité</h1>
        <p class="subtitle">Protection des données personnelles - ${company.name}</p>
      </div>

      <div class="doc-meta">
        <div><strong>Version :</strong> 1.0</div>
        <div><strong>Date :</strong> ${formatDate()}</div>
      </div>

      <div class="section">
        <h2>1. Objet</h2>
        <p>Ce document définit les mesures de confidentialité mises en place par <strong>${company.name}</strong> pour protéger les données personnelles collectées dans le cadre de la démarche santé et mieux-être, conformément au RGPD et à la norme BNQ 9700-800.</p>
      </div>

      <div class="section">
        <h2>2. Types de données collectées</h2>
        <table>
          <tr>
            <th>Catégorie</th>
            <th>Exemples</th>
            <th>Sensibilité</th>
          </tr>
          <tr>
            <td>Données d'identification</td>
            <td>Nom, service, ancienneté</td>
            <td>Standard</td>
          </tr>
          <tr>
            <td>Données de participation</td>
            <td>Présence aux activités, choix de programmes</td>
            <td>Standard</td>
          </tr>
          <tr>
            <td>Données de santé</td>
            <td>Réponses aux questionnaires santé (agrégées)</td>
            <td>Sensible</td>
          </tr>
          <tr>
            <td>Données RH</td>
            <td>Absentéisme, accidents du travail (statistiques)</td>
            <td>Confidentiel</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>3. Principes de protection</h2>
        <div class="highlight-box">
          <h3>3.1 Minimisation des données</h3>
          <p>Seules les données strictement nécessaires à la démarche sont collectées.</p>
          
          <h3>3.2 Anonymisation et agrégation</h3>
          <p>Les données individuelles sont anonymisées avant analyse. Les résultats sont présentés uniquement sous forme agrégée (minimum 10 répondants par groupe).</p>
          
          <h3>3.3 Consentement éclairé</h3>
          <p>Toute collecte de données fait l'objet d'un consentement préalable explicite.</p>
          
          <h3>3.4 Limitation de la conservation</h3>
          <p>Les données sont conservées pour la durée strictement nécessaire et supprimées ensuite.</p>
        </div>
      </div>

      <div class="section">
        <h2>4. Mesures de sécurité</h2>
        <ul>
          <li><strong>Accès restreint :</strong> Seules les personnes autorisées ont accès aux données</li>
          <li><strong>Authentification :</strong> Accès protégé par identifiant et mot de passe sécurisé</li>
          <li><strong>Chiffrement :</strong> Les données sensibles sont chiffrées au repos et en transit</li>
          <li><strong>Traçabilité :</strong> Les accès aux données sont journalisés</li>
          <li><strong>Sauvegarde :</strong> Les données sont sauvegardées régulièrement</li>
          <li><strong>Suppression sécurisée :</strong> Les données obsolètes sont supprimées de manière irréversible</li>
        </ul>
      </div>

      <div class="section">
        <h2>5. Droits des personnes</h2>
        <p>Conformément au RGPD, chaque employé dispose des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès :</strong> Consulter les données le concernant</li>
          <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> Demander la suppression de ses données</li>
          <li><strong>Droit d'opposition :</strong> Refuser la collecte ou le traitement</li>
          <li><strong>Droit à la portabilité :</strong> Récupérer ses données dans un format structuré</li>
        </ul>
        <p style="margin-top: 10px;">Pour exercer ces droits : <span class="placeholder">[Contact DPO ou RH]</span></p>
      </div>

      <div class="section">
        <h2>6. Responsabilités</h2>
        <table>
          <tr>
            <th>Rôle</th>
            <th>Responsabilités</th>
          </tr>
          <tr>
            <td>DPO / Responsable RGPD</td>
            <td>Veiller au respect du RGPD, traiter les demandes d'exercice des droits</td>
          </tr>
          <tr>
            <td>Comité SME</td>
            <td>S'assurer de l'anonymisation des données utilisées</td>
          </tr>
          <tr>
            <td>Prestataires externes</td>
            <td>Respect des clauses de confidentialité contractuelles</td>
          </tr>
        </table>
      </div>

      <div class="signature-block">
        <h2>7. Approbation</h2>
        <div class="signature-line">
          <p><strong>${company.directorName || '<span class="placeholder">[Direction]</span>'}</strong><br/>
          Direction générale</p>
        </div>
        <div class="signature-line">
          <p><strong><span class="placeholder">[DPO]</span></strong><br/>
          Délégué à la protection des données</p>
        </div>
      </div>

      <div class="footer">
        <p>Document généré via AlterValue • Modèle conforme BNQ 9700-800 & RGPD • ${formatDate()}</p>
      </div>
    </body>
    </html>
  `;
}

// Template 5: Formulaire de consentement
export function generateFormulaireConsentement(company: BnqCompanyData): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Formulaire de Consentement - ${company.name}</title>
      ${baseDocStyles}
    </head>
    <body>
      <div class="doc-header">
        <span class="bnq-badge">BNQ 9700-800 • Art. 7.2</span>
        <h1>Formulaire de consentement</h1>
        <p class="subtitle">Collecte de données - Démarche santé et mieux-être</p>
      </div>

      <div class="doc-meta">
        <div><strong>Entreprise :</strong> ${company.name}</div>
        <div><strong>Date :</strong> ____________________</div>
      </div>

      <div class="section">
        <h2>Informations sur la collecte</h2>
        <table>
          <tr>
            <td><strong>Responsable du traitement :</strong></td>
            <td>${company.name}</td>
          </tr>
          <tr>
            <td><strong>Finalité :</strong></td>
            <td>Améliorer la santé et le mieux-être au travail dans le cadre de la démarche BNQ 9700-800</td>
          </tr>
          <tr>
            <td><strong>Type de collecte :</strong></td>
            <td><span class="placeholder">[Questionnaire santé / Enquête satisfaction / Évaluation des risques]</span></td>
          </tr>
          <tr>
            <td><strong>Durée de conservation :</strong></td>
            <td><span class="placeholder">[X]</span> ans après la fin de la collecte</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Données collectées</h2>
        <div class="highlight-box">
          <p>Dans le cadre de cette collecte, les informations suivantes seront recueillies :</p>
          <ul>
            <li>Informations démographiques anonymisées (tranche d'âge, ancienneté, service)</li>
            <li>Réponses aux questions relatives à <span class="placeholder">[thème de l'enquête]</span></li>
            <li>Commentaires libres (optionnels)</li>
          </ul>
          <p><em>Aucune donnée permettant l'identification directe n'est collectée.</em></p>
        </div>
      </div>

      <div class="section">
        <h2>Utilisation des données</h2>
        <p>Les données collectées seront utilisées exclusivement pour :</p>
        <ul>
          <li>Établir un portrait de la situation en santé et mieux-être</li>
          <li>Identifier les besoins prioritaires du personnel</li>
          <li>Planifier des interventions adaptées</li>
          <li>Mesurer l'évolution des indicateurs dans le temps</li>
        </ul>
        <p><strong>Les résultats seront présentés uniquement sous forme agrégée</strong> (aucune donnée individuelle ne sera communiquée).</p>
      </div>

      <div class="section">
        <h2>Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données. Vous pouvez les exercer en contactant : <span class="placeholder">[Contact]</span></p>
        <p>La participation est <strong>entièrement volontaire</strong>. Le refus de participer n'entraîne aucune conséquence sur votre emploi.</p>
      </div>

      <div class="section" style="border: 2px solid #3b82f6; padding: 20px; border-radius: 8px;">
        <h2>Consentement</h2>
        <p>Je, soussigné(e), déclare :</p>
        <p style="margin: 15px 0;">
          ☐ Avoir pris connaissance des informations ci-dessus<br/>
          ☐ Comprendre l'objectif et l'utilisation des données collectées<br/>
          ☐ Accepter de participer volontairement à cette collecte<br/>
          ☐ Consentir au traitement de mes données dans les conditions décrites
        </p>
        
        <div style="margin-top: 30px;">
          <p><strong>Nom et prénom :</strong> ________________________________________</p>
          <p style="margin-top: 15px;"><strong>Date :</strong> ____________________</p>
          <p style="margin-top: 15px;"><strong>Signature :</strong></p>
          <div style="height: 60px; border-bottom: 1px solid #374151; width: 50%; margin-top: 40px;"></div>
        </div>
      </div>

      <div class="footer">
        <p>Document généré via AlterValue • Modèle conforme BNQ 9700-800 & RGPD • ${formatDate()}</p>
        <p>Ce formulaire doit être conservé pendant toute la durée de la démarche</p>
      </div>
    </body>
    </html>
  `;
}

// Map template codes to generator functions
export const TEMPLATE_GENERATORS: Record<string, (company: BnqCompanyData) => string> = {
  'NOTE_INTENTION': generateNoteIntention,
  'POLITIQUE_SME': generatePolitiqueSME,
  'MANDAT_COMITE': generateMandatComite,
  'MESURES_CONFIDENTIALITE': generateMesuresConfidentialite,
  'CONSENTEMENT_COLLECTE': generateFormulaireConsentement,
};

export const AVAILABLE_TEMPLATES = [
  { code: 'NOTE_INTENTION', name: "Note d'intention / Lettre d'engagement", article: 'Art. 5.1' },
  { code: 'POLITIQUE_SME', name: 'Politique santé et mieux-être', article: 'Art. 5.2' },
  { code: 'MANDAT_COMITE', name: 'Mandat du comité SME', article: 'Art. 6.2' },
  { code: 'MESURES_CONFIDENTIALITE', name: 'Mesures de confidentialité', article: 'Art. 7.2' },
  { code: 'CONSENTEMENT_COLLECTE', name: 'Formulaire de consentement', article: 'Art. 7.2' },
];
