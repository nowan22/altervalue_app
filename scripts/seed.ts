import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'Jean Consultant',
      role: 'ADMIN',
    },
  });
  console.log('Created user:', user.email);

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

  for (const companyData of demoCompanies) {
    const { kpis, ...company } = companyData;
    
    // Delete existing demo company with same name
    await prisma.company.deleteMany({
      where: { name: company.name, isDemo: true },
    });

    const createdCompany = await prisma.company.create({
      data: company,
    });

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
