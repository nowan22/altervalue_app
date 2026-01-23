import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PUT /api/bnq/alerts/[alertId] - Update alert
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { alertId } = await params;
    const body = await request.json();
    const {
      isRead,
      isDismissed,
      isResolved,
    } = body;

    const updateData: Record<string, unknown> = {};
    
    if (isRead !== undefined) {
      updateData.isRead = isRead;
      if (isRead) updateData.readAt = new Date();
    }
    if (isDismissed !== undefined) {
      updateData.isDismissed = isDismissed;
      if (isDismissed) {
        updateData.dismissedAt = new Date();
        updateData.dismissedBy = session.user?.email || 'unknown';
      }
    }
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved;
      if (isResolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user?.email || 'unknown';
      }
    }

    const alert = await prisma.bnqAlert.update({
      where: { id: alertId },
      data: updateData,
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/bnq/alerts/[alertId] - Delete alert
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { alertId } = await params;

    await prisma.bnqAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
