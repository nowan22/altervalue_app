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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workflowSteps: {
          include: { tasks: true },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Mission non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      workflowSteps: company.workflowSteps.map((step: any) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        stepCode: step.stepCode,
        stepName: step.stepName,
        description: step.description,
        status: step.status,
        completedAt: step.completedAt?.toISOString() || null,
        signature: step.signature,
        tasks: step.tasks.map((task: any) => ({
          id: task.id,
          taskCode: task.taskCode,
          taskName: task.taskName,
          isRequired: task.isRequired,
          isCompleted: task.isCompleted,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
