import { Container } from '@/components/ui/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type BodyKey = `p${number}`;

export interface ContentDocumentProps {
  heading: string;
  /** Optional note under the heading (e.g. last updated). */
  kicker?: string;
  bodyKeys: BodyKey[];
  t: (key: string) => string;
}

/**
 * Shared layout for simple marketing / legal pages driven by translation keys.
 */
export function ContentDocument({
  heading,
  kicker,
  bodyKeys,
  t,
}: ContentDocumentProps) {
  return (
    <Container layout="document">
      <Stack spacing={2}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          {heading}
        </Typography>
        {kicker ? (
          <Typography variant="body2" color="text.secondary" component="p">
            {kicker}
          </Typography>
        ) : null}
        <Stack spacing={2.5} component="article">
          {bodyKeys.map((key) => (
            <Typography
              key={key}
              variant="body1"
              color="text.secondary"
              component="p"
              sx={{ lineHeight: 1.7 }}
            >
              {t(key)}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
