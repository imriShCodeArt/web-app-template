'use client';

import { type ReactNode, useState } from 'react';

type MarketingConsentSessionProps = {
  initialMarketingConsent: boolean;
  children: (ctx: {
    marketingConsent: boolean;
    setMarketingConsent: (value: boolean) => void;
  }) => ReactNode;
};

/** Resets local state when the parent changes this component's `key`. */
export function MarketingConsentSession({
  initialMarketingConsent,
  children,
}: MarketingConsentSessionProps) {
  const [marketingConsent, setMarketingConsent] = useState(
    initialMarketingConsent,
  );

  return <>{children({ marketingConsent, setMarketingConsent })}</>;
}
