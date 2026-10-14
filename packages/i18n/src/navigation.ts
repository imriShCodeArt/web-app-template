/**
 * Separate entry point (not re-exported from the package root) so consumers
 * that only need locale constants don't eagerly load `next-intl/navigation`,
 * which some test/runtime environments resolve more strictly than webpack.
 */
export { createLocaleNavigation } from './create-navigation';
