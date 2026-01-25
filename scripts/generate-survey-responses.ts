/**
 * Script de génération de réponses de test pour les enquêtes présentéisme
 * 
 * Usage: npx tsx --require dotenv/config scripts/generate-survey-responses.ts <surveyId> [nombreReponses]
 * 
 * Paramètres:
 *   - surveyId: ID de l'enquête cible (requis)
 *   - nombreReponses: Nombre de réponses à générer (optionnel, défaut: 50)
 * 
 * Exemple:
 *   npx tsx --require dotenv/config scripts/generate-survey-responses.ts clm123abc456 100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types for responses
type FrequencyLevel = 'NEVER' | 'OCCASIONALLY' | 'REGULARLY' | 'VERY_FREQUENTLY';
type ContributingFactor = 'FATIGUE' | 'STRESS' | 'PAIN' | 'CONCENTRATION' | 'OTHER';
type WorkImpact = 'QUALITY' | 'DELAYS' | 'COLLEAGUES' | 'ERRORS';
type WorkingHours = '<35' | '35-39' | '40-44' | '45-49' | '>=50';

// Choix aléatoire pondéré
function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) {
      return option.value;
    }
  }
  
  return options[options.length - 1].value;
}

// Map efficiency mean to actual percentage value (100, 90, 80, 70, 60, 50)
function getEfficiencyValue(frequency: FrequencyLevel): number {
  switch (frequency) {
    case 'NEVER':
      return weightedRandom([
        { value: 100, weight: 70 },
        { value: 90, weight: 30 },
      ]);
    case 'OCCASIONALLY':
      return weightedRandom([
        { value: 90, weight: 30 },
        { value: 80, weight: 40 },
        { value: 70, weight: 20 },
        { value: 60, weight: 10 },
      ]);
    case 'REGULARLY':
      return weightedRandom([
        { value: 80, weight: 15 },
        { value: 70, weight: 35 },
        { value: 60, weight: 35 },
        { value: 50, weight: 15 },
      ]);
    case 'VERY_FREQUENTLY':
      return weightedRandom([
        { value: 70, weight: 10 },
        { value: 60, weight: 30 },
        { value: 50, weight: 60 },
      ]);
  }
}

// Générer une réponse réaliste
function generateResponse(surveyId: string) {
  // Q1: Fréquence du présentéisme (distribution réaliste)
  const q1Prevalence = weightedRandom<FrequencyLevel>([
    { value: 'NEVER', weight: 30 },        // 30% jamais
    { value: 'OCCASIONALLY', weight: 35 }, // 35% occasionnellement
    { value: 'REGULARLY', weight: 25 },    // 25% régulièrement
    { value: 'VERY_FREQUENTLY', weight: 10 }, // 10% très fréquemment
  ]);

  // Q2: Score d'efficacité (valeurs fixes: 100, 90, 80, 70, 60, 50)
  const q2EfficiencyPercent = getEfficiencyValue(q1Prevalence);

  // Q3: Facteurs contribuants (peuvent être multiples)
  const factors: ContributingFactor[] = [];
  if (q1Prevalence !== 'NEVER') {
    // Facteurs avec probabilités réalistes
    const factorProbs: { factor: ContributingFactor; prob: number }[] = [
      { factor: 'FATIGUE', prob: 0.45 },
      { factor: 'STRESS', prob: 0.55 },
      { factor: 'PAIN', prob: 0.25 },
      { factor: 'CONCENTRATION', prob: 0.35 },
      { factor: 'OTHER', prob: 0.10 },
    ];

    for (const { factor, prob } of factorProbs) {
      if (Math.random() < prob) {
        factors.push(factor);
      }
    }

    // Au moins un facteur si présentéisme déclaré
    if (factors.length === 0) {
      factors.push(weightedRandom([
        { value: 'FATIGUE' as ContributingFactor, weight: 3 },
        { value: 'STRESS' as ContributingFactor, weight: 4 },
        { value: 'PAIN' as ContributingFactor, weight: 1 },
        { value: 'CONCENTRATION' as ContributingFactor, weight: 2 },
      ]));
    }
  }

  // Q4: Impacts sur le travail (peuvent être multiples)
  const impacts: WorkImpact[] = [];
  if (q1Prevalence !== 'NEVER' && q2EfficiencyPercent < 90) {
    const impactProbs: { impact: WorkImpact; prob: number }[] = [
      { impact: 'QUALITY', prob: 0.40 },
      { impact: 'DELAYS', prob: 0.35 },
      { impact: 'COLLEAGUES', prob: 0.25 },
      { impact: 'ERRORS', prob: 0.30 },
    ];

    for (const { impact, prob } of impactProbs) {
      if (Math.random() < prob) {
        impacts.push(impact);
      }
    }

    // Au moins un impact si efficacité < 80%
    if (impacts.length === 0 && q2EfficiencyPercent < 80) {
      impacts.push(weightedRandom([
        { value: 'QUALITY' as WorkImpact, weight: 3 },
        { value: 'DELAYS' as WorkImpact, weight: 2 },
        { value: 'ERRORS' as WorkImpact, weight: 2 },
        { value: 'COLLEAGUES' as WorkImpact, weight: 1 },
      ]));
    }
  }

  // Q5: Working hours (distribution réaliste)
  const q5WorkingHours = weightedRandom<WorkingHours>([
    { value: '<35', weight: 10 },
    { value: '35-39', weight: 45 },
    { value: '40-44', weight: 30 },
    { value: '45-49', weight: 10 },
    { value: '>=50', weight: 5 },
  ]);

  return {
    surveyId,
    q1Prevalence,
    q2EfficiencyPercent,
    q3Factors: factors.length > 0 ? JSON.stringify(factors) : null,
    q4Impact: impacts.length > 0 ? JSON.stringify(impacts) : null,
    q5WorkingHours,
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Usage: npx tsx --require dotenv/config scripts/generate-survey-responses.ts <surveyId> [nombreReponses]');
    console.error('');
    console.error('Exemple: npx tsx --require dotenv/config scripts/generate-survey-responses.ts clm123abc456 50');
    process.exit(1);
  }

  const surveyId = args[0];
  const count = parseInt(args[1] || '50', 10);

  console.log(`🔍 Vérification de l'enquête ${surveyId}...`);

  // Vérifier que l'enquête existe
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      company: true,
      _count: { select: { responses: true } },
    },
  });

  if (!survey) {
    console.error(`❌ Enquête non trouvée: ${surveyId}`);
    process.exit(1);
  }

  console.log(`✅ Enquête trouvée: "${survey.title}" (${survey.company.name})`);
  console.log(`   Statut: ${survey.status}`);
  console.log(`   Réponses existantes: ${survey._count.responses}`);
  console.log('');

  if (survey.status !== 'ACTIVE' && survey.status !== 'DRAFT') {
    console.warn(`⚠️  L'enquête est ${survey.status}. Génération de données de test quand même...`);
  }

  console.log(`📝 Génération de ${count} réponses...`);

  const responses = [];
  for (let i = 0; i < count; i++) {
    const response = generateResponse(surveyId);
    responses.push(response);
  }

  // Insérer les réponses en batch
  let created = 0;
  for (const response of responses) {
    try {
      await prisma.surveyResponse.create({
        data: response,
      });
      created++;
      
      // Afficher la progression
      if (created % 10 === 0) {
        process.stdout.write(`\r   ${created}/${count} réponses créées...`);
      }
    } catch (error) {
      console.error(`\n❌ Erreur lors de la création d'une réponse:`, error);
    }
  }

  console.log(`\n\n✅ ${created} réponses créées avec succès!`);

  // Afficher les statistiques générées
  const stats = {
    never: responses.filter(r => r.q1Prevalence === 'NEVER').length,
    occasionally: responses.filter(r => r.q1Prevalence === 'OCCASIONALLY').length,
    regularly: responses.filter(r => r.q1Prevalence === 'REGULARLY').length,
    veryFrequently: responses.filter(r => r.q1Prevalence === 'VERY_FREQUENTLY').length,
    avgEfficiency: Math.round(responses.reduce((sum, r) => sum + r.q2EfficiencyPercent, 0) / responses.length),
    topFactors: [
      { name: 'Stress', count: responses.filter(r => r.q3Factors?.includes('STRESS')).length },
      { name: 'Fatigue', count: responses.filter(r => r.q3Factors?.includes('FATIGUE')).length },
      { name: 'Concentration', count: responses.filter(r => r.q3Factors?.includes('CONCENTRATION')).length },
      { name: 'Douleurs', count: responses.filter(r => r.q3Factors?.includes('PAIN')).length },
    ].sort((a, b) => b.count - a.count),
  };

  console.log('');
  console.log('📊 Statistiques générées:');
  console.log(`   - Jamais: ${stats.never} (${Math.round(stats.never / count * 100)}%)`);
  console.log(`   - Occasionnellement: ${stats.occasionally} (${Math.round(stats.occasionally / count * 100)}%)`);
  console.log(`   - Régulièrement: ${stats.regularly} (${Math.round(stats.regularly / count * 100)}%)`);
  console.log(`   - Très fréquemment: ${stats.veryFrequently} (${Math.round(stats.veryFrequently / count * 100)}%)`);
  console.log(`   - Efficacité moyenne: ${stats.avgEfficiency}%`);
  console.log(`   - Top facteurs: ${stats.topFactors.map(f => `${f.name} (${f.count})`).join(', ')}`);
  console.log('');
  console.log('💡 Prévalence estimée:', Math.round((count - stats.never) / count * 100), '%');
  console.log('');

  // Nombre total de réponses après génération
  const updatedSurvey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { _count: { select: { responses: true } } },
  });

  console.log(`📈 Total réponses pour l'enquête: ${updatedSurvey?._count.responses}`);
  console.log('');
  console.log('🔄 Vous pouvez maintenant clôturer l\'enquête pour calculer le coût Méthode B.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
