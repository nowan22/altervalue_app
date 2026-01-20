import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import CalculatorContent from "./_components/calculator-content";

export default async function CalculatorPage() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  return (
    <CalculatorContent settings={JSON.parse(JSON.stringify(settings ?? {}))} />
  );
}
