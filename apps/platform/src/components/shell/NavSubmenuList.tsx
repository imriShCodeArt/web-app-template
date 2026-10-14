'use client';

import type { ElementType, KeyboardEvent } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslations } from 'next-intl';

import type { NavItem } from '@/config/navigation';
import { Link } from '@/i18n/routing';
import { isNavItemActive } from '@/lib/navigation/isNavItemActive';
import { navCtaName, withCtaTracking } from '@/lib/tracking/withCtaTracking';

type NavSubmenuListProps = {
  listId: string;
  ariaLabel: string;
  items: NavItem[];
  pathname: string;
  onItemKeyDown: (event: KeyboardEvent<HTMLElement>, index: number) => void;
  onItemNavigate: () => void;
};

export function NavSubmenuList({
  listId,
  ariaLabel,
  items,
  pathname,
  onItemKeyDown,
  onItemNavigate,
}: NavSubmenuListProps) {
  const t = useTranslations();

  return (
    <List id={listId} dense disablePadding role="menu" aria-label={ariaLabel}>
      {items.map((child, index) => {
        const childLabel = t(child.titleKey);
        const childActive = isNavItemActive(pathname, child.href);

        return (
          <ListItemButton
            key={child.href}
            component={Link as ElementType}
            href={child.href}
            prefetch={child.prefetch}
            role="menuitem"
            tabIndex={0}
            selected={childActive}
            onKeyDown={(event) => onItemKeyDown(event, index)}
            onClick={withCtaTracking(
              onItemNavigate,
              navCtaName(child.href),
              'header_nav',
            )}
            sx={{ borderRadius: 1, mx: 0.5 }}
          >
            <ListItemText primary={childLabel} />
          </ListItemButton>
        );
      })}
    </List>
  );
}
