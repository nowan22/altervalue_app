import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import DashboardContent from "./_components/dashboard-content";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  // Get companies with their KPIs
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { userId: userId || '' },
        { isDemo: true },
      ],
    },
    include: {
      kpis: {
        orderBy: { periodDate: 'desc' },
        take: 12,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get settings
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  // Get benchmarks
  const benchmarks = await prisma.sectorBenchmark.findMany();

  return (
    <DashboardContent
      companies={JSON.parse(JSON.stringify(companies ?? []))}
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
      benchmarks={JSON.parse(JSON.stringify(benchmarks ?? []))}
    />
  );
}
