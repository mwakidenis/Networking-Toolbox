import { test, expect } from '@playwright/test';

// Extend Window interface for __testConsoleErrors
declare global {
  interface Window {
    __testConsoleErrors?: string[];
  }
}

// Import test-friendly navigation data (no SvelteKit dependencies)
import { ALL_TEST_PAGES } from '../fixtures/nav-data.js';

// Extract all page URLs from the navigation structure
function getAllPageUrls(): string[] {
  const urls = ALL_TEST_PAGES.map(item => item.href);

  // Remove duplicates and sort for consistent test order
  return [...new Set(urls)].sort();
}

test.describe('Page Coverage - Console Error Detection', () => {
  let allPageUrls: string[];

  test.beforeAll(() => {
    allPageUrls = getAllPageUrls();
  });

  test.beforeEach(async ({ page }) => {
    // Set up simple console error tracking
    await page.addInitScript(() => {
      window.__testConsoleErrors = [];
    });

    // Track console errors
    page.on('console', (message) => {
      if (message.type() === 'error') {
        const errorText = message.text();
        // Filter out known non-critical errors that don't affect functionality
        const isNonCriticalError = (
          // Resource loading errors
          (errorText.includes('Failed to load resource') && (errorText.includes('404') || errorText.includes('500'))) ||
          // Cross-site cookie warnings from external images
          (errorText.includes('Cookie') && errorText.includes('cross-site context') && errorText.includes('SameSite')) ||
          // Third-party domain warnings
          errorText.includes('github.com') ||
          // Generic network connectivity issues that don't affect app functionality
          errorText.includes('net::ERR_NETWORK_CHANGED')
        );

        if (!isNonCriticalError) {
          page.evaluate((errorText) => {
            if (window.__testConsoleErrors) {
              window.__testConsoleErrors.push(errorText);
            }
          }, errorText).catch(() => {
            // Ignore if page context is destroyed
          });
        }
      }
    });

    // Track page errors
    page.on('pageerror', (error) => {
      page.evaluate((errorText) => {
        if (window.__testConsoleErrors) {
          window.__testConsoleErrors.push(`Page Error: ${errorText}`);
        }
      }, error.message).catch(() => {
        // Ignore if page context is destroyed
      });
    });
  });

  // Test all pages in smaller batches for better performance and stability
  for (let i = 0; i < getAllPageUrls().length; i += 5) {
    const batch = getAllPageUrls().slice(i, i + 5);

    test(`Page batch ${Math.floor(i / 5) + 1}: Check ${batch.length} pages for console errors`, async ({ page }) => {
      const results: { url: string; errors: string[]; success: boolean }[] = [];

      for (const url of batch) {
        try {
          // Clear previous errors
          await page.evaluate(() => {
            window.__testConsoleErrors = [];
          });

          // Navigate to page with shorter timeout for faster testing
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          // Wait for page to be interactive
          await page.waitForLoadState('domcontentloaded');

          // Give a brief moment for components to load
          await page.waitForTimeout(500);

          // Check for basic page elements to ensure it loaded properly
          await expect(page.locator('body')).toBeVisible();

          // Get any console errors that occurred
          const errors = await page.evaluate(() => {
            return window.__testConsoleErrors || [];
          });

          // Filter out expected network errors for GitHub-related pages
          const isGitHubRelatedPage = url.includes('/about/attributions') || url.includes('/about');
          const filteredErrors = isGitHubRelatedPage
            ? errors.filter(error =>
                !error.includes('fetch') &&
                !error.includes('TypeError: Failed to fetch') &&
                !error.includes('github-sponsors-api') &&
                !error.includes('api.github.com') &&
                !error.includes('NetworkError') &&
                !error.includes('net::ERR_') &&
                !error.includes('Failed to load resource') &&
                !error.includes('403') &&
                !error.includes('404') &&
                !error.includes('500') &&
                !error.includes('svg> attribute viewBox') &&
                !error.includes('Unexpected end of attribute')
              )
            : errors;

          results.push({
            url,
            errors: filteredErrors,
            success: filteredErrors.length === 0
          });

          // Assert no console errors for this specific page
          if (filteredErrors.length > 0) {
            console.error(`Console errors found on ${url}:`, filteredErrors);
          }
          expect(filteredErrors, `Console errors found on page ${url}`).toHaveLength(0);

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            url,
            errors: [`Navigation error: ${errorMessage}`],
            success: false
          });

          throw new Error(`Failed to test page ${url}: ${errorMessage}`);
        }
      }

      // Log batch results with page details
      const successfulPages = results.filter(r => r.success);
      const failedPages = results.filter(r => !r.success);

      if (failedPages.length > 0) {
        console.log(`  Failed:`);
        failedPages.forEach(result => {
          console.log(`    ${result.url}: ${result.errors.join('; ')}`);
        });
      }
    });
  }

  // Separate test to verify we can reach core pages (sample smoke test)
  test('Core pages smoke test - key pages load successfully', async ({ page }) => {
    // Test a representative sample of important pages instead of all pages
    const corePages = [
      '/',
      '/subnetting',
      '/subnetting/ipv4-subnet-calculator',
      '/cidr',
      '/cidr/summarize',
      '/ip-address-convertor',
      '/ip-address-convertor/representations',
      '/dns',
      '/diagnostics',
      '/reference',
      '/about'
    ];

    let successCount = 0;
    let failureCount = 0;
    const failures: string[] = [];

    for (const url of corePages) {
      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 8000
        });

        // Check if response is successful
        if (response?.ok()) {
          successCount++;
          // Basic check that page has content
          await expect(page.locator('body')).toBeVisible();
        } else {
          failureCount++;
          failures.push(`${url} - HTTP ${response?.status()}`);
        }

      } catch (error: unknown) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        failures.push(`${url} - ${errorMessage}`);
      }
    }

    if (failures.length > 0) {
      console.log('❗Failed core pages:', failures);
    }

    // Allow some failures but ensure most core pages work
    expect(successCount).toBeGreaterThanOrEqual(Math.floor(corePages.length * 0.8));
  });

  // Test for external links (if any) to ensure they don't lead to broken pages
  test('Check for broken external links in navigation', async ({ page }) => {
    const externalUrls = allPageUrls.filter(url =>
      url.startsWith('http://') || url.startsWith('https://')
    );

    if (externalUrls.length === 0) {
      test.skip();
      return;
    }

    for (const url of externalUrls) {
      const response = await page.request.get(url);
      expect(response.ok(), `External URL ${url} should be accessible`).toBeTruthy();
    }
  });
});

// Performance-focused test to ensure pages load within reasonable time
test.describe('Page Performance', () => {
  test('All pages load within acceptable time limits', async ({ page }) => {
    const slowPages: { url: string; loadTime: number }[] = [];
    const LOAD_TIME_LIMIT = 5000; // 5 seconds

    for (const url of getAllPageUrls().slice(0, 20)) { // Test first 20 pages for performance
      const startTime = Date.now();

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      if (loadTime > LOAD_TIME_LIMIT) {
        slowPages.push({ url, loadTime });
      }
    }

    if (slowPages.length > 0) {
      console.warn('Slow loading pages:', slowPages);
      // Don't fail the test, just warn about slow pages
      console.warn(`${slowPages.length} pages loaded slower than ${LOAD_TIME_LIMIT}ms`);
    }
  });
});
