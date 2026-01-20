export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const benchmarks = await prisma.sectorBenchmark.findMany({
      orderBy: { sector: 'asc' },
    });

    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error("Error fetching benchmarks:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des benchmarks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    const existingBenchmark = await prisma.sectorBenchmark.findUnique({
      where: { sector: body.sector },
    });

    let benchmark;
    if (existingBenchmark) {
      benchmark = await prisma.sectorBenchmark.update({
        where: { id: existingBenchmark.id },
        data: body,
      });
    } else {
      benchmark = await prisma.sectorBenchmark.create({
        data: body,
      });
    }

    return NextResponse.json(benchmark);
  } catch (error) {
    console.error("Error creating benchmark:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du benchmark" },
      { status: 500 }
    );
  }
}
