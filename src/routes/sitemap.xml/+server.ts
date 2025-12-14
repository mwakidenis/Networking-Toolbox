import { ALL_PAGES, TOP_NAV, footerLinks, aboutPages } from '$lib/constants/nav';
import { site } from '$lib/constants/site';

export const prerender = true;

/**
 * Dynamic sitemap.xml endpoint
 *
 * Generates a sitemap from the page structure in nav.ts, for search engines
 * With a priority, change frequency, lastmod date and caching headers
 */
export async function GET() {
  // Collect all unique URLs
  const urls = new Set<string>();

  // Add homepage
  urls.add('/');

  // Add top-level navigation pages
  TOP_NAV.forEach((item) => urls.add(item.href));

  // Add all pages from the navigation structure
  ALL_PAGES.forEach((item) => urls.add(item.href));

  // Add about pages
  aboutPages.forEach((item) => urls.add(item.href));

  // Add footer pages (about, etc.)
  footerLinks.forEach((item) => {
    // Only include internal links (not external GitHub, etc.)
    if (item.href.startsWith('/')) {
      urls.add(item.href);
    }
  });

  // Extract and add parent paths for intermediate directories
  // e.g., from /cidr/mask-converter/cidr-to-subnet-mask, also add /cidr/mask-converter/
  const allUrls = Array.from(urls);
  allUrls.forEach((url) => {
    const segments = url.split('/').filter(Boolean);
    // Generate all parent paths
    for (let i = 1; i < segments.length; i++) {
      const parentPath = '/' + segments.slice(0, i).join('/');
      if (parentPath !== '/' && !urls.has(parentPath)) {
        urls.add(parentPath);
      }
    }
  });

  // Convert to sorted array for consistent output
  const sortedUrls = Array.from(urls).sort();

  // Generate current timestamp for lastmod
  const now = new Date().toISOString();

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
	xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xhtml="https://www.w3.org/1999/xhtml"
	xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
	xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
	xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
	xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
${sortedUrls
  .map((url) => {
    // Determine priority based on URL depth and importance
    let priority: string;
    if (url === '/') {
      priority = '1.0'; // Homepage gets highest priority
    } else if (TOP_NAV.some((item) => item.href === url)) {
      priority = '0.9'; // Top navigation pages
    } else if (url.split('/').length === 2) {
      priority = '0.8'; // Section landing pages
    } else if (url.split('/').length === 3) {
      priority = '0.7'; // Tool pages
    } else {
      priority = '0.6'; // Deep nested pages
    }

    // Determine change frequency based on page type
    let changefreq: string;
    if (url === '/') {
      changefreq = 'weekly';
    } else if (url === '/about') {
      changefreq = 'monthly';
    } else if (url.startsWith('/reference/')) {
      changefreq = 'weekly';
    } else {
      changefreq = 'monthly';
    }

    return `	<url>
		<loc>${site.url}${url}</loc>
		<lastmod>${now}</lastmod>
		<changefreq>${changefreq}</changefreq>
		<priority>${priority}</priority>
	</url>`;
  })
  .join('\n')}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600, s-maxage=86400', // Cache for 1 hour, CDN for 1 day
    },
  });
}
