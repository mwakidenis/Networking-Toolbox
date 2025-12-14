import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('version store', () => {
  beforeEach(() => {
    // Reset modules to get fresh store
    vi.resetModules();
    // Clear all mocks
    global.fetch = vi.fn();
  });

  it('initializes with fallback version', async () => {
    const { appVersion } = await import('../../../../src/lib/stores/version');
    const value = get(appVersion);
    expect(value).toBe('0.2.5');
  });

  it('fetches version from API on initialization', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ version: '1.2.3' }),
    });
    global.fetch = mockFetch;

    const { appVersion, initializeVersion } = await import('../../../../src/lib/stores/version');
    await initializeVersion();

    expect(mockFetch).toHaveBeenCalledWith('/version');
    expect(get(appVersion)).toBe('1.2.3');
  });

  it('keeps fallback version on API error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const { appVersion, initializeVersion } = await import('../../../../src/lib/stores/version');
    await initializeVersion();

    expect(get(appVersion)).toBe('0.2.5');
  });

  it('keeps fallback version on invalid JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });
    global.fetch = mockFetch;

    const { appVersion, initializeVersion } = await import('../../../../src/lib/stores/version');
    await initializeVersion();

    expect(get(appVersion)).toBe('0.2.5');
  });

  it('updates version when API returns new version', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ version: '2.0.0' }),
    });
    global.fetch = mockFetch;

    const { appVersion, initializeVersion } = await import('../../../../src/lib/stores/version');
    expect(get(appVersion)).toBe('0.2.5');

    await initializeVersion();
    expect(get(appVersion)).toBe('2.0.0');
  });
});
