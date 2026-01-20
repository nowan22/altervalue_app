import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import SettingsContent from "./_components/settings-content";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  const benchmarks = await prisma.sectorBenchmark.findMany({
    orderBy: { sector: 'asc' },
  });

  return (
    <SettingsContent
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
      benchmarks={JSON.parse(JSON.stringify(benchmarks ?? []))}
    />
  );
}
