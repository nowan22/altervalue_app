import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CompanyDetail from "./_components/company-detail";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      kpis: {
        orderBy: { periodDate: 'desc' },
      },
    },
  });

  if (!company) {
    notFound();
  }

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  const benchmarks = await prisma.sectorBenchmark.findMany();

  return (
    <CompanyDetail
      company={JSON.parse(JSON.stringify(company ?? {}))}
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
      benchmarks={JSON.parse(JSON.stringify(benchmarks ?? []))}
    />
  );
}
