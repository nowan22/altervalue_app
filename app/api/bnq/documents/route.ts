import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    const [company, documentTypes] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: {
          documents: {
            include: { documentType: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.documentType.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: 'Mission non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      documents: company.documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        status: doc.status,
        version: doc.version,
        createdAt: doc.createdAt.toISOString(),
        validatedAt: doc.validatedAt?.toISOString() || null,
        documentType: doc.documentType,
      })),
      documentTypes: documentTypes,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
