import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { companyId, companyName, presenteeismRate, presenteeismCost, threshold } = await request.json();

    if (!companyId || !companyName) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Create HTML email body
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Alerte Critique</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Seuil de présentéisme dépassé</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Entreprise : ${companyName}</h2>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Taux de présentéisme</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #dc2626; font-size: 18px;">${presenteeismRate.toFixed(2)}%</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Coût estimé</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #dc2626; font-size: 18px;">${presenteeismCost.toLocaleString('fr-FR')} €/an</td>
              </tr>
              <tr style="border-top: 1px dashed #fecaca;">
                <td style="padding: 10px 0; color: #6b7280;">Seuil critique</td>
                <td style="padding: 10px 0; text-align: right; color: #991b1b;">${threshold}%</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              <strong>💡 Recommandation :</strong> Une analyse approfondie des causes du présentéisme est recommandée. 
              Consultez le tableau de bord pour plus de détails et envisagez la mise en place d'actions correctives.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/companies/${companyId}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Voir le détail →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>AlterValue - Gestion du présentéisme</p>
          <p>Alerte générée le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    `;

    // Extract app name from URL
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? 'AlterValue' : 'AlterValue';

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_ALERTE_CRITIQUE_PRSENTISME,
        subject: `🚨 Alerte Critique : Présentéisme élevé - ${companyName}`,
        body: htmlBody,
        is_html: true,
        recipient_email: 'nowan22@gmail.com',
        sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : 'noreply@altervalue.app',
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      if (result.notification_disabled) {
        console.log('Notification disabled by user, skipping email');
        return NextResponse.json({ success: true, message: 'Notification désactivée' });
      }
      throw new Error(result.message || 'Échec de l\'envoi de la notification');
    }

    return NextResponse.json({ success: true, message: 'Alerte envoyée avec succès' });
  } catch (error) {
    console.error('Erreur envoi alerte:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
