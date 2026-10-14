'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useState } from 'react';

import type { AccountProfilePayload } from '@/components/account/accountTypes';
import { defaultLocale, isLocale, type Locale } from '@template/i18n';
import { usePathname, useRouter } from '@/i18n/routing';
import { parseWebsiteUrl } from '@/lib/account/parseWebsiteUrl';
import { stripWebsiteUrlPrefix } from '@/lib/account/websiteUrlField';
import { isValidPhone } from '@/lib/contact/validatePhone';
import { getRouterReplaceTarget } from '@/lib/i18n/router-path';
import { track } from '@/lib/tracking/analytics';

function normalizeLocale(value: string | null | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

type UseAccountProfileFormArgs = {
  profile: AccountProfilePayload;
  marketingConsent: boolean;
};

export function useAccountProfileForm({
  profile,
  marketingConsent,
}: UseAccountProfileFormArgs) {
  const t = useTranslations('auth.account');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const uiLocaleRaw = useLocale();
  const uiLocale = normalizeLocale(uiLocaleRaw);
  const { data: session, update } = useSession();

  const [name, setName] = useState(profile.name ?? '');
  const [company, setCompany] = useState(profile.company ?? '');
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [website, setWebsite] = useState(() =>
    stripWebsiteUrlPrefix(profile.website ?? ''),
  );
  const [locale, setLocale] = useState<Locale>(() =>
    normalizeLocale(profile.locale),
  );
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setNameError(null);
      setWebsiteError(null);
      setSuccess(false);

      const nameTrim = name.trim();
      if (!nameTrim) {
        setNameError(t('profile.errorNameRequired'));
        return;
      }

      const webParse = parseWebsiteUrl(website);
      if (!webParse.ok) {
        setWebsiteError(
          webParse.reason === 'empty'
            ? t('profile.errorWebsiteRequired')
            : t('profile.errorWebsiteInvalid'),
        );
        return;
      }

      const phoneTrim = phone.trim();
      if (phoneTrim && !isValidPhone(phoneTrim)) {
        setError(t('profile.errorPhone'));
        return;
      }

      setSaving(true);
      try {
        const payload = {
          name: nameTrim,
          company: company.trim() === '' ? null : company.trim(),
          jobTitle: jobTitle.trim() === '' ? null : jobTitle.trim(),
          phone: phoneTrim === '' ? null : phoneTrim,
          address: address.trim() === '' ? null : address.trim(),
          website: webParse.normalized,
          locale,
          marketingConsent,
        };

        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          code?: string;
          resolvedIncompleteProfile?: boolean;
          profile?: { locale?: string };
        };

        if (!res.ok) {
          if (data.code === 'NAME_REQUIRED') {
            setNameError(t('profile.errorNameRequired'));
          } else if (data.code === 'WEBSITE_REQUIRED') {
            setWebsiteError(t('profile.errorWebsiteRequired'));
          } else if (data.code === 'INVALID_WEBSITE') {
            setWebsiteError(t('profile.errorWebsiteInvalid'));
          } else if (data.code === 'INVALID_INPUT') {
            setError(t('profile.errorPhone'));
          } else {
            setError(t('profile.errorSave'));
          }
          return;
        }

        if (data.resolvedIncompleteProfile) {
          track('profile_completed');
        }

        setSuccess(true);
        await update({
          user: {
            ...session?.user,
            name: payload.name ?? null,
            email: profile.email ?? session?.user?.email,
          },
        });

        const savedLocale = normalizeLocale(data.profile?.locale);
        if (savedLocale !== uiLocale) {
          router.replace(getRouterReplaceTarget(pathname, params), {
            locale: savedLocale,
          });
        } else {
          router.refresh();
        }
      } catch {
        setError(t('profile.errorSave'));
      } finally {
        setSaving(false);
      }
    },
    [
      name,
      company,
      jobTitle,
      phone,
      address,
      website,
      locale,
      marketingConsent,
      profile.email,
      pathname,
      params,
      router,
      session,
      update,
      t,
      uiLocale,
    ],
  );

  return {
    values: {
      name,
      company,
      jobTitle,
      phone,
      address,
      website,
      locale,
    },
    setters: {
      setName,
      setCompany,
      setJobTitle,
      setPhone,
      setAddress,
      setWebsite,
      setLocale,
      setNameError,
      setWebsiteError,
    },
    errors: {
      error,
      nameError,
      websiteError,
    },
    status: {
      success,
      saving,
    },
    onSubmit,
  };
}
