import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ContactEmailRow } from '@/components/ui/ContactEmailRow';
import { ContactPhoneRow } from '@/components/ui/ContactPhoneRow';

type ContactPageHeroProps = {
  heading: string;
  intro: string;
  email: string;
  phoneDisplay: string;
  phoneTel: string;
  headingId?: string;
  ctaLocation?: string;
};

export function ContactPageHero({
  heading,
  intro,
  email,
  phoneDisplay,
  phoneTel,
  headingId = 'contact-page-heading',
  ctaLocation = 'contact_page_hero',
}: ContactPageHeroProps) {
  return (
    <Stack
      spacing={{ xs: 2.5, md: 3.5 }}
      sx={{
        height: '100%',
        justifyContent: 'center',
        py: { xs: 1, md: 4 },
        pr: { md: 2 },
      }}
    >
      <Typography
        id={headingId}
        variant="h2"
        component="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2rem', sm: '2.35rem', md: '2.75rem' },
          lineHeight: 1.15,
          letterSpacing: -0.5,
        }}
      >
        {heading}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ lineHeight: 1.75, maxWidth: 480 }}
      >
        {intro}
      </Typography>

      <Stack spacing={1.25} sx={{ pt: 0.5 }}>
        <ContactEmailRow email={email} ctaLocation={ctaLocation} />
        <ContactPhoneRow
          telHref={phoneTel}
          displayPhone={phoneDisplay}
          ctaLocation={ctaLocation}
        />
      </Stack>
    </Stack>
  );
}

export function formatContactPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) {
    return `0${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

export function formatContactPhoneTel(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}
