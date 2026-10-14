import type { NavItem } from '@/config/navigation';

/** Expands nav items with children into a flat list (parent, then each child). */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => {
    if (!item.children?.length) {
      return [item];
    }

    const { children, ...parent } = item;
    return [parent, ...children];
  });
}
