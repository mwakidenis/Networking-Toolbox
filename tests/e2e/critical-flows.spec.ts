import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that page loaded successfully
    await expect(page.locator('body')).toBeVisible();

    // Check that navigation is present (use first nav to avoid strict mode)
    await expect(page.locator('nav').first()).toBeVisible();

    // Check that main tools are accessible
    await expect(page.locator('a[href*="subnet"]').first()).toBeVisible();
    await expect(page.locator('a[href*="cidr"]').first()).toBeVisible();

    // Verify the page has content and is functional
    await expect(page).toHaveURL('/');
  });

  test('subnet calculator is accessible', async ({ page }) => {
    await page.goto('/subnetting/ipv4-subnet-calculator');
    await page.waitForLoadState('networkidle');

    // Check that page loaded with any content
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main, article, section').first()).toBeVisible();

    // Check for input fields
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('CIDR calculator is accessible', async ({ page }) => {
    await page.goto('/cidr/mask-converter/cidr-to-subnet-mask');
    await page.waitForLoadState('networkidle');

    // Check that page loaded
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main, article, section').first()).toBeVisible();

    // Check for calculation interface
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('reference section is accessible', async ({ page }) => {
    await page.goto('/reference');
    await page.waitForLoadState('networkidle');

    // Check that reference content loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main, article, section').first()).toBeVisible();

    // Check for reference links or content
    await expect(page.locator('a').first()).toBeVisible();
  });

  test('site navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that we can navigate to different sections
    await page.goto('/subnetting');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/cidr');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/reference');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});