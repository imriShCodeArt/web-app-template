'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
      <Stack
        spacing={3}
        sx={{ textAlign: 'center', maxWidth: 480, mx: 'auto' }}
      >
        <Typography variant="h5" component="h1">
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary">
          An unexpected error occurred. You can try again or return to the home
          page.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
          <Button variant="contained" onClick={reset}>
            Try again
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
