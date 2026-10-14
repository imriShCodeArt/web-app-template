'use client';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type SyntheticEvent, useCallback, useState } from 'react';

import { AccountFooterActions } from '@/components/account/AccountFooterActions';
import { AccountHeader } from '@/components/account/AccountHeader';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { AccountSettingsPanel } from '@/components/account/AccountSettingsPanel';
import { AccountTabList } from '@/components/account/AccountTabList';
import { AccountTabPanel } from '@/components/account/AccountTabPanel';
import { MarketingConsentSession } from '@/components/account/MarketingConsentSession';
import type { AccountTabsProps } from '@/components/account/accountTypes';
import {
  accountTabIndexFromQuery,
  accountTabQueryFromIndex,
} from '@/lib/account/accountTabQuery';

export type {
  AccountProfilePayload,
  AccountTabsProps,
} from '@/components/account/accountTypes';

export function AccountTabs({
  profile,
  profileVersion,
  signOutLabel,
}: AccountTabsProps) {
  const router = useRouter();
  const t = useTranslations('auth.account');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = accountTabIndexFromQuery(searchParams.get('tab'));

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(
    null,
  );

  const handleTabChange = useCallback(
    (_: SyntheticEvent, value: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', accountTabQueryFromIndex(value));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const saveMarketingPreferences = useCallback(
    async (consent: boolean) => {
      setSettingsSaveSuccess(false);
      setSettingsSaveError(null);
      setSettingsSaving(true);
      try {
        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketingConsent: consent }),
        });
        if (!res.ok) {
          setSettingsSaveError(t('profile.errorSave'));
          return;
        }
        setSettingsSaveSuccess(true);
        router.refresh();
      } catch {
        setSettingsSaveError(t('profile.errorSave'));
      } finally {
        setSettingsSaving(false);
      }
    },
    [router, t],
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
      <MarketingConsentSession
        key={profileVersion}
        initialMarketingConsent={profile.marketingConsent}
      >
        {({ marketingConsent, setMarketingConsent }) => (
          <Stack spacing={2}>
            <AccountHeader profile={profile} />
            <AccountTabList value={tab} onChange={handleTabChange} />

            <AccountTabPanel index={0} activeIndex={tab}>
              {tab === 0 ? (
                <AccountProfileForm
                  key={profileVersion}
                  profile={profile}
                  signOutLabel={signOutLabel}
                  marketingConsent={marketingConsent}
                />
              ) : null}
            </AccountTabPanel>

            <AccountTabPanel index={1} activeIndex={tab}>
              {tab === 1 ? (
                <AccountSettingsPanel
                  marketingConsent={marketingConsent}
                  settingsSaveSuccess={settingsSaveSuccess}
                  settingsSaveError={settingsSaveError}
                  onMarketingConsentChange={setMarketingConsent}
                  onDismissSuccess={() => setSettingsSaveSuccess(false)}
                  onDismissError={() => setSettingsSaveError(null)}
                />
              ) : null}
            </AccountTabPanel>

            <AccountFooterActions
              activeTab={tab}
              signOutLabel={signOutLabel}
              settingsSaving={settingsSaving}
              onSaveSettings={() =>
                void saveMarketingPreferences(marketingConsent)
              }
            />
          </Stack>
        )}
      </MarketingConsentSession>
    </Paper>
  );
}
