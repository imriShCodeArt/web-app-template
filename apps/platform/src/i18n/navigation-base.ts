import { createLocaleNavigation } from '@template/i18n/navigation';

import { routing } from './routing-config';

export const {
  Link: IntlLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createLocaleNavigation(routing);
