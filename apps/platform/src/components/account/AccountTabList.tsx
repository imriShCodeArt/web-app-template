'use client';

import { type SyntheticEvent } from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslations } from 'next-intl';

type AccountTabListProps = {
  value: number;
  onChange: (event: SyntheticEvent, value: number) => void;
};

export function AccountTabList({ value, onChange }: AccountTabListProps) {
  const t = useTranslations('auth.account');

  return (
    <Tabs
      value={value}
      onChange={onChange}
      aria-label={t('tabs.ariaLabel')}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTabs-indicator': { height: 3 },
      }}
    >
      <Tab
        label={t('tabs.details')}
        id="account-tab-0"
        aria-controls="account-tabpanel-0"
      />
      <Tab
        label={t('tabs.settings')}
        id="account-tab-1"
        aria-controls="account-tabpanel-1"
      />
    </Tabs>
  );
}
