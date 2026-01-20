import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { html_content, filename, pdf_options } = await request.json();

    if (!html_content) {
      return NextResponse.json({ error: 'Contenu HTML requis' }, { status: 400 });
    }

    // Step 1: Create the PDF generation request
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html_content,
        pdf_options: pdf_options || { format: 'A4', print_background: true },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: 'Échec de la création de la requête PDF' }));
      return NextResponse.json({ success: false, error: error.error }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ success: false, error: 'Aucun ID de requête retourné' }, { status: 500 });
    }

    // Step 2: Poll for status until completion
    const maxAttempts = 120; // 2 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS') {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64');
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename || 'rapport.pdf'}"`,
            },
          });
        } else {
          return NextResponse.json({ success: false, error: 'Génération PDF terminée mais aucune donnée' }, { status: 500 });
        }
      } else if (status === 'FAILED') {
        const errorMsg = result?.error || 'Échec de la génération PDF';
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ success: false, error: 'Délai dépassé pour la génération PDF' }, { status: 500 });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
