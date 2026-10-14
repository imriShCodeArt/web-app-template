import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { Container } from '@/components/ui/Container';

/** Skeleton shown while the account page fetches session + DB data. */
export default function AccountPageLoading() {
  return (
    <Container layout="loose">
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          {/* AccountHeader — avatar + welcome + title + subtitle */}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Stack spacing={0.75} sx={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="45%" height={28} />
              <Skeleton variant="text" width="60%" height={18} />
            </Stack>
          </Stack>

          {/* AccountTabList — 4 tabs */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ borderBottom: 1, borderColor: 'divider', pb: 0.5 }}
          >
            {[120, 80, 100, 130].map((w, i) => (
              <Skeleton key={i} variant="text" width={w} height={36} />
            ))}
          </Stack>

          {/* Email field (disabled, full-width) */}
          <Skeleton variant="rounded" height={56} />

          {/* Profile fields grid: 6 half-width fields */}
          <Grid container spacing={2.25} columns={12}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <Skeleton variant="rounded" height={56} />
              </Grid>
            ))}

            {/* Address — full width, multiline */}
            <Grid size={{ xs: 12 }}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          </Grid>

          {/* Security note caption */}
          <Skeleton variant="text" width="55%" height={16} />

          {/* Save + Sign out buttons */}
          <Stack direction="row" spacing={1.5}>
            <Skeleton variant="rounded" width={140} height={40} />
            <Skeleton variant="rounded" width={100} height={40} />
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
