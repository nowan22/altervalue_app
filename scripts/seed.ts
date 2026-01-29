import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo users configuration - v4.0
const DEMO_USERS = [
  {
    email: 'superadmin@altervalue.ca',
    name: 'Sophie Admin',
    role: 'SUPER_ADMIN' as Role,
    password: 'altervalue2026',
  },
  {
    email: 'expert@altervalue.ca',
    name: 'Eric Expert',
    role: 'EXPERT' as Role,
    password: 'altervalue2026',
  },
  {
    email: 'pilote@demo.com',
    name: 'Pierre Pilote',
    role: 'PILOTE_QVCT' as Role,
    password: 'altervalue2026',
  },
  {
    email: 'observateur@demo.com',
    name: 'Olivia Observateur',
    role: 'OBSERVATEUR' as Role,
    password: 'altervalue2026',
  },
];

async function main() {
  console.log('Starting seed v4.0...');

  // Create demo users for each role
  const hashedPassword = await bcrypt.hash('altervalue2026', 10);
  
  const users: any[] = [];
  for (const userData of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
      },
    });
    users.push(user);
    console.log(`Created/updated user: ${user.email} (${user.role})`);
  }

  // Use the Expert user for demo companies
  const expertUser = users.find(u => u.role === 'EXPERT');
  const user = expertUser || users[0];
  console.log('Using user for demo companies:', user.email);

  // Create settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      presAbsCoefficient: 1.3,
      productivityLossCoeff: 0.33,
      workingDaysPerYear: 220,
      absenteeismGreenMax: 4.0,
      absenteeismOrangeMax: 6.0,
      turnoverGreenMax: 10.0,
      turnoverOrangeMax: 15.0,
      presCostGreenMaxPct: 5.0,
      presCostOrangeMaxPct: 8.0,
    },
  });
  console.log('Created settings');

  // Create sector benchmarks
  const benchmarks = [
    { sector: 'tech_services', absenteeismAvg: 3.5, absenteeismMin: 2, absenteeismMax: 5, turnoverAvg: 18, turnoverMin: 12, turnoverMax: 25, avgSeniorityYears: 3.5 },
    { sector: 'industrie', absenteeismAvg: 5.5, absenteeismMin: 4, absenteeismMax: 7, turnoverAvg: 8, turnoverMin: 5, turnoverMax: 12, avgSeniorityYears: 12 },
    { sector: 'commerce', absenteeismAvg: 6.0, absenteeismMin: 4, absenteeismMax: 8, turnoverAvg: 25, turnoverMin: 18, turnoverMax: 35, avgSeniorityYears: 4 },
    { sector: 'sante', absenteeismAvg: 8.5, absenteeismMin: 6, absenteeismMax: 11, turnoverAvg: 12, turnoverMin: 8, turnoverMax: 16, avgSeniorityYears: 8 },
    { sector: 'btp', absenteeismAvg: 6.5, absenteeismMin: 4, absenteeismMax: 9, turnoverAvg: 15, turnoverMin: 10, turnoverMax: 20, avgSeniorityYears: 7 },
    { sector: 'finance', absenteeismAvg: 4.0, absenteeismMin: 2.5, absenteeismMax: 5.5, turnoverAvg: 12, turnoverMin: 8, turnoverMax: 16, avgSeniorityYears: 6 },
  ];

  for (const b of benchmarks) {
    await prisma.sectorBenchmark.upsert({
      where: { sector: b.sector },
      update: b,
      create: b,
    });
  }
  console.log('Created benchmarks');

  // Create demo companies
  const demoCompanies = [
    {
      name: 'TechVision SA',
      sector: 'tech_services',
      country: 'France',
      employeesCount: 180,
      avgGrossSalary: 48000,
      employerContributionRate: 0.45,
      absenteeismRate: 3.2,
      isDemo: true,
      userId: user.id,
      kpis: generateKpiHistory(180, 48000, 0.45, 3.2, 1.3, 0.33, 220, 12, 'improving'),
    },
    {
      name: 'Manufacture Durand',
      sector: 'industrie',
      country: 'France',
      employeesCount: 320,
      avgGrossSalary: 32000,
      employerContributionRate: 0.48,
      absenteeismRate: 7.8,
      isDemo: true,
      userId: user.id,
      kpis: generateKpiHistory(320, 32000, 0.48, 7.8, 1.3, 0.33, 220, 18, 'critical'),
    },
    {
      name: 'Groupe Sant\u00e9 Plus',
      sector: 'sante',
      country: 'France',
      employeesCount: 520,
      avgGrossSalary: 36000,
      employerContributionRate: 0.46,
      absenteeismRate: 5.5,
      isDemo: true,
      userId: user.id,
      kpis: generateKpiHistory(520, 36000, 0.46, 5.5, 1.3, 0.33, 220, 24, 'stable'),
    },
  ];

  const createdCompanies: any[] = [];
  
  for (const companyData of demoCompanies) {
    const { kpis, ...company } = companyData;
    
    // Delete existing demo company with same name
    await prisma.company.deleteMany({
      where: { name: company.name, isDemo: true },
    });

    const createdCompany = await prisma.company.create({
      data: company,
    });
    createdCompanies.push(createdCompany);

    // Create KPIs
    for (const kpi of kpis) {
      await prisma.kpiSnapshot.create({
        data: {
          ...kpi,
          companyId: createdCompany.id,
        },
      });
    }

    console.log('Created demo company:', createdCompany.name, 'with', kpis.length, 'KPI periods');
  }

  // v4.0-epsilon: Assign demo missions to Pilote and Observateur users
  const piloteUser = users.find(u => u.role === 'PILOTE_QVCT');
  const observateurUser = users.find(u => u.role === 'OBSERVATEUR');
  
  // Clear existing assignments for demo users
  await prisma.missionAssignment.deleteMany({
    where: {
      userId: { in: [piloteUser?.id, observateurUser?.id].filter(Boolean) },
    },
  });

  // Assign first demo company to Pilote
  if (piloteUser && createdCompanies.length > 0) {
    await prisma.missionAssignment.create({
      data: {
        userId: piloteUser.id,
        companyId: createdCompanies[0].id,
        assignedBy: expertUser?.id || user.id,
      },
    });
    console.log(`Assigned mission "${createdCompanies[0].name}" to ${piloteUser.email}`);
  }

  // Assign first demo company to Observateur as well
  if (observateurUser && createdCompanies.length > 0) {
    await prisma.missionAssignment.create({
      data: {
        userId: observateurUser.id,
        companyId: createdCompanies[0].id,
        assignedBy: expertUser?.id || user.id,
      },
    });
    console.log(`Assigned mission "${createdCompanies[0].name}" to ${observateurUser.email}`);
  }

  console.log('Seed completed!');
}

