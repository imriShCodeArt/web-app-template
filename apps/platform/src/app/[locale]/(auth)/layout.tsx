import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { privatePageRobots } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  robots: privatePageRobots,
};

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return children;
}
