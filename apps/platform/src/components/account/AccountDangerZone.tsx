'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { signOutAndClearUserId } from '@/lib/auth/signOutAndClearUserId';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

export function AccountDangerZone() {
  const t = useTranslations('auth.account.settings');
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelete = useCallback(async () => {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(t('errorDelete'));
        setDeleting(false);
        return;
      }
      await signOutAndClearUserId({ callbackUrl: '/' });
    } catch {
      setError(t('errorDelete'));
      setDeleting(false);
    }
  }, [t]);

  return (
    <>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dangerIntro')}
        </Typography>
        <Button
          type="button"
          variant="outlined"
          color="error"
          onClick={withCtaTracking(
            () => {
              setError(null);
              setOpen(true);
            },
            'delete_account_open',
            'account',
          )}
          disabled={deleting}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('deleteAccount')}
        </Button>
      </Stack>

      <Dialog
        open={open}
        onClose={() => !deleting && setOpen(false)}
        aria-labelledby="account-delete-dialog-title"
        aria-describedby="account-delete-dialog-description"
      >
        <DialogTitle id="account-delete-dialog-title">
          {t('dialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography id="account-delete-dialog-description" variant="body2">
            {t('dialogBody')}
          </Typography>
          {error ? (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            color="inherit"
            variant="outlined"
            onClick={withCtaTracking(
              () => setOpen(false),
              'delete_account_cancel',
              'account',
            )}
            disabled={deleting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={withCtaTracking(
              () => void handleConfirmDelete(),
              'delete_account_confirm',
              'account',
            )}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? t('deleting') : t('confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
