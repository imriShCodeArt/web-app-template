import type { ReactNode } from 'react';

import { Container, type PageContentLayout } from '@/components/ui/Container';

type ContainerPageViewProps = {
  layout: PageContentLayout;
  children: ReactNode;
};

/** Authenticated / utility pages that render inside a regulated `Container` shell. */
export function ContainerPageView({
  layout,
  children,
}: ContainerPageViewProps) {
  return <Container layout={layout}>{children}</Container>;
}
