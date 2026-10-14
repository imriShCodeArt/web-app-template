import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { getTranslations } from 'next-intl/server';

import {
  ContactPageHero,
  formatContactPhoneDisplay,
  formatContactPhoneTel,
} from '@/components/contact/ContactPageHero';
import { ContactForm } from '@/components/contact/ContactForm';
import { LocalePageView } from '@/components/page/LocalePageView';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@template/config';
import {
  CONTACT_FORM_PRESET_MESSAGE_KEYS,
  parseContactFormPreset,
  parseContactInterest,
} from '@/lib/contact/contactFormQuery';
import { defineLocalePage, type LocaleSearchPageProps } from '@/lib/page';
import { sitemapLastModifiedByPath } from '@/config/sitemap-last-modified';

type PageProps = LocaleSearchPageProps<{
  interest?: string;
  preset?: string;
}>;

const page = defineLocalePage({
  path: '/contact',
  namespace: 'pages.contact',
  sitemapLastModified: sitemapLastModifiedByPath['/contact'],
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return page.generateMetadata({ params });
}

export default async function ContactPage({ params, searchParams }: PageProps) {
  const { locale, t, navT } = await page.getContext(params);
  const resolvedSearchParams = await searchParams;
  const contactFormT = await getTranslations({
    locale,
    namespace: 'footer.contactForm',
  });
  const phone = siteConfig.contact.phone;

  const defaultInterest = parseContactInterest(resolvedSearchParams.interest);
  const preset = parseContactFormPreset(resolvedSearchParams.preset);
  const defaultMessage = preset
    ? contactFormT(CONTACT_FORM_PRESET_MESSAGE_KEYS[preset])
    : undefined;

  return (
    <LocalePageView
      jsonLd={page.breadcrumbJsonLd(locale, navT('home'), [
        { name: t('heading'), path: '/contact' },
      ])}
    >
      <Box
        component="section"
        sx={{
          bgcolor: 'background.muted',
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(33,132,90,0.1), transparent 50%)',
        }}
      >
        <Container layout="wide">
          <Grid
            container
            spacing={{ xs: 4, md: 6 }}
            sx={{ alignItems: 'stretch' }}
          >
            <Grid size={{ xs: 12, md: 5 }}>
              <ContactPageHero
                heading={t('heroTitle')}
                intro={t('intro')}
                email={siteConfig.contact.email}
                phoneDisplay={formatContactPhoneDisplay(phone)}
                phoneTel={formatContactPhoneTel(phone)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <ContactForm
                variant="page"
                headingId="contact-page-heading"
                defaultInterest={defaultInterest}
                defaultMessage={defaultMessage}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </LocalePageView>
  );
}
