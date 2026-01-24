import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { TEMPLATE_GENERATORS, type BnqCompanyData } from '@/lib/bnq-templates';

interface RouteParams {
  params: Promise<{ templateCode: string }>;
}

// GET: Generate a document template for a company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { templateCode } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId requis' },
        { status: 400 }
      );
    }

    // Check if template exists
    const generator = TEMPLATE_GENERATORS[templateCode];
    if (!generator) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      );
    }

    // Fetch company data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        sector: true,
        employeesCount: true,
        directorName: true,
        directorTitle: true,
        siret: true,
        address: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Prepare company data for template
    const companyData: BnqCompanyData = {
      name: company.name,
      address: company.address || undefined,
      siret: company.siret || undefined,
      sector: company.sector,
      employeesCount: company.employeesCount,
      directorName: company.directorName || undefined,
      directorTitle: company.directorTitle || undefined,
    };

    // Generate HTML
    const html = generator(companyData);

    // Return HTML that can be printed to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du template' },
      { status: 500 }
    );
  }
}