function generateKpiHistory(
  baseEmployees: number,
  baseSalary: number,
  chargesRate: number,
  baseAbsenteeism: number,
  presCoeff: number,
  prodLossCoeff: number,
  workDays: number,
  months: number,
  profile: 'improving' | 'stable' | 'critical'
) {
  const kpis: any[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Variations based on profile
    let absVariation = 0;
    let empVariation = 0;
    
    if (profile === 'improving') {
      absVariation = (i / months) * 1.5; // Getting better over time
      empVariation = Math.floor((months - i) * 2);
    } else if (profile === 'critical') {
      absVariation = -(i / months) * 2; // Getting worse
      empVariation = -Math.floor((months - i) * 0.5);
    } else {
      absVariation = (Math.random() - 0.5) * 0.5; // Stable with small variations
      empVariation = Math.floor((Math.random() - 0.5) * 5);
    }

    const absenteeismRate = Math.max(1, Math.min(15, baseAbsenteeism + absVariation + (Math.random() - 0.5) * 0.8));
    const employeesCount = Math.max(10, baseEmployees + empVariation);
    const turnoverRate = profile === 'critical' ? 18 + Math.random() * 5 : profile === 'improving' ? 8 + Math.random() * 3 : 12 + Math.random() * 4;

    // Calculate presenteeism
    const presRate = absenteeismRate * presCoeff;
    const presDays = (presRate / 100) * employeesCount * workDays;
    const productivityLoss = presDays * prodLossCoeff;
    const avgTotalSalary = baseSalary * (1 + chargesRate);
    const presCost = productivityLoss * baseSalary * (1 + chargesRate) / workDays;
    const presCostPerEmployee = presCost / employeesCount;

    kpis.push({
      periodDate: date,
      periodType: 'MONTHLY',
      employeesCount,
      avgGrossSalary: baseSalary,
      employerContributionRate: chargesRate,
      absenteeismRate: Math.round(absenteeismRate * 10) / 10,
      turnoverRate: Math.round(turnoverRate * 10) / 10,
      avgSeniorityYears: profile === 'critical' ? 2.5 : profile === 'improving' ? 4.2 : 6.5,
      presRateCalculated: Math.round(presRate * 100) / 100,
      presDaysCalculated: Math.round(presDays),
      productivityLoss: Math.round(productivityLoss),
      presCostCalculated: Math.round(presCost),
      presCostPerEmployee: Math.round(presCostPerEmployee),
    });
  }

  return kpis;
}

// Seed Survey Types v4.1
async function seedSurveyTypes() {
  console.log('Seeding survey types v4.1...');
  
  const surveyTypes = [
    {
      typeId: 'PRESENTEEISM_DIAGNOSTIC',
      name: 'Diagnostic Présentéisme & Coûts Cachés',
      category: 'PRESENTEEISM',
      estimatedDuration: 5,
      anonymityThreshold: 15,
      definitionFile: 'survey_type_presenteeism_diagnostic.json',
    },
    {
      typeId: 'RADAR_QVCT_FLASH',
      name: 'Radar QVCT - Diagnostic Flash',
      category: 'QVCT',
      estimatedDuration: 8,
      anonymityThreshold: 15,
      definitionFile: 'survey_type_radar_qvct_flash.json',
    },
    {
      typeId: 'BNQ_DATA_COLLECTION',
      name: 'Collecte de Données BNQ 9700-800',
      category: 'QVCT',
      estimatedDuration: 15,
      anonymityThreshold: 15,
      definitionFile: 'survey_type_bnq_data_collection.json',
    },
  ];

  for (const st of surveyTypes) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'lib', 'survey-types', st.definitionFile);
      const definition = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      await prisma.surveyType.upsert({
        where: { typeId: st.typeId },
        update: {
          name: st.name,
          definition,
          estimatedDuration: st.estimatedDuration,
          anonymityThreshold: st.anonymityThreshold,
        },
        create: {
          typeId: st.typeId,
          name: st.name,
          description: definition.survey_metadata?.primary_objective,
          category: st.category as any,
          definition,
          isActive: true,
          isSystem: true,
          estimatedDuration: st.estimatedDuration,
          anonymityThreshold: st.anonymityThreshold,
        },
      });
      console.log(`  ✓ ${st.name}`);
    } catch (e) {
      console.log(`  ✗ ${st.name} (file not found or invalid)`);
    }
  }
}

main()
  .then(() => seedSurveyTypes())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
