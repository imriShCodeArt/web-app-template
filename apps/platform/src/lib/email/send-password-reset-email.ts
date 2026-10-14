import { siteConfig } from '@template/config';
import { defaultLocale } from '@template/i18n';
import { serverEnv } from '@/lib/server-env';

export interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  token: string;
  locale: string;
}

function buildResetUrl(token: string, locale: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${base}${prefix}/reset-password?token=${encodeURIComponent(token)}`;
}

function buildHtml(
  params: SendPasswordResetEmailParams & { resetUrl: string },
): string {
  const { name, resetUrl, locale } = params;
  const isHe = locale === 'he';
  const dir = isHe ? 'rtl' : 'ltr';
  const align = isHe ? 'right' : 'left';

  const brand = siteConfig.shortName;
  const subject = isHe
    ? `איפוס סיסמה לחשבון ${brand}`
    : `Reset your ${brand} password`;
  const greeting = isHe ? `שלום, ${name}!` : `Hello, ${name}!`;
  const intro = isHe
    ? `קיבלנו בקשה לאיפוס הסיסמה של חשבון ${brand} שלך. לחץ/י על הכפתור כדי לבחור סיסמה חדשה.`
    : `We received a request to reset the password for your ${brand} account. Click the button to choose a new password.`;
  const ctaLabel = isHe ? 'איפוס סיסמה' : 'Reset password';
  const expiry = isHe
    ? 'הקישור בתוקף לשעה אחת.'
    : 'This link is valid for one hour.';
  const ignore = isHe
    ? 'אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו. הסיסמה שלך לא תשתנה.'
    : 'If you did not request a password reset, you can safely ignore this email. Your password will not change.';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1565c0;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;text-align:${align};">
                ${siteConfig.shortName}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;direction:${dir};text-align:${align};">
              <p style="margin:0 0 16px;font-size:16px;color:#212121;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#424242;line-height:1.6;">${intro}</p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#1565c0;border-radius:6px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#757575;">${expiry}</p>
              <p style="margin:0;font-size:13px;color:#9e9e9e;">${ignore}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9e9e9e;">
                © ${new Date().getFullYear()} ${siteConfig.shortName} — <a href="${siteConfig.url}" style="color:#9e9e9e;">${siteConfig.url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = serverEnv.RESEND_API_KEY;
  const from =
    serverEnv.VERIFICATION_FROM_EMAIL?.trim() ||
    serverEnv.CONTACT_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      '[email/password-reset] RESEND_API_KEY or sender address not configured — skipping password reset email.',
    );
    return { ok: false, error: 'email_not_configured' };
  }

  const { locale } = params;
  const isHe = locale === 'he';
  const brand = siteConfig.shortName;
  const subject = isHe
    ? `איפוס סיסמה לחשבון ${brand}`
    : `Reset your ${brand} password`;

  const resetUrl = buildResetUrl(params.token, locale);
  const html = buildHtml({ ...params, resetUrl });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[email/password-reset] Resend error', res.status, body);
      return { ok: false, error: 'resend_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[email/password-reset] fetch error', err);
    return { ok: false, error: 'network_error' };
  }
}
