import { describe, expect, it } from 'vitest';

import { createPageMetadata } from '@/lib/seo/metadata';

describe('createPageMetadata', () => {
  it('uses an absolute JPEG OG image URL for social crawlers', () => {
    const metadata = createPageMetadata({
      locale: 'he',
      path: '/share/test-token',
      title: 'Shared accessibility audit',
      description: 'A shared accessibility audit report.',
    });

    const ogImages = metadata.openGraph?.images;
    const ogImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
    const imageUrl =
      typeof ogImage === 'string'
        ? ogImage
        : ogImage instanceof URL
          ? ogImage.toString()
          : ogImage?.url?.toString();

    const twitterImages = metadata.twitter?.images;
    const twitterImage = Array.isArray(twitterImages)
      ? twitterImages[0]
      : twitterImages;

    expect(imageUrl).toMatch(/^https?:\/\/.+\/og-image\.jpg$/);
    expect(
      typeof twitterImage === 'string'
        ? twitterImage
        : twitterImage?.toString(),
    ).toBe(imageUrl);

    if (ogImage && typeof ogImage === 'object' && !(ogImage instanceof URL)) {
      expect(ogImage.type).toBe('image/jpeg');
      expect(ogImage.secureUrl?.toString()).toBe(imageUrl);
    }
  });
});
