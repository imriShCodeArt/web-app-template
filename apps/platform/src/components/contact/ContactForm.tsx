'use client';

import { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';

import type { ContactErrorCode } from '@/lib/contact/contactApi';
import {
  CONTACT_INTEREST_KEYS,
  type ContactInterestKey,
} from '@/lib/contact/contactFormQuery';
import { isValidPhone } from '@/lib/contact/validatePhone';
import { track, type TrackingErrorType } from '@/lib/tracking/analytics';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

const MESSAGE_MIN = 0;
const SUBJECT_MIN = 2;

type InterestKey = ContactInterestKey;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type ContactFormProps = {
  /** When true, includes subject + message (e.g. on the dedicated contact page). */
  extended?: boolean;
  /** Page layout: stacked fields, interest chips, optional company. */
  variant?: 'default' | 'page';
  /** Element id for the section title (`aria-labelledby` / landmark). */
  headingId?: string;
  /** Pre-select an interest chip (e.g. from `/contact?interest=remediation`). */
  defaultInterest?: InterestKey;
  /** Pre-fill the details/message field. */
  defaultMessage?: string;
};

export function ContactForm({
  extended = false,
  variant = 'default',
  headingId = 'footer-contact-heading',
  defaultInterest,
  defaultMessage = '',
}: ContactFormProps) {
  const t = useTranslations('footer.contactForm');
  const theme = useTheme();
  const isPageVariant = variant === 'page';
  const formName =
    extended || isPageVariant ? 'contact_page_form' : 'footer_contact_form';

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState<InterestKey | null>(
    defaultInterest ?? null,
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  function interestLabel(key: InterestKey): string {
    const map: Record<InterestKey, string> = {
      scan: t('interestScan'),
      consulting: t('interestConsulting'),
      remediation: t('interestRemediation'),
      other: t('interestOther'),
    };
    return map[key];
  }

  function handleFormStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('form_start', {
      form_name: formName,
      lead_type: 'contact_form',
    });
  }

  function setTrackedError(message: string, errorType: TrackingErrorType) {
    setError(message);
    track('form_error', {
      form_name: formName,
      lead_type: 'contact_form',
      error_type: errorType,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleFormStart();
    setError(null);
    setSuccess(false);

    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    let trimmedSubject = subject.trim();
    if (isPageVariant && interest) {
      trimmedSubject = interestLabel(interest);
    }

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setTrackedError(t('errorRequired'), 'required_field');
      return;
    }

    if (extended && !isPageVariant) {
      if (trimmedSubject.length < SUBJECT_MIN) {
        setTrackedError(
          t('errorSubjectMin', { min: SUBJECT_MIN }),
          'required_field',
        );
        return;
      }
      if (trimmedMessage.length < MESSAGE_MIN) {
        setTrackedError(
          t('errorMessageMin', { min: MESSAGE_MIN }),
          'required_field',
        );
        return;
      }
    }

    if (!isValidEmail(trimmedEmail)) {
      setTrackedError(t('errorEmail'), 'invalid_email');
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setTrackedError(t('errorPhone'), 'invalid_phone');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      };

      if (trimmedCompany) {
        payload.company = trimmedCompany;
      }

      if (extended || isPageVariant) {
        payload.subject = trimmedSubject;
        if (trimmedMessage) {
          payload.message = trimmedMessage;
        }
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: { ok?: boolean; code?: ContactErrorCode } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        // ignore non-JSON
      }

      if (res.status === 503 && data.code === 'NOT_CONFIGURED') {
        setTrackedError(t('errorNotConfigured'), 'submission_error');
        return;
      }

      if (!res.ok) {
        setTrackedError(t('errorGeneric'), 'submission_error');
        return;
      }

      track('generate_lead', {
        form_name: formName,
        lead_type: 'contact_form',
      });
      setSuccess(true);
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setInterest(null);
      setSubject('');
      setMessage('');
    } catch {
      setTrackedError(t('errorGeneric'), 'submission_error');
    } finally {
      setSubmitting(false);
    }
  }

  const pageCardSx = isPageVariant
    ? {
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        boxShadow: `0 24px 70px ${alpha(theme.palette.common.black, 0.08)}`,
      }
    : {
        p: { xs: 2.5, md: 3 },
        borderRadius: 2.5,
        mb: { xs: 4, md: 6 },
        mx: { xs: '1em', md: '3em' },
      };

  return (
    <Paper
      elevation={isPageVariant ? 2 : 3}
      variant="elevation"
      component="section"
      aria-labelledby={headingId}
      sx={{ ...pageCardSx, position: 'relative' }}
    >
      <Stack spacing={2.5}>
        {!isPageVariant ? (
          <Box>
            <Typography
              id={headingId}
              variant="h6"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {extended ? t('descriptionExtended') : t('description')}
            </Typography>
          </Box>
        ) : (
          <Typography
            id={headingId}
            component="h2"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {t('title')}
          </Typography>
        )}

        {success && <Alert severity="success">{t('success')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit}
          onFocusCapture={handleFormStart}
          noValidate
        >
          <Stack spacing={2.25}>
            {isPageVariant ? (
              <>
                <TextField
                  label={t('nameLabel')}
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={submitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('companyLabel')}
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  disabled={submitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('phoneLabel')}
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                  disabled={submitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('emailLabel')}
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Box>
                  <Typography
                    id="contact-interest-label"
                    variant="body2"
                    component="p"
                    sx={{
                      mb: 1.25,
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {t('interestLabel')}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    value={interest}
                    onChange={(_e, value: InterestKey | null) => {
                      if (value) setInterest(value);
                    }}
                    aria-labelledby="contact-interest-label"
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      '& .MuiToggleButtonGroup-grouped': {
                        border: 0,
                        borderRadius: '999px !important',
                        m: 0,
                      },
                    }}
                  >
                    {CONTACT_INTEREST_KEYS.map((key) => {
                      const selected = interest === key;
                      return (
                        <ToggleButton
                          key={key}
                          value={key}
                          disabled={submitting}
                          sx={{
                            px: 2,
                            py: 0.85,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '999px',
                            border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
                            bgcolor: selected ? 'primary.main' : 'action.hover',
                            color: 'text.primary',
                            transition: 'background-color .3s ease ',
                            '&:hover': {
                              bgcolor: selected
                                ? 'primary.main'
                                : alpha(theme.palette.primary.main, 0.18),
                            },
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'text.primary',
                              '&:hover': { bgcolor: 'primary.light' },
                            },
                          }}
                        >
                          {interestLabel(key)}
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                </Box>

                <TextField
                  label={t('detailsLabel')}
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={10}
                  disabled={submitting}
                  helperText={t('detailsHelper')}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { maxLength: 8000 },
                  }}
                />
              </>
            ) : (
              <>
                <Grid container spacing={2} columns={12}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label={t('nameLabel')}
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                      fullWidth
                      disabled={submitting}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label={t('emailLabel')}
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      fullWidth
                      disabled={submitting}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label={t('phoneLabel')}
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      required
                      fullWidth
                      disabled={submitting}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                </Grid>

                {extended ? (
                  <>
                    <TextField
                      label={t('subjectLabel')}
                      name="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      fullWidth
                      disabled={submitting}
                      helperText={t('subjectHelper')}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { maxLength: 200 },
                      }}
                    />
                    <TextField
                      label={t('messageLabel')}
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      fullWidth
                      multiline
                      minRows={5}
                      maxRows={16}
                      disabled={submitting}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { maxLength: 8000 },
                      }}
                    />
                  </>
                ) : null}
              </>
            )}
          </Stack>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={submitting}
            onClick={withCtaTracking(undefined, 'contact_submit', formName)}
            sx={{
              mt: 2.5,
              py: 1.35,
              fontSize: '1.05rem',
              ...(isPageVariant
                ? {
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.light' },
                  }
                : { alignSelf: 'flex-start' }),
            }}
          >
            {submitting ? t('sending') : t('submit')}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
