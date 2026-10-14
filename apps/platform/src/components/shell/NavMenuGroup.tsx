'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { useTheme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';

import { Button as NavButton } from '@/components/ui/Button';
import { MarkerHighlight } from '@/components/ui/MarkerHighlight';
import type { NavItem } from '@/config/navigation';
import { usePathname } from '@/i18n/routing';
import { NavSubmenuList } from './NavSubmenuList';
import { isNavItemActive } from '@/lib/navigation/isNavItemActive';
import { navCtaName } from '@/lib/tracking/withCtaTracking';

const HOVER_CLOSE_DELAY_MS = 120;
const SUBMENU_FADE_MS = 120;

type NavMenuGroupProps = {
  item: NavItem;
};

export function NavMenuGroup({ item }: NavMenuGroupProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const theme = useTheme();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const pendingMenuFocusIndexRef = useRef<number | null>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const label = t(item.titleKey);
  const parentActive = isNavItemActive(pathname, item.href);
  const children = item.children ?? [];
  const submenuId = `${item.href}-submenu`;
  const submenuListId = `${item.href}-submenu-list`;
  const hasSubmenu = children.length > 0;

  function clearCloseTimer() {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  const openMenu = useCallback(() => {
    if (!hasSubmenu) return;
    clearCloseTimer();
    setOpen(true);
  }, [hasSubmenu]);

  const closeMenu = useCallback((returnFocus = false) => {
    clearCloseTimer();
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(
      () => setOpen(false),
      HOVER_CLOSE_DELAY_MS,
    );
  }, []);

  function handleHoverEnter() {
    openMenu();
  }

  function handleHoverLeave() {
    scheduleClose();
  }

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    scheduleClose();
  }

  const getMenuItems = useCallback(() => {
    return document
      .getElementById(submenuListId)
      ?.querySelectorAll<HTMLElement>('[role="menuitem"]');
  }, [submenuListId]);

  const focusMenuItem = useCallback(
    (index: number) => {
      const item = getMenuItems()?.[index];
      if (item) {
        item.focus();
        return;
      }
      pendingMenuFocusIndexRef.current = index;
      openMenu();
    },
    [getMenuItems, openMenu],
  );

  useEffect(() => {
    if (!open) return;
    const index = pendingMenuFocusIndexRef.current;
    if (index === null) return;
    pendingMenuFocusIndexRef.current = null;
    getMenuItems()?.[index]?.focus();
  }, [open, getMenuItems]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!hasSubmenu) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        openMenu();
        focusMenuItem(0);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeMenu(true);
        }
        break;
      default:
        break;
    }
  }

  const handleMenuItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const next = Math.min(index + 1, children.length - 1);
          focusMenuItem(next);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          if (index === 0) {
            closeMenu(true);
          } else {
            focusMenuItem(index - 1);
          }
          break;
        }
        case 'Escape':
          event.preventDefault();
          closeMenu(true);
          break;
        default:
          break;
      }
    },
    [children.length, closeMenu, focusMenuItem],
  );

  const submenuIcon = hasSubmenu ? (
    <ExpandMoreIcon
      aria-hidden
      sx={{
        fontSize: '1.25rem',
        transition: 'transform 150ms ease',
        transform: open ? 'rotate(180deg)' : 'none',
      }}
    />
  ) : null;

  const linkLabel = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      {label}
      {submenuIcon}
    </Box>
  );

  const menuOpen = open && anchorEl !== null;

  return (
    <Box
      ref={(node: HTMLDivElement | null) => setAnchorEl(node)}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleHoverLeave}
      onFocus={handleHoverEnter}
      onBlur={handleContainerBlur}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <NavButton
        ref={triggerRef}
        href={item.href}
        prefetch={item.prefetch}
        variant="text"
        color="inherit"
        size="medium"
        aria-current={parentActive ? 'page' : undefined}
        aria-haspopup={hasSubmenu ? 'menu' : undefined}
        aria-expanded={hasSubmenu && menuOpen ? 'true' : 'false'}
        aria-controls={hasSubmenu && menuOpen ? submenuId : undefined}
        onKeyDown={handleTriggerKeyDown}
        trackCta={{
          name: navCtaName(item.href),
          location: 'header_nav',
        }}
        sx={{
          fontWeight: parentActive ? 700 : 500,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {parentActive ? (
          <MarkerHighlight
            component="span"
            sx={{
              px: 1,
              py: 0.25,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
            }}
          >
            {label}
            {submenuIcon}
          </MarkerHighlight>
        ) : (
          linkLabel
        )}
      </NavButton>

      {hasSubmenu ? (
        <Popper
          id={submenuId}
          open={menuOpen}
          anchorEl={anchorEl}
          placement="bottom-start"
          disablePortal
          transition
          role={undefined}
          sx={{ zIndex: theme.zIndex.appBar + 2 }}
          modifiers={[
            {
              name: 'offset',
              options: { offset: [0, 14] },
            },
          ]}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={SUBMENU_FADE_MS}>
              <Paper
                elevation={0}
                onMouseEnter={handleHoverEnter}
                onMouseLeave={handleHoverLeave}
                sx={{
                  minWidth: 180,
                  py: 0.5,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottom: (t) =>
                    `3px solid ${t.palette.mode === 'dark' ? '#222' : '#e5e5e5'}`,
                  borderLeft: (t) =>
                    `3px solid ${t.palette.mode === 'dark' ? '#222' : '#e5e5e5'}`,
                  borderRight: (t) =>
                    `3px solid ${t.palette.mode === 'dark' ? '#222' : '#e5e5e5'}`,
                }}
              >
                <NavSubmenuList
                  listId={submenuListId}
                  ariaLabel={label}
                  items={children}
                  pathname={pathname}
                  onItemKeyDown={handleMenuItemKeyDown}
                  onItemNavigate={() => closeMenu(false)}
                />
              </Paper>
            </Fade>
          )}
        </Popper>
      ) : null}
    </Box>
  );
}
