import { ALL_PAGES, SUB_NAV, type NavItem, type NavGroup } from '$lib/constants/nav';

// Helper function to extract nav items from mixed structure
function extractNavItems(items: (NavItem | NavGroup)[]): NavItem[] {
  const navItems: NavItem[] = [];
  for (const item of items) {
    if ('href' in item) {
      navItems.push(item);
    } else if ('title' in item && 'items' in item) {
      navItems.push(...item.items);
    }
  }
  return navItems;
}

export function load() {
  // Precompute tool and reference pages on server/initial load
  const referencePages = extractNavItems(SUB_NAV['/reference'] || []);
  const toolPages = ALL_PAGES.filter(
    (page) =>
      !page.href.startsWith('/reference') && !page.href.startsWith('/bookmarks') && !page.href.startsWith('/offline'),
  );

  return {
    toolPages,
    referencePages,
  };
}
