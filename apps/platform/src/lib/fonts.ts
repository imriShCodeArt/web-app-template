import { Noto_Sans_Hebrew } from 'next/font/google';

/** Self-hosted via next/font — replaces five @fontsource CSS imports. */
export const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-sans-hebrew',
  preload: true,
  adjustFontFallback: true,
  fallback: ['Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
});
