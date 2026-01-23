import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateMethodB, calculateSurveyAggregate } from '@/lib/method-b-calculator';

// GET /api/companies/[id]/surveys - Get all surveys for a company
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: companyId } = await params;

    const surveys = await prisma.survey.findMany({
      where: { companyId },
      include: {
        aggregate: true,
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/companies/[id]/surveys - Create a new survey
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: companyId } = await params;
    const body = await request.json();
    const { title, description, startDate, endDate } = body;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Create the survey
    const survey = await prisma.survey.create({
      data: {
        companyId,
        title: title || 'Enquête Présentéisme',
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: 'DRAFT',
      },
      include: {
        aggregate: true,
        _count: {
          select: { responses: true }
        }
      }
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
