'use client';

import { useCallback, useState } from 'react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { track } from '@/lib/tracking/analytics';

function digitsForCopy(telHref: string): string {
  return telHref.replace(/^tel:/i, '').replace(/[^\d+]/g, '');
}

export function ContactPhoneRow({
  telHref,
  displayPhone,
  copyValue,
  ctaLocation = 'contact_page',
}: {
  telHref: string;
  displayPhone: string;
  /** Value written to the clipboard on desktop; defaults to digits parsed from `telHref`. */
  copyValue?: string;
  ctaLocation?: string;
}) {
  const t = useTranslations('pages.contact');
  const [snackOpen, setSnackOpen] = useState(false);
  const resolvedCopy = copyValue ?? digitsForCopy(telHref);

  const copy = useCallback(async () => {
    track('contact_click', {
      contact_method: 'phone',
      cta_location: ctaLocation,
    });

    try {
      await navigator.clipboard.writeText(resolvedCopy);
      setSnackOpen(true);
    } catch {
      /* clipboard API blocked or unavailable */
    }
  }, [ctaLocation, resolvedCopy]);

  return (
    <>
      <Typography variant="body2" color="text.secondary" component="p">
        {t('directPhone')}:{' '}
        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
          <Link
            color="secondary"
            href={telHref}
            onClick={() => {
              track('contact_click', {
                contact_method: 'phone',
                cta_location: ctaLocation,
              });
            }}
          >
            {displayPhone}
          </Link>
        </Box>
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
          <Button
            type="button"
            variant="text"
            color="secondary"
            onClick={copy}
            aria-label={`${t('phoneCopyAria')}: ${displayPhone}`}
            title={t('phoneCopyHint')}
            endIcon={
              <ContentCopyOutlinedIcon
                aria-hidden
                sx={{ fontSize: '1.1em', verticalAlign: 'middle' }}
              />
            }
            sx={{
              textTransform: 'none',
              p: 0,
              minWidth: 0,
              verticalAlign: 'baseline',
              textDecoration: 'none',
              font: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              letterSpacing: 'inherit',
              '&:hover': { bgcolor: 'transparent' },
              '& .contact-phone-copy-text': {
                textDecoration: 'underline',
                textUnderlineOffset: '0.15em',
              },
            }}
          >
            <Box component="span" className="contact-phone-copy-text">
              {displayPhone}
            </Box>
          </Button>
        </Box>
      </Typography>
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={t('phoneCopySuccess')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
