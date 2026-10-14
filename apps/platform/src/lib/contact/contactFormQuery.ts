export const CONTACT_INTEREST_KEYS = [
  'scan',
  'consulting',
  'remediation',
  'other',
] as const;

export type ContactInterestKey = (typeof CONTACT_INTEREST_KEYS)[number];

export const CONTACT_FORM_PRESET_KEYS = {
  remediationQuote: 'remediationQuote',
  reportRequest: 'reportRequest',
  consultingRequest: 'consultingRequest',
} as const;

export type ContactFormPresetKey =
  (typeof CONTACT_FORM_PRESET_KEYS)[keyof typeof CONTACT_FORM_PRESET_KEYS];

export const CONTACT_FORM_PRESET_MESSAGE_KEYS: Record<
  ContactFormPresetKey,
  'presetRemediationQuote' | 'presetReportRequest' | 'presetConsultingRequest'
> = {
  remediationQuote: 'presetRemediationQuote',
  reportRequest: 'presetReportRequest',
  consultingRequest: 'presetConsultingRequest',
};

export function parseContactInterest(
  value: string | undefined,
): ContactInterestKey | undefined {
  if (!value) {
    return undefined;
  }

  return CONTACT_INTEREST_KEYS.includes(value as ContactInterestKey)
    ? (value as ContactInterestKey)
    : undefined;
}

export function parseContactFormPreset(
  value: string | undefined,
): ContactFormPresetKey | undefined {
  if (
    value &&
    Object.values(CONTACT_FORM_PRESET_KEYS).includes(
      value as ContactFormPresetKey,
    )
  ) {
    return value as ContactFormPresetKey;
  }

  return undefined;
}

export function buildContactHref({
  interest,
  preset,
}: {
  interest?: ContactInterestKey;
  preset?: ContactFormPresetKey;
}) {
  const params = new URLSearchParams();

  if (interest) {
    params.set('interest', interest);
  }

  if (preset) {
    params.set('preset', preset);
  }

  const query = params.toString();
  return query ? `/contact?${query}` : '/contact';
}
