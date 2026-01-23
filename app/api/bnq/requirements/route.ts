import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_REQUIREMENTS, BNQ_CHAPTER_TITLES } from '@/lib/bnq-requirements';

// GET /api/bnq/requirements - Get all BNQ requirements
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapter = searchParams.get('chapter');
    const level = searchParams.get('level') || 'ES';
    const seedIfEmpty = searchParams.get('seedIfEmpty') === 'true';

    // Check if requirements exist in DB
    let requirements = await prisma.bnqRequirement.findMany({
      orderBy: [{ chapter: 'asc' }, { sortOrder: 'asc' }],
    });

    // Seed if empty and requested
    if (requirements.length === 0 && seedIfEmpty) {
      await prisma.bnqRequirement.createMany({
        data: BNQ_REQUIREMENTS.map(req => ({
          chapter: req.chapter,
          section: req.section,
          title: req.title,
          description: req.description,
          requirement: req.requirement,
          requiredForLevel: req.requiredForLevel,
          isOptional: req.isOptional,
          category: req.category,
          linkedDocumentCode: req.linkedDocumentCode,
          linkedWorkflowStep: req.linkedWorkflowStep,
          verificationMethod: req.verificationMethod,
          evidence: req.evidence,
          frequency: req.frequency,
          sortOrder: req.sortOrder,
        })),
      });

      requirements = await prisma.bnqRequirement.findMany({
        orderBy: [{ chapter: 'asc' }, { sortOrder: 'asc' }],
      });
    }

    // If DB is empty and not seeding, return static data
    if (requirements.length === 0) {
      let filteredReqs = BNQ_REQUIREMENTS;
      
      if (chapter) {
        filteredReqs = filteredReqs.filter(r => r.chapter === parseInt(chapter));
      }
      
      const levelOrder = { ES: 1, ESE: 2, ESE_PLUS: 3 };
      const targetLevel = levelOrder[level as keyof typeof levelOrder] || 1;
      filteredReqs = filteredReqs.filter(r => 
        levelOrder[r.requiredForLevel] <= targetLevel
      );

      return NextResponse.json({
        requirements: filteredReqs,
        chapters: BNQ_CHAPTER_TITLES,
        source: 'static',
      });
    }

    // Filter from DB
    let filtered = requirements;
    if (chapter) {
      filtered = filtered.filter(r => r.chapter === parseInt(chapter));
    }
    
    const levelOrder = { ES: 1, ESE: 2, ESE_PLUS: 3 };
    const targetLevel = levelOrder[level as keyof typeof levelOrder] || 1;
    filtered = filtered.filter(r => 
      levelOrder[r.requiredForLevel as keyof typeof levelOrder] <= targetLevel
    );

    return NextResponse.json({
      requirements: filtered,
      chapters: BNQ_CHAPTER_TITLES,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
