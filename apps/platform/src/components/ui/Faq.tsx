'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box, { type BoxProps } from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqProps = {
  items: FaqItem[];
  /** Prefix for accordion control / panel IDs. Must be unique per page. */
  idPrefix: string;
  /** `grouped`: shared borders in a stack. `separated`: individual rounded cards. */
  variant?: 'grouped' | 'separated';
  /** Index of the item expanded on first render. Omit to collapse all. */
  defaultExpandedIndex?: number | null;
  answerVariant?: 'body1' | 'body2';
  questionFontWeight?: 600 | 700;
  sx?: SxProps<Theme>;
};

export type FaqSectionProps = FaqProps & {
  title: string;
  /** ID for the section heading used by `aria-labelledby`. */
  headingId: string;
  headingComponent?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  containerMaxWidth?: 'sm' | 'md' | 'lg';
  muted?: boolean;
} & Omit<BoxProps, 'title'>;

export type FaqSectionFromNamespaceProps = Omit<
  FaqSectionProps,
  'title' | 'items'
> & {
  /** Translation namespace containing title and FAQ items. */
  namespace: string;
  titleKey?: string;
  itemsKey?: string;
};

function getAccordionSx(
  variant: NonNullable<FaqProps['variant']>,
): SxProps<Theme> {
  if (variant === 'separated') {
    return {
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '8px !important',
      mb: 1.5,
      '&:before': { display: 'none' },
      '&.Mui-expanded': { mb: 1.5 },
    };
  }

  return {
    border: '1px solid',
    borderColor: 'divider',
    '&:not(:last-child)': { borderBottom: 0 },
    '&:first-of-type': { borderRadius: '12px 12px 0 0' },
    '&:last-of-type': { borderRadius: '0 0 12px 12px' },
    '&:only-of-type': { borderRadius: '12px' },
    '&::before': { display: 'none' },
    bgcolor: 'background.paper',
  };
}

function isFaqItem(item: unknown): item is FaqItem {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Partial<FaqItem>;

  return (
    typeof candidate.question === 'string' &&
    typeof candidate.answer === 'string'
  );
}

function normalizeFaqItems(rawItems: unknown): FaqItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.filter(isFaqItem);
}

export function Faq({
  items,
  idPrefix,
  variant = 'grouped',
  defaultExpandedIndex = null,
  answerVariant = 'body1',
  questionFontWeight = 700,
  sx,
}: FaqProps) {
  const isSeparated = variant === 'separated';

  return (
    <Box sx={sx}>
      {items.map(({ question, answer }, index) => {
        const controlId = `${idPrefix}-question-${index}`;
        const panelId = `${idPrefix}-answer-${index}`;

        return (
          <Accordion
            key={controlId}
            disableGutters
            elevation={0}
            defaultExpanded={
              defaultExpandedIndex !== null && defaultExpandedIndex === index
            }
            sx={getAccordionSx(variant)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={panelId}
              id={controlId}
              sx={{
                px: isSeparated ? { xs: 2, md: 3 } : { xs: 2.5, md: 3 },
                py: isSeparated ? 1 : 0.5,
                '& .MuiAccordionSummary-content': {
                  my: isSeparated ? 0 : 2,
                },
              }}
            >
              <Typography
                variant="subtitle1"
                component="span"
                sx={{
                  fontWeight: questionFontWeight,
                  lineHeight: 1.4,
                }}
              >
                {question}
              </Typography>
            </AccordionSummary>

            {/* Do not add id={panelId} here.
                MUI uses AccordionSummary's aria-controls value
                to create the region ID internally. */}
            <AccordionDetails
              sx={{
                px: isSeparated ? { xs: 2, md: 3 } : { xs: 2.5, md: 3 },
                pb: isSeparated ? 2.5 : 3,
                pt: 0,
              }}
            >
              <Typography
                variant={answerVariant}
                color="text.secondary"
                sx={{
                  lineHeight: isSeparated ? 1.8 : 1.7,
                  whiteSpace: 'pre-line',
                }}
              >
                {answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

export function FaqSection({
  title,
  headingId,
  headingComponent = 'h2',
  subtitle,
  containerMaxWidth = 'md',
  muted = false,
  items,
  idPrefix,
  variant = 'grouped',
  defaultExpandedIndex = null,
  answerVariant = 'body1',
  questionFontWeight = 700,
  sx,
  ...sectionProps
}: FaqSectionProps) {
  const isSeparated = variant === 'separated';

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={[
        {
          py: isSeparated ? { xs: 7, md: 9 } : { xs: 8, md: 10 },
          px: 2,
          bgcolor: muted ? 'background.default' : 'background.paper',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...sectionProps}
    >
      <Container maxWidth={containerMaxWidth}>
        <Stack spacing={isSeparated ? 0 : 5}>
          <Stack spacing={subtitle ? 2 : 0} sx={{ textAlign: 'center' }}>
            <Typography
              id={headingId}
              component={headingComponent}
              variant={headingComponent === 'h1' ? 'h1' : 'h2'}
              sx={{
                fontWeight: 800,
                fontSize:
                  headingComponent === 'h1'
                    ? { xs: '1.85rem', md: '2.5rem' }
                    : isSeparated
                      ? { xs: '1.6rem', md: '2rem' }
                      : { xs: '1.75rem', md: '2.25rem' },
                lineHeight: headingComponent === 'h1' ? 1.15 : 1.2,
                mb: isSeparated ? { xs: 3, md: 4 } : 0,
                textAlign: isSeparated ? 'start' : 'center',
              }}
            >
              {title}
            </Typography>

            {subtitle ? (
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  maxWidth: 680,
                  mx: 'auto',
                  lineHeight: 1.65,
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Stack>

          <Faq
            items={items}
            idPrefix={idPrefix}
            variant={variant}
            defaultExpandedIndex={defaultExpandedIndex}
            answerVariant={answerVariant}
            questionFontWeight={questionFontWeight}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export function FaqSectionFromNamespace({
  namespace,
  titleKey = 'title',
  itemsKey = 'items',
  ...sectionProps
}: FaqSectionFromNamespaceProps) {
  const t = useTranslations(namespace);
  const items = normalizeFaqItems(t.raw(itemsKey));

  return <FaqSection title={t(titleKey)} items={items} {...sectionProps} />;
}
