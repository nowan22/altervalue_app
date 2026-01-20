import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data, filename, columns } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Données requises' }, { status: 400 });
    }

    // Generate CSV content (Excel-compatible with BOM)
    const headers = columns || Object.keys(data[0] || {});
    const csvRows = [
      headers.join(';'),
      ...data.map((row: Record<string, unknown>) => 
        headers.map((h: string) => {
          const value = row[h];
          // Handle numbers for French Excel format
          if (typeof value === 'number') {
            return value.toString().replace('.', ',');
          }
          // Escape strings with quotes if they contain semicolons
          if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(';')
      )
    ];

    // Add BOM for UTF-8 Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename || 'export.csv'}"`,
      },
    });
  } catch (error) {
    console.error('Erreur export Excel:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
