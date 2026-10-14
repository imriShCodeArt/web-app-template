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

export function ContactEmailRow({
  email,
  ctaLocation = 'contact_page',
}: {
  email: string;
  ctaLocation?: string;
}) {
  const t = useTranslations('pages.contact');
  const [snackOpen, setSnackOpen] = useState(false);

  const copy = useCallback(async () => {
    track('contact_click', {
      contact_method: 'email',
      cta_location: ctaLocation,
    });

    try {
      await navigator.clipboard.writeText(email);
      setSnackOpen(true);
    } catch {
      /* clipboard API blocked or unavailable */
    }
  }, [ctaLocation, email]);

  return (
    <>
      <Typography variant="body2" color="text.secondary" component="p">
        {t('directEmail')}:{' '}
        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
          <Link
            color="secondary"
            href={`mailto:${email}`}
            onClick={() => {
              track('contact_click', {
                contact_method: 'email',
                cta_location: ctaLocation,
              });
            }}
          >
            {email}
          </Link>
        </Box>
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
          <Button
            type="button"
            variant="text"
            color="secondary"
            onClick={copy}
            aria-label={`${t('emailCopyAria')}: ${email}`}
            title={t('emailCopyHint')}
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
              '& .contact-email-copy-text': {
                textDecoration: 'underline',
                textUnderlineOffset: '0.15em',
              },
            }}
          >
            <Box component="span" className="contact-email-copy-text">
              {email}
            </Box>
          </Button>
        </Box>
      </Typography>
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={t('emailCopySuccess')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
