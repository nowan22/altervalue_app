import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateExecutiveReportHTML, CampaignReportData } from '@/lib/pdf-report-generator';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Fetch campaign with all related data
    const campaign = await prisma.surveyCampaign.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            name: true,
            sector: true,
            employeesCount: true,
          },
        },
        surveyType: {
          select: {
            name: true,
            category: true,
            estimatedDuration: true,
          },
        },
        result: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    if (!campaign.result) {
      return NextResponse.json(
        { error: 'Aucun résultat disponible pour cette campagne' },
        { status: 400 }
      );
    }

    // Prepare report data
    const reportData: CampaignReportData = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        launchedAt: campaign.launchedAt?.toISOString() || null,
        closedAt: campaign.closedAt?.toISOString() || null,
      },
      company: {
        name: campaign.company.name,
        sector: campaign.company.sector,
        employeesCount: campaign.company.employeesCount,
      },
      surveyType: {
        name: campaign.surveyType.name,
        category: campaign.surveyType.category,
        estimatedDuration: campaign.surveyType.estimatedDuration,
      },
      result: {
        responseCount: campaign.result.responseCount,
        participationRate: campaign.result.participationRate,
        scores: campaign.result.scores as Record<string, number>,
        criticalIndicators: (campaign.result.criticalIndicators || {}) as Record<string, any>,
        financialMetrics: campaign.result.financialMetrics as Record<string, number> | null,
        narrative: campaign.result.narrative,
        calculatedAt: campaign.result.calculatedAt?.toISOString() || null,
      },
    };

    // Generate HTML
    const htmlContent = generateExecutiveReportHTML(reportData);

    // Step 1: Create PDF generation request
    const createResponse = await fetch(
      'https://apps.abacus.ai/api/createConvertHtmlToPdfRequest',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: htmlContent,
          pdf_options: {
            format: 'A4',
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
            print_background: true,
          },
        }),
      }
    );

    if (!createResponse.ok) {
      console.error('PDF creation failed:', await createResponse.text());
      return NextResponse.json(
        { error: 'Erreur lors de la création du PDF' },
        { status: 500 }
      );
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json(
        { error: 'Aucun ID de requête retourné' },
        { status: 500 }
      );
    }

    // Step 2: Poll for status
    const maxAttempts = 120; // 2 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        'https://apps.abacus.ai/api/getConvertHtmlToPdfStatus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id,
            deployment_token: process.env.ABACUSAI_API_KEY,
          }),
        }
      );

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS') {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64');
          const filename = `rapport_${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        }
        return NextResponse.json(
          { error: 'PDF généré mais aucune donnée' },
          { status: 500 }
        );
      } else if (status === 'FAILED') {
        const errorMsg = result?.error || 'Génération PDF échouée';
        console.error('PDF generation failed:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      attempts++;
    }

    return NextResponse.json(
      { error: 'Délai de génération PDF dépassé' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
