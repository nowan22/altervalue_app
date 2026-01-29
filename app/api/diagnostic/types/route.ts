import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { logActivityServer } from '@/lib/activity-logger';
import { Role } from '@prisma/client';

// GET: List all active survey types
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const surveyTypes = await prisma.surveyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        typeId: true,
        name: true,
        description: true,
        version: true,
        category: true,
        isSystem: true,
        estimatedDuration: true,
        anonymityThreshold: true,
        createdAt: true,
      },
    });

    return NextResponse.json(surveyTypes);
  } catch (error) {
    console.error('Error fetching survey types:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des types d\'enquêtes' },
      { status: 500 }
    );
  }
}

// POST: Create a new survey type (SUPER_ADMIN only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les Super-Admins peuvent créer des types d\'enquêtes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { typeId, name, description, category, definition, estimatedDuration, anonymityThreshold, dataRetentionDays } = body;

    // Validate required fields
    if (!typeId || !name || !category || !definition) {
      return NextResponse.json(
        { error: 'Champs requis manquants: typeId, name, category, definition' },
        { status: 400 }
      );
    }

    // Check if typeId already exists
    const existing = await prisma.surveyType.findUnique({
      where: { typeId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un type avec cet identifiant existe déjà' },
        { status: 409 }
      );
    }

    // Create survey type
    const surveyType = await prisma.surveyType.create({
      data: {
        typeId,
        name,
        description,
        category,
        definition,
        estimatedDuration: estimatedDuration || 10,
        anonymityThreshold: anonymityThreshold || 15,
        dataRetentionDays: dataRetentionDays || 730,
        createdById: user.id,
        isSystem: false,
      },
    });

    // Log activity

    return NextResponse.json(surveyType, { status: 201 });
  } catch (error) {
    console.error('Error creating survey type:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du type d\'enquête' },
      { status: 500 }
    );
  }
}
