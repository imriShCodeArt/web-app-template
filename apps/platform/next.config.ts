import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Bake the transport into client JS at `next build`. Dashboard changes
  // still require a redeploy; this makes the inlined value match the env
  // present during that build (empty → app default `legacy`).
  env: {
    NEXT_PUBLIC_ANALYTICS_TRANSPORT:
      process.env.NEXT_PUBLIC_ANALYTICS_TRANSPORT ?? '',
  },
  // Next 16.3 enables immutable static assets by default. Vercel CLI still
  // patches preview comments after upload, which fails with:
  // "Cannot patch preview comments when immutable static file upload is enabled."
  supportsImmutableAssets: false,
  // These are TypeScript-source-only workspace packages (no build step);
  // Next.js compiles them alongside app code.
  transpilePackages: [
    '@template/config',
    '@template/db',
    '@template/auth',
    '@template/i18n',
    '@template/ui',
  ],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
