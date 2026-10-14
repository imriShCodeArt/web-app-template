import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { applyRequiredLegalAcceptance } from '@template/auth';
import { auth } from '@template/auth/server';
import { isPendingWebsite } from '@template/config';
import { parseWebsiteUrl } from '@/lib/account/parseWebsiteUrl';
import { isValidPhone } from '@/lib/contact/validatePhone';
import { db, userConsents, users } from '@template/db';
import { getClientRequestMeta } from '@/lib/http/clientRequestMeta';

const patchSchema = z
  .object({
    name: z.union([z.string(), z.null()]).optional(),
    company: z.union([z.string(), z.null()]).optional(),
    jobTitle: z.union([z.string(), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    address: z.union([z.string(), z.null()]).optional(),
    website: z.union([z.string(), z.null()]).optional(),
    locale: z.enum(['he', 'en']).optional(),
    marketingConsent: z.boolean().optional(),
    /** Confirms marketing preference even when the value matches the DB (e.g. OAuth onboarding). */
    acknowledgeMarketingPreference: z.literal(true).optional(),
    /** Required legal acceptance for OAuth / legacy accounts missing terms. */
    acceptTerms: z.literal(true).optional(),
  })
  .transform((data) => {
    const norm = (v: string | null | undefined) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const t = v.trim();
      return t.length === 0 ? null : t;
    };
    return {
      name: norm(data.name),
      company: norm(data.company),
      jobTitle: norm(data.jobTitle),
      phone: norm(data.phone),
      address: norm(data.address),
      website: norm(data.website),
      locale: data.locale,
      marketingConsent: data.marketingConsent,
      acknowledgeMarketingPreference: data.acknowledgeMarketingPreference,
      acceptTerms: data.acceptTerms,
    };
  })
  .superRefine((data, ctx) => {
    if (data.phone != null && data.phone.length > 40) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'LONG' });
    }
    if (data.phone != null && !isValidPhone(data.phone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'INVALID_PHONE',
      });
    }
    if (data.name != null && data.name.length > 200) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'LONG' });
    }
    if (data.company != null && data.company.length > 200) {
      ctx.addIssue({ code: 'custom', path: ['company'], message: 'LONG' });
    }
    if (data.jobTitle != null && data.jobTitle.length > 120) {
      ctx.addIssue({ code: 'custom', path: ['jobTitle'], message: 'LONG' });
    }
    if (data.address != null && data.address.length > 500) {
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'LONG' });
    }
    if (data.website != null && data.website.length > 2048) {
      ctx.addIssue({ code: 'custom', path: ['website'], message: 'LONG' });
    }
  });

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED' as const },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ code: 'BAD_REQUEST' as const }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 'INVALID_INPUT' as const },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const hasPatch =
    d.name !== undefined ||
    d.company !== undefined ||
    d.jobTitle !== undefined ||
    d.phone !== undefined ||
    d.address !== undefined ||
    d.website !== undefined ||
    d.locale !== undefined ||
    d.marketingConsent !== undefined ||
    d.acknowledgeMarketingPreference !== undefined ||
    d.acceptTerms !== undefined;
  if (!hasPatch) {
    return NextResponse.json({ code: 'NO_CHANGES' as const }, { status: 400 });
  }

  const [current] = await db
    .select({
      marketingConsent: users.marketingConsent,
      marketingConsentAt: users.marketingConsentAt,
      locale: users.locale,
      website: users.website,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!current) {
    return NextResponse.json({ code: 'NOT_FOUND' as const }, { status: 404 });
  }

  if (d.name !== undefined && d.name === null) {
    return NextResponse.json(
      { code: 'NAME_REQUIRED' as const },
      { status: 400 },
    );
  }

  if (d.website !== undefined && d.website === null) {
    return NextResponse.json(
      { code: 'WEBSITE_REQUIRED' as const },
      { status: 400 },
    );
  }

  const now = new Date();
  const meta = getClientRequestMeta(request);

  if (d.acceptTerms === true) {
    await applyRequiredLegalAcceptance({
      userId,
      source: 'terms_prompt',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  const updates: {
    name?: string;
    company?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string;
    locale?: string;
    marketingConsent?: boolean;
    marketingConsentAt?: Date | null;
    marketingConsentUpdatedAt?: Date | null;
    marketingUnsubscribedAt?: Date | null;
    updatedAt: Date;
  } = { updatedAt: now };

  if (typeof d.name === 'string') {
    updates.name = d.name;
  }
  if (d.company !== undefined) updates.company = d.company;
  if (d.jobTitle !== undefined) updates.jobTitle = d.jobTitle;
  if (d.phone !== undefined) updates.phone = d.phone;
  if (d.address !== undefined) updates.address = d.address;
  if (d.website !== undefined && d.website !== null) {
    const parsedUrl = parseWebsiteUrl(d.website);
    if (!parsedUrl.ok) {
      return NextResponse.json(
        { code: 'INVALID_WEBSITE' as const },
        { status: 400 },
      );
    }
    updates.website = parsedUrl.normalized;
  }

  if (d.locale !== undefined && d.locale !== current.locale) {
    updates.locale = d.locale;
  }

  if (d.acknowledgeMarketingPreference && d.marketingConsent === undefined) {
    return NextResponse.json(
      { code: 'MARKETING_CONSENT_REQUIRED' as const },
      { status: 400 },
    );
  }

  let logMarketingConsent = false;
  if (d.marketingConsent !== undefined) {
    const acknowledged = d.acknowledgeMarketingPreference === true;
    const valueChanged = d.marketingConsent !== current.marketingConsent;
    if (valueChanged || acknowledged) {
      updates.marketingConsent = d.marketingConsent;
      updates.marketingConsentUpdatedAt = now;
      if (d.marketingConsent) {
        updates.marketingUnsubscribedAt = null;
        if (!current.marketingConsentAt) {
          updates.marketingConsentAt = now;
        }
      } else {
        updates.marketingUnsubscribedAt = now;
      }
      logMarketingConsent = true;
    }
  }

  const hasProfileUpdates =
    updates.name !== undefined ||
    updates.company !== undefined ||
    updates.jobTitle !== undefined ||
    updates.phone !== undefined ||
    updates.address !== undefined ||
    updates.website !== undefined ||
    updates.locale !== undefined ||
    logMarketingConsent;

  if (hasProfileUpdates) {
    await db.transaction(async (tx) => {
      await tx.update(users).set(updates).where(eq(users.id, userId));
      if (logMarketingConsent && d.marketingConsent !== undefined) {
        await tx.insert(userConsents).values({
          userId,
          type: 'marketing_email',
          granted: d.marketingConsent,
          source:
            d.acknowledgeMarketingPreference === true
              ? 'marketing_prompt'
              : 'account_settings',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
      }
    });
  } else if (d.acceptTerms !== true) {
    return NextResponse.json({ code: 'NO_CHANGES' as const }, { status: 400 });
  }

  const [row] = await db
    .select({
      name: users.name,
      email: users.email,
      company: users.company,
      jobTitle: users.jobTitle,
      phone: users.phone,
      address: users.address,
      website: users.website,
      locale: users.locale,
      marketingConsent: users.marketingConsent,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ code: 'NOT_FOUND' as const }, { status: 404 });
  }

  const resolvedIncompleteProfile =
    isPendingWebsite(current.website) &&
    updates.website !== undefined &&
    !isPendingWebsite(updates.website);

  return NextResponse.json({
    ok: true as const,
    resolvedIncompleteProfile,
    profile: {
      name: row.name,
      email: row.email,
      company: row.company,
      jobTitle: row.jobTitle,
      phone: row.phone,
      address: row.address,
      website: row.website,
      locale: row.locale,
      marketingConsent: row.marketingConsent,
    },
  });
}
