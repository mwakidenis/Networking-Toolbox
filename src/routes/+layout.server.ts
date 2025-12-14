import { site } from '$lib/constants/site';
import type { LayoutServerLoad } from './$types';
import { TOP_NAV, SUB_NAV, type NavItem } from '$lib/constants/nav';

export const prerender = true; // Enable prerendering for all pages using this layout

function findNavItem(href: string): NavItem | null {
  const top = TOP_NAV.find((i) => i.href === href);
  if (top) return top;
  for (const items of Object.values(SUB_NAV)) {
    for (const item of items) {
      if ('href' in item && item.href === href) return item;
      if ('items' in item) {
        const found = item.items.find((sub) => sub.href === href);
        if (found) return found;
      }
    }
  }
  return null;
}

function generateBreadcrumbJsonLd(pathname: string) {
  if (pathname === '/') return null;

  const segs = pathname.split('/').filter(Boolean);
  const items: Array<{ '@type': string; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
  ];
  let pos = 2;
  let curr = '';
  for (const s of segs) {
    curr += '/' + s;
    const navItem = findNavItem(curr);
    const label =
      navItem?.label ??
      s
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    items.push({
      '@type': 'ListItem',
      position: pos++,
      name: label,
      item: site.url + curr,
    });
  }

  if (items.length <= 1) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export const load: LayoutServerLoad = async ({ url }) => {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(url.pathname);
  return { breadcrumbJsonLd };
};
