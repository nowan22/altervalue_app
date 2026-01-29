import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import DashboardContent from "./_components/dashboard-content";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  // Redirect PILOTE_QVCT and OBSERVATEUR to their dedicated dashboard
  if (userRole === 'PILOTE_QVCT' || userRole === 'OBSERVATEUR') {
    redirect('/dashboard/my-mission');
  }

  // Get companies with their KPIs, latest survey, and BNQ progress
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
      surveys: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          aggregate: true,
        },
      },
      bnqProgress: true,
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

  // Get recent activity logs (for Experts and Super Admins)
  let activityLogs: any[] = [];
  if (userRole === 'SUPER_ADMIN' || userRole === 'EXPERT') {
    activityLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  } else if (userId) {
    activityLogs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  return (
    <DashboardContent
      companies={JSON.parse(JSON.stringify(companies ?? []))}
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
      benchmarks={JSON.parse(JSON.stringify(benchmarks ?? []))}
      activityLogs={JSON.parse(JSON.stringify(activityLogs ?? []))}
    />
  );
}
