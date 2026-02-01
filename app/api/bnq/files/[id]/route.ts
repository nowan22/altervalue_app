import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the document
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        cloudStoragePath: true,
        fileName: true,
      },
    });

    if (!document || !document.cloudStoragePath) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // Generate a signed URL (files are private by default)
    const fileUrl = await getFileUrl(document.cloudStoragePath, false);

    return NextResponse.json({
      fileUrl,
      fileName: document.fileName,
    });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du fichier' },
      { status: 500 }
    );
  }
}
