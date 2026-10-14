import { siteConfig } from '@template/config';
import { serverEnv } from '@/lib/server-env';

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  otp: string;
  token: string;
  locale: string;
}

function buildVerifyUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function buildHtml(
  params: SendVerificationEmailParams & { verifyUrl: string },
): string {
  const { name, otp, verifyUrl, locale } = params;
  const isHe = locale === 'he';
  const dir = isHe ? 'rtl' : 'ltr';
  const align = isHe ? 'right' : 'left';

  const brand = siteConfig.shortName;
  const subject = isHe
    ? `אמת את חשבון ${brand} שלך`
    : `Verify your ${brand} account`;
  const greeting = isHe ? `שלום, ${name}!` : `Hello, ${name}!`;
  const intro = isHe
    ? `תודה שנרשמת ל-${brand}. כדי לאמת את כתובת האימייל שלך ולהפעיל את החשבון, השתמש בקוד שלהלן או לחץ על הכפתור.`
    : `Thank you for signing up for ${brand}. To verify your email address and activate your account, use the code below or click the button.`;
  const codeLabel = isHe ? 'קוד האימות שלך:' : 'Your verification code:';
  const orLabel = isHe
    ? 'או לחץ על הכפתור להפעלה מיידית:'
    : 'Or click the button to activate immediately:';
  const ctaLabel = isHe ? 'הפעלת החשבון' : 'Activate My Account';
  const expiry = isHe
    ? 'הקוד והקישור בתוקף ל-24 שעות.'
    : 'The code and link are valid for 24 hours.';
  const ignore = isHe
    ? `אם לא נרשמת ל-${brand}, ניתן להתעלם מהודעה זו.`
    : `If you did not sign up for ${brand}, you can safely ignore this email.`;

  void subject;

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

              <!-- OTP box -->
              <p style="margin:0 0 8px;font-size:14px;color:#616161;font-weight:600;">${codeLabel}</p>
              <div style="display:inline-block;background:#f0f4ff;border:2px solid #1565c0;border-radius:8px;padding:16px 32px;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1565c0;font-family:monospace;">${otp}</span>
              </div>

              <p style="margin:0 0 16px;font-size:14px;color:#616161;">${orLabel}</p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#1565c0;border-radius:6px;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
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

export async function sendVerificationEmail(
  params: SendVerificationEmailParams,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = serverEnv.RESEND_API_KEY;
  const from =
    serverEnv.VERIFICATION_FROM_EMAIL?.trim() ||
    serverEnv.CONTACT_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      '[email/verification] RESEND_API_KEY or sender address not configured — skipping verification email.',
    );
    return { ok: false, error: 'email_not_configured' };
  }

  const { locale } = params;
  const isHe = locale === 'he';
  const brand = siteConfig.shortName;
  const subject = isHe
    ? `אמת את חשבון ${brand} שלך`
    : `Verify your ${brand} account`;

  const verifyUrl = buildVerifyUrl(params.token);
  const html = buildHtml({ ...params, verifyUrl });

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
      console.error('[email/verification] Resend error', res.status, body);
      return { ok: false, error: 'resend_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[email/verification] fetch error', err);
    return { ok: false, error: 'network_error' };
  }
}
