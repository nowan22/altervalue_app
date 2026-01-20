import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import CompaniesContent from "./_components/companies-content";

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

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
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  return (
    <CompaniesContent
      companies={JSON.parse(JSON.stringify(companies ?? []))}
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
    />
  );
}
