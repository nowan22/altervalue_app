export interface ReportResult {
  presenteeismRate: number;
  presenteeismDays: number;
  productivityLoss: number;
  presenteeismCost: number;
  costPerEmployee: number;
  percentOfPayroll: number;
  signal: 'green' | 'orange' | 'red';
  trend: 'improving' | 'stable' | 'degrading';
}

export interface CompanyReportData {
  company: {
    name: string;
    sector: string;
    employees: number;
    averageSalary: number;
    absenteeismRate: number;
  };
  result: ReportResult;
  generatedAt: string;
}

export interface KpiHistoryReportData {
  company: {
    name: string;
    sector: string;
  };
  kpis: Array<{
    period: string;
    employees: number;
    absenteeismRate: number;
    presenteeismRate: number;
    presenteeismCost: number;
    signal: string;
  }>;
  generatedAt: string;
}

const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1f2937; 
      line-height: 1.6;
      padding: 40px;
    }
    .header { 
      background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
      color: white; 
      padding: 30px; 
      border-radius: 12px; 
      margin-bottom: 30px;
    }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .section { 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px; 
      padding: 24px; 
      margin-bottom: 20px; 
    }
    .section-title { 
      font-size: 18px; 
      font-weight: 600; 
      color: #374151; 
      margin-bottom: 16px; 
      padding-bottom: 8px; 
      border-bottom: 2px solid #3b82f6;
    }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .metric { 
      background: white; 
      padding: 16px; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb; 
    }
    .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: 700; color: #111827; }
    .metric-unit { font-size: 14px; color: #9ca3af; }
    .highlight { background: linear-gradient(135deg, #dbeafe, #ede9fe); border: none; }
    .highlight .metric-value { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    td { font-size: 14px; }
    .signal { 
      display: inline-block; 
      width: 12px; 
      height: 12px; 
      border-radius: 50%; 
      margin-right: 8px;
    }
    .signal-green { background: #22c55e; }
    .signal-orange { background: #f97316; }
    .signal-red { background: #ef4444; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      font-size: 12px; 
      color: #9ca3af; 
    }
    .formula { 
      background: #f3f4f6; 
      padding: 12px; 
      border-radius: 6px; 
      font-family: monospace; 
      font-size: 12px; 
      margin: 8px 0;
    }
  </style>
`;

export function generateCompanyReportHtml(data: CompanyReportData): string {
  const { company, result, generatedAt } = data;
  
  const getSignalClass = (color: string) => {
    switch (color) {
      case 'green': return 'signal-green';
      case 'orange': return 'signal-orange';
      case 'red': return 'signal-red';
      default: return '';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Présentéisme - ${company.name}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="header">
        <h1>📊 Rapport de Présentéisme</h1>
        <p>${company.name} • ${company.sector}</p>
      </div>

      <div class="section">
        <div class="section-title">Données de l'entreprise</div>
        <div class="grid">
          <div class="metric">
            <div class="metric-label">Effectif</div>
            <div class="metric-value">${company.employees} <span class="metric-unit">employés</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Salaire moyen brut</div>
            <div class="metric-value">${company.averageSalary.toLocaleString('fr-FR')} <span class="metric-unit">€/an</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Taux d'absentéisme</div>
            <div class="metric-value">${company.absenteeismRate.toFixed(2)} <span class="metric-unit">%</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Secteur</div>
            <div class="metric-value" style="font-size: 16px;">${company.sector}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Résultats du calcul (Méthode A - Ratios sectoriels)</div>
        <div class="grid">
          <div class="metric highlight">
            <div class="metric-label">Taux de présentéisme</div>
            <div class="metric-value">${result.presenteeismRate.toFixed(2)} <span class="metric-unit">%</span></div>
          </div>
          <div class="metric highlight">
            <div class="metric-label">Jours de présentéisme</div>
            <div class="metric-value">${result.presenteeismDays.toFixed(0)} <span class="metric-unit">jours</span></div>
          </div>
          <div class="metric highlight">
            <div class="metric-label">Perte de productivité</div>
            <div class="metric-value">${result.productivityLoss.toFixed(0)} <span class="metric-unit">jours eq.</span></div>
          </div>
          <div class="metric highlight">
            <div class="metric-label">Coût total estimé</div>
            <div class="metric-value">${result.presenteeismCost.toLocaleString('fr-FR')} <span class="metric-unit">€/an</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Indicateurs complémentaires</div>
        <div class="grid">
          <div class="metric">
            <div class="metric-label">Coût par employé</div>
            <div class="metric-value">${result.costPerEmployee.toLocaleString('fr-FR')} <span class="metric-unit">€/an</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">% de la masse salariale</div>
            <div class="metric-value">${result.percentOfPayroll.toFixed(2)} <span class="metric-unit">%</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Signal</div>
            <div class="metric-value" style="font-size: 16px;">
              <span class="signal ${getSignalClass(result.signal)}"></span>
              ${result.signal === 'green' ? 'Favorable' : result.signal === 'orange' ? 'Attention' : 'Critique'}
            </div>
          </div>
          <div class="metric">
            <div class="metric-label">Tendance</div>
            <div class="metric-value" style="font-size: 16px;">
              ${result.trend === 'improving' ? '📈 En amélioration' : result.trend === 'stable' ? '➡️ Stable' : '📉 En dégradation'}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Formules utilisées (Méthode A)</div>
        <div class="formula">1. Taux présentéisme = Taux absentéisme × Coefficient Prés/Abs</div>
        <div class="formula">2. Jours présentéisme = Taux × Effectif × Jours travaillés/an</div>
        <div class="formula">3. Perte productivité = Jours × Coefficient perte productivité</div>
        <div class="formula">4. Coût = Perte × (Salaire × (1 + Cotisations)) / Jours travaillés</div>
      </div>

      <div class="footer">
        <p>Rapport généré le ${generatedAt} • AlterValue v1.1</p>
        <p>Ce rapport utilise la Méthode A basée sur les ratios sectoriels</p>
      </div>
    </body>
    </html>
  `;
}

export function generateKpiHistoryReportHtml(data: KpiHistoryReportData): string {
  const { company, kpis, generatedAt } = data;
  
  const getSignalClass = (signal: string) => {
    switch (signal) {
      case 'green': return 'signal-green';
      case 'orange': return 'signal-orange';
      case 'red': return 'signal-red';
      default: return '';
    }
  };

  const totalCost = kpis.reduce((sum, k) => sum + k.presenteeismCost, 0);
  const avgAbsenteeism = kpis.reduce((sum, k) => sum + k.absenteeismRate, 0) / kpis.length;
  const avgPresenteeism = kpis.reduce((sum, k) => sum + k.presenteeismRate, 0) / kpis.length;

  const kpiRows = kpis.map(k => `
    <tr>
      <td>${k.period}</td>
      <td>${k.employees}</td>
      <td>${k.absenteeismRate.toFixed(2)}%</td>
      <td>${k.presenteeismRate.toFixed(2)}%</td>
      <td>${k.presenteeismCost.toLocaleString('fr-FR')} €</td>
      <td><span class="signal ${getSignalClass(k.signal)}"></span>${k.signal === 'green' ? 'Favorable' : k.signal === 'orange' ? 'Attention' : 'Critique'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Historique KPI - ${company.name}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="header">
        <h1>📈 Historique des KPI</h1>
        <p>${company.name} • ${company.sector}</p>
      </div>

      <div class="section">
        <div class="section-title">Synthèse</div>
        <div class="grid">
          <div class="metric highlight">
            <div class="metric-label">Périodes analysées</div>
            <div class="metric-value">${kpis.length} <span class="metric-unit">mois</span></div>
          </div>
          <div class="metric highlight">
            <div class="metric-label">Coût total cumulé</div>
            <div class="metric-value">${totalCost.toLocaleString('fr-FR')} <span class="metric-unit">€</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Absentéisme moyen</div>
            <div class="metric-value">${avgAbsenteeism.toFixed(2)} <span class="metric-unit">%</span></div>
          </div>
          <div class="metric">
            <div class="metric-label">Présentéisme moyen</div>
            <div class="metric-value">${avgPresenteeism.toFixed(2)} <span class="metric-unit">%</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Détail par période</div>
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Effectif</th>
              <th>Absentéisme</th>
              <th>Présentéisme</th>
              <th>Coût</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            ${kpiRows}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Rapport généré le ${generatedAt} • AlterValue v1.1</p>
        <p>Données historiques basées sur la Méthode A (Ratios sectoriels)</p>
      </div>
    </body>
    </html>
  `;
}
