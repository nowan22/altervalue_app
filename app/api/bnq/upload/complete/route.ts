import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { cloud_storage_path, documentId } = await request.json();

    if (!cloud_storage_path || !documentId) {
      return NextResponse.json(
        { error: 'cloud_storage_path et documentId requis' },
        { status: 400 }
      );
    }

    // Update the document with the cloud storage path
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        cloudStoragePath: cloud_storage_path,
        fileUrl: cloud_storage_path, // Store the path as fileUrl for now
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la finalisation de l\'upload' },
      { status: 500 }
    );
  }
}
