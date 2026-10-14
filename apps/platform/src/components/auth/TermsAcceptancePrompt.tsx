'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { GOOGLE_OAUTH_POPUP_CALLBACK_PATH } from '@template/auth/client';
import { Link, usePathname } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

/** Dispatched after legal acceptance so marketing prompt can re-check status. */
export const ACCOUNT_CONSENTS_UPDATED_EVENT = 'account-consents-updated';

const LEGAL_DOC_PATHS = new Set(['/terms', '/privacy', '/cookies']);

function LegalDocLink({
  href,
  children,
  opensNewWindowLabel,
}: {
  href: '/terms' | '/privacy';
  children: ReactNode;
  opensNewWindowLabel: string;
}) {
  return (
    <Box
      component={Link}
      href={href}
      prefetch={false}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      sx={{
        // Keep `inline` (not flex) so the link stays inside the Hebrew bidi run.
        position: 'relative',
        display: 'inline',
        fontWeight: 700,
        color: 'inherit',
        textDecoration: 'underline',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
      <OpenInNewIcon
        aria-hidden
        sx={{
          display: 'inline',
          fontSize: '0.85em',
          opacity: 0.85,
          verticalAlign: 'middle',
          // Logical margin keeps the icon after the label in both LTR and RTL.
          marginInlineStart: '0.2em',
        }}
      />
      <Box
        component="span"
        sx={{
          border: 0,
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          height: '1px',
          margin: '-1px',
          overflow: 'hidden',
          padding: 0,
          position: 'absolute',
          width: '1px',
          whiteSpace: 'nowrap',
        }}
      >
        {opensNewWindowLabel}
      </Box>
    </Box>
  );
}

export function TermsAcceptancePrompt() {
  const t = useTranslations('auth.termsPrompt');
  const tSignUp = useTranslations('auth.signUp');
  const tA11y = useTranslations('pages.accessibility');
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opensNewWindowLabel = tA11y('externalLinkOpensNewWindow');

  const onLegalDocPage = LEGAL_DOC_PATHS.has(pathname);
  const onOAuthPopupPage = pathname === GOOGLE_OAUTH_POPUP_CALLBACK_PATH;
  const suppressPrompt = onLegalDocPage || onOAuthPopupPage;

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/account/legal-prompt-status', {
        cache: 'no-store',
        signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { needsPrompt?: boolean };
      if (data.needsPrompt === true) {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || suppressPrompt) return;
    const abort = new AbortController();
    void Promise.resolve().then(() => loadStatus(abort.signal));
    return () => abort.abort();
  }, [status, loadStatus, suppressPrompt]);

  async function submitAcceptance() {
    setError(null);
    if (!checked) {
      setError(t('termsRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptTerms: true as const,
        }),
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setOpen(false);
      window.dispatchEvent(new Event(ACCOUNT_CONSENTS_UPDATED_EVENT));
      router.refresh();
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  // Keep the prompt off legal pages so users can actually read the documents.
  // The Google OAuth popup shares this layout; do not open a dialog there.
  if (status !== 'authenticated' || !open || suppressPrompt) {
    return null;
  }

  return (
    <Dialog
      open
      disableEnforceFocus
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown' || reason === 'backdropClick') {
          return;
        }
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="terms-prompt-title"
    >
      <DialogTitle
        variant="h3"
        id="terms-prompt-title"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          columnGap: 2,
        }}
      >
        <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
          {t('title')}
        </Box>
        <LanguageSwitcher compact />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography
            variant="h5"
            color="text.primary"
            sx={{ pb: 0.5, lineHeight: 1.6 }}
          >
            {t('intro')}
          </Typography>
          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : null}
          <FormControlLabel
            sx={{ alignItems: 'flex-start', mx: 0 }}
            control={
              <Checkbox
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
            }
            label={
              <Typography
                component="span"
                variant="body2"
                sx={{ pt: 1.1, lineHeight: 1.6 }}
              >
                {tSignUp.rich('acceptTerms', {
                  terms: (chunks) => (
                    <LegalDocLink
                      href="/terms"
                      opensNewWindowLabel={opensNewWindowLabel}
                    >
                      {chunks}
                    </LegalDocLink>
                  ),
                  privacy: (chunks) => (
                    <LegalDocLink
                      href="/privacy"
                      opensNewWindowLabel={opensNewWindowLabel}
                    >
                      {chunks}
                    </LegalDocLink>
                  ),
                })}
              </Typography>
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={submitting || !checked}
          onClick={withCtaTracking(
            () => void submitAcceptance(),
            'terms_acceptance_continue',
            'account',
          )}
        >
          {t('continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
