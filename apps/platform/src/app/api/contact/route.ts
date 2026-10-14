import { NextResponse } from 'next/server';
import { z } from 'zod';

import { siteConfig } from '@template/config';
import type { ContactErrorCode } from '@/lib/contact/contactApi';
import { isValidPhone } from '@/lib/contact/validatePhone';
import { serverEnv } from '@/lib/server-env';

const SUBJECT_MAX = 200;
const MESSAGE_MAX = 8000;

const bodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().max(320).toLowerCase().pipe(z.string().email()),
    phone: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .refine(isValidPhone, { message: 'Invalid phone' }),
    company: z.string().max(200).optional(),
    subject: z.string().max(SUBJECT_MAX).optional(),
    message: z.string().max(MESSAGE_MAX).optional(),
  })
  .transform((data) => ({
    ...data,
    company: (data.company ?? '').trim(),
    subject: (data.subject ?? '').trim(),
    message: (data.message ?? '').trim(),
  }));

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_INPUT' satisfies ContactErrorCode },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 'INVALID_INPUT' satisfies ContactErrorCode },
      { status: 400 },
    );
  }

  const { name, email, phone, company, subject, message } = parsed.data;
  const hasDetailFields = subject.length > 0 || message.length > 0;

  // Fail fast if email sending is not configured — before any DB work.
  const apiKey = serverEnv.RESEND_API_KEY;
  const from = serverEnv.CONTACT_FROM_EMAIL?.trim();
  const to = serverEnv.CONTACT_TO_EMAIL?.trim() || siteConfig.contact.email;
  if (!apiKey || !from) {
    console.error('[api/contact] Missing RESEND_API_KEY or CONTACT_FROM_EMAIL');
    return NextResponse.json(
      { code: 'NOT_CONFIGURED' satisfies ContactErrorCode },
      { status: 503 },
    );
  }

  // Send the email. If this fails, the visitor can retry.
  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: hasDetailFields
          ? `${subject} — ${siteConfig.shortName}`
          : `Contact form — ${siteConfig.shortName}`,
        text: [
          `Name: ${name}`,
          ...(company ? [`Company: ${company}`] : []),
          `Email: ${email}`,
          `Phone: ${phone}`,
          ...(hasDetailFields
            ? [
                '',
                `Subject: ${subject}`,
                ...(message ? ['', 'Message:', message] : []),
              ]
            : []),
        ].join('\n'),
      }),
    });
  } catch (err) {
    console.error('[api/contact] Resend fetch failed:', err);
    return NextResponse.json(
      { code: 'SEND_FAILED' satisfies ContactErrorCode },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[api/contact] Resend error:', res.status, errBody);
    if (res.status === 403) {
      console.error(
        '[api/contact] Resend often returns 403 until a domain is verified (resend.com/domains) ' +
          'and CONTACT_FROM_EMAIL uses that domain. For local testing without a verified domain, ' +
          'set CONTACT_TO_EMAIL to the same address as your Resend account email.',
      );
    }
    return NextResponse.json(
      { code: 'SEND_FAILED' satisfies ContactErrorCode },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true as const });
}
