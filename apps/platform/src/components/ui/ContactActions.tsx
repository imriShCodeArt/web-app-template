'use client';

import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useCallback, useState } from 'react';

import { track } from '@/lib/tracking/analytics';

interface ContactActionsProps {
  phone: string;
  callLabel: string;
  sendMessageLabel: string;
  copiedLabel: string;
  /** Toast message after a successful desktop copy; defaults to `copiedLabel`. */
  copiedToastLabel?: string;
  ctaLocation?: string;
  /** stack: sidebar column (default). inline: side-by-side row for sticky bars. */
  layout?: 'stack' | 'inline';
}

function isLikelyMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const coarsePointer =
    window.matchMedia?.('(pointer: coarse)').matches ?? false;

  return /android|iphone|ipad|ipod|mobile/i.test(userAgent) || coarsePointer;
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}

export function ContactActions({
  phone,
  callLabel,
  sendMessageLabel,
  copiedLabel,
  copiedToastLabel,
  ctaLocation = 'audit_sidebar',
  layout = 'stack',
}: ContactActionsProps) {
  const isInline = layout === 'inline';
  const [useDesktopCopyMode] = useState(() => !isLikelyMobileDevice());
  const [isCopied, setIsCopied] = useState(false);
  const toastMessage = copiedToastLabel ?? copiedLabel;

  const handleCallClick = useCallback(async () => {
    track('contact_click', {
      contact_method: 'phone',
      cta_location: ctaLocation,
    });

    if (!useDesktopCopyMode) {
      window.location.href = `tel:${phone}`;
      return;
    }

    const copied = await copyTextToClipboard(phone);
    if (!copied) return;

    setIsCopied(true);
  }, [ctaLocation, phone, useDesktopCopyMode]);
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <>
      <Stack
        direction={isInline ? 'row' : 'column'}
        spacing={1}
        sx={isInline ? { width: '100%' } : undefined}
      >
        <Button
          onClick={handleCallClick}
          startIcon={<CallOutlinedIcon />}
          variant="contained"
          color="primary"
          size="small"
          fullWidth={!isInline}
          sx={isInline ? { flex: 1, minWidth: 0 } : undefined}
        >
          {isCopied ? copiedLabel : callLabel}
        </Button>
        <Button
          component="a"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track('contact_click', {
              contact_method: 'whatsapp',
              cta_location: ctaLocation,
            });
          }}
          startIcon={<WhatsAppIcon />}
          variant="outlined"
          color="success"
          size="small"
          fullWidth={!isInline}
          sx={isInline ? { flex: 1, minWidth: 0 } : undefined}
        >
          {sendMessageLabel}
        </Button>
      </Stack>
      <Snackbar
        open={isCopied}
        autoHideDuration={3000}
        onClose={() => setIsCopied(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 88, md: 104 } }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setIsCopied(false)}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
