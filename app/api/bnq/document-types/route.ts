import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { BNQ_DOCUMENT_TYPES } from '@/lib/bnq-data';

// GET: Fetch all document types, seed if not exists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if document types exist
    let documentTypes = await prisma.documentType.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Seed if empty
    if (documentTypes.length === 0) {
      await prisma.documentType.createMany({
        data: BNQ_DOCUMENT_TYPES,
      });
      documentTypes = await prisma.documentType.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    }

    return NextResponse.json(documentTypes);
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des types de documents' },
      { status: 500 }
    );
  }
}
