export type AccountProfilePayload = {
  name: string | null;
  email: string | null;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  locale: string;
  marketingConsent: boolean;
};

export type AccountTabsProps = {
  profile: AccountProfilePayload;
  profileVersion: string;
  signOutLabel: string;
};
